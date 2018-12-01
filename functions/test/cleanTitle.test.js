const assert = require('assert')
const { cleanTitle } =  require('../lib/utils')

console.log(cleanTitle('1/2_3\4 5//6\\7__8  9 10	11	12'))
describe('Utils', function() {
  describe('cleanTitle', function() {
    it('should remove underscores, slashes, backslashes and spaces', function() {
      assert.equal('123456789101112',cleanTitle('1/2_3\\4 5//6\\\\7__8  9 10	11	12'))
    })

    it('should clean a title', function() {
      assert.equal('[MV]ALEPH(알레프)OnandOn',cleanTitle('[MV] ALEPH(알레프) _ On and On'))
    })
  })
})
