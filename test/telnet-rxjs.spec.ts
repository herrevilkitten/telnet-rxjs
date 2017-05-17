import { Telnet } from '../src/telnet-rxjs';

describe('telnet-rxjs', () => {
  const TEST_URL = 'telnet://localhost:9999';

  it('should create an object', () => {
    const telnet = Telnet.client(TEST_URL, {});
    expect(telnet).toBeTruthy();
  });
});
