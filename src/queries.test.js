const expect = require('chai').expect;
const db = require('./queries');

describe('Our first Test', () => {
    it('should pass', () => {
        expect(true).to.equal(true);
    })
});

describe('Response test', () => {
    it('should return object', ()=> {
        expect(db.testfun()).to.equal(true);
    })
})