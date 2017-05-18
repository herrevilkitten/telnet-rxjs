import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import * as tls from 'tls';
import * as url from 'url';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

export class Telnet {
  public static client(hostUrl: string, options: any = {}) {
    let client: Telnet.Connection;

    if (!options.clientClass) {
      options.clientClass = Telnet.Connection;
    }
    client = new options.clientClass(url.parse(hostUrl), options);
    return client;
  }
}

export namespace Telnet {
  export const EOL = '\r\n';

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

    export class Timer extends Telnet.Event { }

    export class Command extends Telnet.Event {
      public command: number[];

      constructor(command: number[]) {
        super();
        this.command = command;
      }
    }
  }

  export class Connection extends ReplaySubject<Telnet.Event> {
    private connection: tls.ClearTextStream | net.Socket | null;

    constructor(private hostUrl: url.Url, private options?: any) {
      super();
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

    public send(data: string) {
      if (!this.connection) {
        return;
      }

      this.connection.write(data);
    }

    public sendln(data: string) {
      this.send(data);
      this.send(Telnet.EOL);
    }

    public connect(): Observable<boolean> {
      let connection;

      this.next(new Telnet.Event.Connecting());
      if (this.hostUrl.protocol === 'telnets:') {
        connection = this.connectTls(this.hostUrl);
      } else {
        connection = this.connectNoTls(this.hostUrl);
      }

      this.connection = connection;
      connection.on('error', (error) => {
        this.error(error);
      });

      connection.on('data', (data: number[]) => {
        const buffer = Buffer.alloc(data.length);
        let copied = 0;
        for (let i = 0; i < data.length; ++i) {
          if (data[i] === Telnet.Commands.IAC) {
            i = this.handleTelnetCommand(data, i);
          } else {
            buffer[copied++] = data[i];
          }
        }

        this.next(new Telnet.Event.Data(buffer.toString('utf8', 0, copied)));
      });

      return Observable.of(true);
    }

    private handleTelnetCommand(data: any[], position: number) {
      const telnetCommand: number[] = [Telnet.Commands.IAC];
      position++;

      if (data[position] === Telnet.Commands.SB) {
        // TODO: Sub negotiation begins
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
}
