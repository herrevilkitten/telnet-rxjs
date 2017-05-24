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
