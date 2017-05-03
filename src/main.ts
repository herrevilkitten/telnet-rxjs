import { Telnet } from './telnet-rxjs';

const client = Telnet.connect('telnets://url', { rejectUnauthorized: false });
client.data.subscribe(console.log);
client.filter(event => event instanceof Telnet.Event.Connected).subscribe(event => client.sendln('WHO'));
client.connect();
