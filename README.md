# telnet-rxjs

A node.js telnet library that wraps the sockets with RxJS observables.

[![Build Status](https://travis-ci.org/herrevilkitten/telnet-rxjs.svg?branch=master)](https://travis-ci.org/herrevilkitten/telnet-rxjs)

## INSTALLATION

```
npm install telnet-rxjs
```

### Dependencies

[RxJS](https://www.npmjs.com/package/rxjs)

## SYNPOSIS
```
import { Telnet } from './telnet-rxjs';

const client = Telnet.client('www.yahoo.com:80');

let connected = false;

client.filter((event) => event instanceof Telnet.Event.Connected)
    .subscribe((event) => {
        connected = true;
        client.sendln('GET /');
    });

client.data
    .subscribe((data) => {
        if (!connected) {
            return;
        }
        console.log(data);
    });

client.connect();
```
## DESCRIPTION

`telnet-rxjs` is a simple wrapper around a telnet client, using [RxJS](https://github.com/ReactiveX/rxjs) for handling data received from the server.

### Create a Connection

Connections are created by using the `Telnet.client` static factory method.  This method takes two arguments

* The URI of the host to connect to
* Optionally, additional options to pass to the network socket

The URI should be in formats similar to `protocol:host:port`.  Host and port are both required.  Protocol can be either `telnet` or `telnets`, which uses a TLS connection.  If the protocol is not specified, it defaults to `telnet`.

The options can be any option accepted by the [net.connect](https://nodejs.org/dist/latest-v7.x/docs/api/net.html#net_net_connect_options_connectlistener) or [tls.connect](https://nodejs.org/dist/latest-v7.x/docs/api/tls.html#tls_tls_connect_options_callback) functions of Node.js.  For example, to create a TLS connection to a site with a self-signed certificate, this statement can be used:

```
const client = Telnet.client('telnets:some.example.com:8443', { rejectUnauthorized: false });
```

The factory method returns a `Telnet.Connection` object, which is a subclass of `Observable<Telnet.Event>`.

### Listen for Events and Data

As an observable, the telnet connection can be subscribed to in order to receive data from the server.  The default subscription publishes `Telnet.Event` objects

### Connect

## LINKS

[Generated API Documentation](https://herrevilkitten.github.io/telnet-rxjs/)

[NPM Package](https://www.npmjs.com/package/telnet-rxjs)

## AUTHOR

Eric Kidder
