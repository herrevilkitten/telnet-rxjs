/* tslint:disable:no-unused-expression */

import { createServer, Telnet } from '../src/telnet';

import chai = require('chai');
import sinon = require('sinon');
import sinonChai = require('sinon-chai');

const expect = chai.expect;

before(() => {
  chai.use(sinonChai);
});

beforeEach(() => {
  this.sandbox = sinon.createSandbox();
});

afterEach(() => {
  this.sandbox.restore();
});

describe('Telnet.server', () => {
  const TEST_URL = 'telnet://localhost:9999';
  it('should create a server object', () => {
    const telnet = createServer(TEST_URL, {});
    expect(telnet).to.not.be.null;
  });

  it('should throw an exception if there is an invalid hostUrl', () => {
    expect(() => createServer('')).to.throw('No host URL given');
    expect(() => createServer('a')).to.throw('No host port given');
    expect(() => createServer('a:b')).to.throw('No host port given');
    expect(() => createServer('a:b:c')).to.throw('Invalid protocol: a');
  });
});
