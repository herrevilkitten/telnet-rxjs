# telnet-rxjs

A node.js telnet library that wraps the sockets with RxJS observables.

[![Build Status](https://travis-ci.org/herrevilkitten/telnet-rxjs.svg?branch=master)](https://travis-ci.org/herrevilkitten/telnet-rxjs)

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

## LINKS

[API Documentation](https://herrevilkitten.github.io/telnet-rxjs/)

## AUTHOR

Eric Kidder
