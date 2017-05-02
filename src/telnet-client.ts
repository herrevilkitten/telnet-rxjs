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

export class TelnetClient {
  private eventsObservable: ReplaySubject<TelnetEvent>;
  private outputObservable: ReplaySubject<string>;
  private connection: tls.ClearTextStream | net.Socket;
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

  get input(): Observable<DataEvent> {
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

    connection.on('error', (error) => {
      this.eventsObservable.error(error);
    });

    connection.on('data', (data) => {
      this.eventsObservable.next(new DataEvent(data.toString()));
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
