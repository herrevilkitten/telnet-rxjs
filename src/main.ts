import { TelnetClient } from './telnet-client';
import { ConnectedEvent, DataEvent } from './telnet-events';

let client = new TelnetClient();
client.events.subscribe(console.log);
