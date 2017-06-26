/* tslint:disable:no-unused-expression */

import { createServer, Telnet } from '../src/telnet';

import sinon = require('sinon');
import chai = require('chai');
import sinonChai = require('sinon-chai');

const expect = chai.expect;

before(() => {
  chai.use(sinonChai);
});

beforeEach(() => {
  this.sandbox = sinon.sandbox.create();
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
});