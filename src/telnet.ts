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

import { Command } from './command';
import { Connection } from './connection';
import { Event } from './event';
import { Server } from './server';

export class Telnet {
  public static Command = Command;
  public static Connection = Connection;
  public static Event = Event;
  public static Server = Server;

  /**
   * A factory method for creating a telnet connection to a remote server.  TLS servers are supported
   * by using a protocol of telnets:
   *
   * @static
   * @param {string} hostUrl the url of the host to connect to
   * @param {*} [options={}] additional options to be passed to the net/tls connect call
   * @returns {Connection} the client connection
   * @memberof Telnet
   */
  public static client(hostUrl: string, options: any = {}) {
    let client: Connection;

    if (!hostUrl) {
      throw new Error('No host URL given');
    }

    if (!options.clientClass) {
      options.clientClass = Connection;
    }

    const parts = hostUrl.split(':');
    if (parts.length === 2) {
      hostUrl = `telnet:${parts[0]}:${parts[1]}`;
    }

    client = new options.clientClass(url.parse(hostUrl), options);
    return client;
  }

  /**
   * A factory method for creating a server.  TLS servers are supported by using a protocol
   * of telnets:  At a minimum, the port must be supplied.
   *
   * @static
   * @param {(string | number)} hostUrl the url of the server that is being created
   * @param {*} [options={}] additional options to be passed to the net/tls createServer call
   * @returns {Server} the server object
   * @memberof Telnet
   */
  public static server(hostUrl: string | number, options: any = {}) {
    let server: Server;

    if (!hostUrl) {
      throw new Error('No host URL given');
    }

    if (typeof hostUrl === 'number') {
      hostUrl = `telnet:0.0.0.0:${hostUrl}`;
    }

    if (!options.serverClass) {
      options.serverClass = Server;
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
