import chai = require('chai');
import sinon = require('sinon');
import sinonChai = require('sinon-chai');

let sandbox: sinon.SinonSandbox;

before(() => {
    chai.use(sinonChai);
});

beforeEach(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});
