import * as net from 'net';
import * as tls from 'tls';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/of';

import { TelnetEvent, StateChangeEvent, DataEvent, ConnectedEvent, ConnectingEvent } from './telnet-events';

export namespace TelnetCommands {
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

export class TelnetClient {
  private eventsObservable: ReplaySubject<TelnetEvent>;
  private outputObservable: ReplaySubject<string>;
  private connection: tls.ClearTextStream | net.Socket | null;
  private hostUrl: url.Url;

  constructor() {
    this.eventsObservable = new ReplaySubject<TelnetEvent>();
    this.outputObservable = new ReplaySubject<string>();
    this.connection = null;

    this.outputObservable.subscribe(data => this.send(data));
  }

  get events(): Observable<TelnetEvent> {
    return this.eventsObservable;
  }

  get connectionStatus(): Observable<StateChangeEvent> {
    return this.eventsObservable.filter(event => event instanceof StateChangeEvent);
  }

  get data(): Observable<DataEvent> {
    return this.eventsObservable.filter(event => event instanceof DataEvent)
  }

  get output(): Subject<string> {
    return this.outputObservable;
  }

  send(data: string) {
    if (!this.connection) {
      return;
    }

    this.connection.write(data);
  }

  sendln(data: string) {
    this.send(data);
    this.send('\r\n');
  }

  connect(hostUrl: string | url.Url): Observable<boolean> {
    let connection: tls.ClearTextStream | net.Socket;
    if (typeof hostUrl === 'string') {
      hostUrl = url.parse(hostUrl);
    }
    this.hostUrl = hostUrl;

    this.eventsObservable.next(new ConnectingEvent());
    if (hostUrl.protocol === 'telnets:') {
      connection = this.connectTls(hostUrl);
    } else {
      connection = this.connectNoTls(hostUrl);
    }

    this.connection = connection;
    connection.on('error', (error) => {
      this.eventsObservable.error(error);
    });

    connection.on('data', (data) => {
      const buffer = Buffer.alloc(data.length);
      let copied = 0;
      for (let i = 0; i < data.length; ++i) {
        if (data[i] === 255) {
          i += 2;
        } else {
          buffer[copied++] = data[i];
        }
      }

      this.eventsObservable.next(new DataEvent(buffer.toString('utf8', 0, copied)));
    });

    return Observable.of(true);
  }

  private connectNoTls(hostUrl: url.Url) {
    return net.connect({
      host: hostUrl.hostname,
      port: Number(hostUrl.port),
    }, () => {
      this.eventsObservable.next(new ConnectedEvent());
    });
  }

  private connectTls(hostUrl: url.Url) {
    return tls.connect({
      host: hostUrl.hostname,
      port: Number(hostUrl.port),
    }, () => {
      this.eventsObservable.next(new ConnectedEvent());
    });
  }
}

