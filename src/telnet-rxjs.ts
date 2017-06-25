import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import * as tls from 'tls';
import * as url from 'url';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

export class Telnet {
  public static client(hostUrl: string, options: any = {}) {
    let client: Telnet.Connection;

    if (!hostUrl) {
      throw new Error('No host URL given');
    }

    if (!options.clientClass) {
      options.clientClass = Telnet.Connection;
    }

    const parts = hostUrl.split(':');
    if (parts.length === 2) {
      hostUrl = `telnet:${parts[0]}:${parts[1]}`;
    }

    client = new options.clientClass(url.parse(hostUrl), options);
    return client;
  }

  public static server(hostUrl: string | number, options: any = {}) {
    let server: Telnet.Server;

    if (!hostUrl) {
      throw new Error('No host URL given');
    }

    if (typeof hostUrl === 'number') {
      hostUrl = `telnet:0.0.0.0:${hostUrl}`;
    }

    if (!options.serverClass) {
      options.serverClass = Telnet.Server;
    }

    const parts = hostUrl.split(':');
    if (parts.length === 1) {
      hostUrl = `telnet:0.0.0.0:${parts[0]}`;
    } else if (parts.length === 2) {
      hostUrl = `telnet:${parts[0]}:${parts[1]}`;
    }

    server = new options.serverClass(url.parse(hostUrl), options);
    return server;
  }
}

export namespace Telnet {
  export const EOL = '\r\n';
  export const DEFAULT_ENCODING = 'utf8';

  export namespace Commands {
    export const SE = 240;
    export const NOP = 241;
    export const DM = 242;
    export const BRK = 243;
    export const IP = 244;
    export const AO = 245;
    export const AYT = 246;
    export const EC = 247;
    export const EL = 248;
    export const GA = 249;
    export const SB = 250;

    export const WILL = 251;
    export const WONT = 252;
    export const DO = 253;
    export const DONT = 254;
    export const IAC = 255;

    export const ECHO = 1;
    export const SUPPRESS_GO_AHEAD = 3;
    export const STATUS = 5;
    export const TIMING_MARK = 6;
    export const TERMINAL_TYPE = 24;
    export const WINDOW_SIZE = 31;
    export const TERMINAL_SPEED = 32;
    export const REMOTE_FLOW_CONTROL = 33;
    export const LINEMODE = 34;
    export const ENVIRONMENT_VARIABLES = 36;
  }

  export class Event {
    public timestamp: Date;

    constructor() {
      this.timestamp = new Date();
    }
  }

  export namespace Event {
    export class ConnectionChange extends Telnet.Event { }

    export class Connecting extends ConnectionChange { }

    export class Connected extends ConnectionChange { }

    export class Disconnecting extends ConnectionChange { }

    export class Disconnected extends ConnectionChange { }

    export class Data extends Telnet.Event {
      public data: string;

      constructor(data: string) {
        super();
        this.data = data;
      }
    }

    export class Command extends Telnet.Event {
      public command: number[];

      constructor(command: number[]) {
        super();
        this.command = command;
      }
    }

    export class Server extends Telnet.Event { }

    export class ClientConnected extends Server {
      public connection: Telnet.Connection;

      constructor(connection: Telnet.Connection) {
        super();
        this.connection = connection;
      }
    }

    export class ClientDisconnected extends Server {
      public connection: Telnet.Connection;

      constructor(connection: Telnet.Connection) {
        super();
        this.connection = connection;
      }
    }

    export class Listening extends Server { }
  }

  export class Connection extends ReplaySubject<Telnet.Event> {
    private connection: tls.TLSSocket | net.Socket | null;

    constructor(private options: Connection.IOptions = {}) {
      super();
      if (options.connection) {
        this.connection = options.connection;
      }
    }

    /**
     * An observable that tracks the data being sent to the client
     */
    get data(): Observable<string> {
      return this.filter((event) => event instanceof Telnet.Event.Data)
        .map((event: Telnet.Event.Data) => event.data);
    }

    /**
     * An observable that tracks any telnet commands sent to the client
     */
    get commands(): Observable<number[]> {
      return this.filter((event) => event instanceof Telnet.Event.Command)
        .map((event: Telnet.Event.Command) => event.command);
    }

    /**
     * Sends the given string to the server.
     *
     * @param data the string to send to the server
     */
    public send(data: string) {
      if (!this.connection) {
        return;
      }

      this.connection.write(data);
    }

    /**
     * Sends the given string to the server and then sends an EOL ("\r\n").
     *
     * @param data the string to send to the server
     */
    public sendln(data: string) {
      this.send(data);
      this.send(Telnet.EOL);
    }

