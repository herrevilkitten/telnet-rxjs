import * as net from 'net';
import * as tls from 'tls';
import * as url from 'url';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

import { Command } from './command';
import { Event } from './event';

export const EOL = '\r\n';
export const DEFAULT_ENCODING = 'utf8';

export class Connection extends ReplaySubject<Event> {
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
    return this.filter((event) => event instanceof Event.Data)
      .map((event: Event.Data) => event.data);
  }

  /**
   * An observable that tracks any telnet commands sent to the client
   */
  get commands(): Observable<number[]> {
    return this.filter((event) => event instanceof Event.Command)
      .map((event: Event.Command) => event.command);
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
    this.send(EOL);
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

      this.next(new Event.Connecting());
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
        if (data[cursor] === Command.IAC) {
          cursor = this.handleTelnetCommand(data, cursor);
        } else {
          buffer[copied++] = data[cursor];
        }
      }

      this.next(new Event.Data(buffer.toString(DEFAULT_ENCODING, 0, copied)));
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
    this.next(new Event.Disconnecting());
    if (this.connection) {
      this.connection.end();
      this.connection = null;
    }
    this.next(new Event.Disconnected());
  }

  /**
   * Processes in-band telnet commands.  Please see the relevant RFCs for more information.
   * Commands are published to the connetion observable as {@link Event.Command} and
   * can be responded to by filtering for this information.
   *
   * @param data the array of data for the current input
   * @param position the current position of the data cursor
   * @returns the new position of the data cursor
   */
  private handleTelnetCommand(data: number[], position: number) {
    const telnetCommand: number[] = [Command.IAC];

    // Used to store the new position of the buffer cursor
    position++;

    if (data[position] === Command.SB) {
      while (position < data.length) {
        telnetCommand.push(data[position++]);
        if (data[position] === Command.SE) {
          break;
        }
      }
    } else {
      telnetCommand.push(data[position]++);
      telnetCommand.push(data[position]++);
    }
    this.next(new Event.Command(telnetCommand));

    return position;
  }

  private connectNoTls(hostUrl: url.Url) {
    return net.connect({
      ...this.options,
      host: hostUrl.hostname,
      port: Number(hostUrl.port),
    }, () => {
      this.next(new Event.Connected());
    });
  }

  private connectTls(hostUrl: url.Url) {
    return tls.connect({
      ...this.options,
      host: hostUrl.hostname,
      port: Number(hostUrl.port),
    }, () => {
      this.next(new Event.Connected());
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
