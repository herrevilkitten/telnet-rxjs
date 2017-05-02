import { TelnetClient } from './telnet-client';

let client = new TelnetClient();
client.events.subscribe(console.log);
