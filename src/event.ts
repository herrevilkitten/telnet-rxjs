import { Connection } from './connection';

export abstract class Event {
  public timestamp: Date;

  constructor() {
    this.timestamp = new Date();
  }
}

export namespace Event {
  export class ConnectionChange extends Event { }

  export class Connecting extends ConnectionChange { }

  export class Connected extends ConnectionChange { }

  export class Disconnecting extends ConnectionChange { }

  export class Disconnected extends ConnectionChange { }

  export class Data extends Event {
    public data: string;

    constructor(data: string) {
      super();
      this.data = data;
    }
  }

  export class Command extends Event {
    public command: number[];

    constructor(command: number[]) {
      super();
      this.command = command;
    }
  }

  export class Server extends Event { }

  export class ClientConnected extends Server {
    public connection: Connection;

    constructor(connection: Connection) {
      super();
      this.connection = connection;
    }
  }

  export class ClientDisconnected extends Server {
    public connection: Connection;

    constructor(connection: Connection) {
      super();
      this.connection = connection;
    }
  }

  export class Listening extends Server { }
}
