import sinon = require('sinon');
import chai = require('chai');
import sinonChai = require('sinon-chai');

before(() => {
    chai.use(sinonChai);
});

beforeEach(() => {
    this.sandbox = sinon.sandbox.create();
});

afterEach(() => {
    this.sandbox.restore();
});