    /**
     * Connects to the server URI that was passed in with the constructor
     * @throws an error if the client cannot connect
     */
    public connect() {
      if (!this.connection) {
        if (!this.options.remoteUrl) {
          throw new Error('No remoteUrl is defined');
        }

        this.next(new Telnet.Event.Connecting());
        const protocol = this.options.remoteUrl.protocol || 'telnet:';

        if (!this.options.remoteUrl.port) {
          throw new Error('A port is required to connect to.');
        }

        switch (protocol) {
          case 'telnet:':
            this.connection = this.connectNoTls(this.options.remoteUrl);
            break;
          case 'telnets:':
            this.connection = this.connectTls(this.options.remoteUrl);
            break;
          default:
            throw new Error(this.options.remoteUrl.protocol + ' is not a supported protocol');
        }
      }

      this.connection.on('error', (error: any) => {
        this.error(error);
      });

      this.connection.on('data', (data: number[]) => {
        const buffer = Buffer.alloc(data.length);
        let copied = 0;
        for (let cursor = 0; cursor < data.length; ++cursor) {
          if (data[cursor] === Telnet.Commands.IAC) {
            cursor = this.handleTelnetCommand(data, cursor);
          } else {
            buffer[copied++] = data[cursor];
          }
        }

        this.next(new Telnet.Event.Data(buffer.toString(Telnet.DEFAULT_ENCODING, 0, copied)));
      });

      /*
       * Close the connection if the server closes it
       */
      this.connection.on('end', () => {
        this.disconnect();
      });

      return this.connection;
    }

    /**
     * Close the telnet connection
     */
    public disconnect() {
      this.next(new Telnet.Event.Disconnecting());
      if (this.connection) {
        this.connection.end();
        this.connection = null;
      }
      this.next(new Telnet.Event.Disconnected());
    }

    /**
     * Processes in-band telnet commands.  Please see the relevant RFCs for more information.
     * Commands are published to the connetion observable as {@link Telnet.Event.Command} and
     * can be responded to by filtering for this information.
     *
     * @param data the array of data for the current input
     * @param position the current position of the data cursor
     * @returns the new position of the data cursor
     */
    private handleTelnetCommand(data: number[], position: number) {
      const telnetCommand: number[] = [Telnet.Commands.IAC];

      // Used to store the new position of the buffer cursor
      position++;

      if (data[position] === Telnet.Commands.SB) {
        while (position < data.length) {
          telnetCommand.push(data[position++]);
          if (data[position] === Telnet.Commands.SE) {
            break;
          }
        }
      } else {
        telnetCommand.push(data[position]++);
        telnetCommand.push(data[position]++);
      }
      this.next(new Telnet.Event.Command(telnetCommand));

      return position;
    }

    private connectNoTls(hostUrl: url.Url) {
      return net.connect({
        ...this.options,
        host: hostUrl.hostname,
        port: Number(hostUrl.port),
      }, () => {
        this.next(new Telnet.Event.Connected());
      });
    }

    private connectTls(hostUrl: url.Url) {
      return tls.connect({
        ...this.options,
        host: hostUrl.hostname,
        port: Number(hostUrl.port),
      }, () => {
        this.next(new Telnet.Event.Connected());
      });
    }
  }

  export namespace Connection {
    export interface IOptions {
      connection?: net.Socket | tls.TLSSocket;
      remoteUrl?: url.Url;
      connectionClass?: any;
    }
  }

  export class Server extends ReplaySubject<Telnet.Event.Server> {
    private server: net.Server | tls.Server | null = null;

    constructor(private hostUrl: url.Url, private options: any = {}) {
      super();
    }

    public start() {
      let server: net.Server | tls.Server | undefined;
      const protocol = this.hostUrl.protocol;

      switch (protocol) {
        case 'telnet:':
          server = this.serverNoTls(this.hostUrl);
          break;
        case 'telnets:':
          server = this.serverTls(this.hostUrl);
          break;
      }

      if (!server) {
        throw new Error('No hostUrl protocol has been supplied.');
      }

      server.on('error', (error: any) => {
        this.error(error);
      });

      server.listen(this.hostUrl.port, () => {
        this.next(new Telnet.Event.Server.Listening());
      });

      return server;
    }

    private serverNoTls(hostUrl: url.Url) {
      return net.createServer({ ...this.options }, (conn: net.Socket) => {
        const connection = new Telnet.Connection({ connection: conn });
        conn.on('end', () => {
          this.next(new Telnet.Event.ClientDisconnected(connection));
        });
        this.next(new Telnet.Event.ClientConnected(connection));
      });
    }

    private serverTls(hostUrl: url.Url) {
      return tls.createServer({ ...this.options }, (conn: tls.TLSSocket) => {
        const connection = new Telnet.Connection({ connection: conn });
        conn.on('end', () => {
          this.next(new Telnet.Event.ClientDisconnected(connection));
        });
        this.next(new Telnet.Event.ClientConnected(connection));
      });
    }
  }
}
