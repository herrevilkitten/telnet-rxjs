import { Telnet } from './telnet';

const server = Telnet.server(8080);

console.log(server);
server.subscribe((event) => {
  console.log(event);
},
  (error: any) => {
    console.error(error);
  });
const v = server.start();
console.log(v);
