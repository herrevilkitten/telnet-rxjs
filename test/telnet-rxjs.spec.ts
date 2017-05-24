/* tslint:disable:no-unused-expression */

import { Telnet } from '../src/telnet-rxjs';

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

describe('telnet-rxjs', () => {
  const TEST_URL = 'telnet://localhost:9999';

  it('should create an object', () => {
    const telnet = Telnet.client(TEST_URL, {});
    expect(telnet).to.not.be.null;
  });
});
