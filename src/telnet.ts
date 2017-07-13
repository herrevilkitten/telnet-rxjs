import * as url from 'url';

import { Command } from './command';
import { Connection } from './connection';
import { Event } from './event';
import { Protocol } from './protocol';
import { Server } from './server';

export * from './command';
export * from './connection';
export * from './event';
export * from './protocol';
export * from './server';

/**
 * A factory method for creating a telnet connection to a remote server.  TLS servers are supported
 * by using a protocol of telnets:
 *
 * @param {string} hostUrl the url of the host to connect to
 * @param {*} [options={}] additional options to be passed to the net/tls connect call
 * @returns {Connection} the client connection
 */
export function createClient(hostUrl: string, options: any = {}) {
    let client: Connection;

    if (!hostUrl) {
        throw new Error('No host URL given');
    }

    if (!options.clientClass) {
        options.clientClass = Connection;
    }

    const parts = hostUrl.split(':');
    if (parts.length === 2) {
        hostUrl = Protocol.build(Protocol.TELNET, parts[0], parts[1]);
    }

    client = new options.clientClass({ remoteUrl: url.parse(hostUrl), ...options });
    return client;
}

/**
 * A factory method for creating a server.  TLS servers are supported by using a protocol
 * of telnets:  At a minimum, the port must be supplied.
 *
 * @param {(string | number)} hostUrl the url of the server that is being created
 * @param {*} [options={}] additional options to be passed to the net/tls createServer call
 * @returns {Server} the server object
 */
export function createServer(hostUrl: string | number, options: any = {}) {
    let server: Server;

    if (!hostUrl) {
        throw new Error('No host URL given');
    }

    if (typeof hostUrl === 'number') {
        hostUrl = Protocol.build(Protocol.TELNET, '0.0.0.0', hostUrl);
    }

    if (!options.serverClass) {
        options.serverClass = Server;
    }

    const parts = hostUrl.split(':');
    if (parts.length === 1) {
        hostUrl = Protocol.build(Protocol.TELNET, '0.0.0.0', parts[0]);
    } else if (parts.length === 2) {
        hostUrl = Protocol.build(Protocol.TELNET, parts[0], parts[1]);
    }

    server = new options.serverClass({ hostUrl: url.parse(hostUrl), ...options });
    return server;
}

export class Telnet {
    public static Command = Command;
    public static Connection = Connection;
    public static Event = Event;
    public static Protocol = Protocol;
    public static Server = Server;

    public static client = createClient;
    public static server = createServer;
}
