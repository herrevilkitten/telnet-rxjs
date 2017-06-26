/* tslint:disable:no-unused-expression */

import { createClient, Telnet } from '../src/telnet';

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

describe('Telnet.client', () => {
    const TEST_URL = 'telnet://localhost:9999';
    it('should create a client object', () => {
        const telnet = createClient(TEST_URL, {});
        expect(telnet).to.not.be.null;
    });
});
