import chai = require('chai');
import sinon = require('sinon');
import sinonChai = require('sinon-chai');

before(() => {
    chai.use(sinonChai);
});

beforeEach(() => {
    this.sandbox = sinon.createSandbox();
});

afterEach(() => {
    this.sandbox.restore();
});
