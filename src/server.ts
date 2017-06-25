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

import { Connection } from './connection';
import { Event } from './event';

export class Server extends ReplaySubject<Event.Server> {
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

    server.listen(Number(this.hostUrl.port), this.hostUrl.hostname, 5, () => {
      this.next(new Event.Server.Listening());
    });

    return server;
  }

  private serverNoTls(hostUrl: url.Url) {
    return net.createServer({ ...this.options }, (conn: net.Socket) => {
      const connection = new Connection({ connection: conn });
      conn.on('end', () => {
        this.next(new Event.ClientDisconnected(connection));
      });
      this.next(new Event.ClientConnected(connection));
    });
  }

  private serverTls(hostUrl: url.Url) {
    return tls.createServer({ ...this.options }, (conn: tls.TLSSocket) => {
      const connection = new Connection({ connection: conn });
      conn.on('end', () => {
        this.next(new Event.ClientDisconnected(connection));
      });
      this.next(new Event.ClientConnected(connection));
    });
  }
}
