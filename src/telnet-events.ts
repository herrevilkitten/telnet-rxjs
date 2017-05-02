export class TelnetEvent {
  timestamp: Date;

  constructor() {
    this.timestamp = new Date();
  }
}

export class StateChangeEvent extends TelnetEvent {

}

export class ConnectingEvent extends StateChangeEvent {

}

export class ConnectedEvent extends StateChangeEvent {

}

export class DisconnectingEvent extends StateChangeEvent {

}

export class DisconnectedEvent extends StateChangeEvent {

}

export class DataEvent extends TelnetEvent {
  data: string;

  constructor(data: string) {
    super();
    this.data = data;
  }
}

export class TimerEvent extends TelnetEvent {

}
