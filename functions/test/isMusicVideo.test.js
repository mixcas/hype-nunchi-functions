const assert = require('assert')
const { isMusicVideo } =  require('../lib/utils')

describe('Utils', function() {
  describe('isMusicVideo', function() {
    it('should return false if title is not a music video', function() {
      const expectedValue = false
      const testValue = '[박도하] Interview 박도하 \'달빛\' (연가프로젝트)'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return false if title includes teaser', function() {
      const expectedValue = false
      const testValue = '[Teaser 1] PRISTIN(프리스틴) _ WE LIKE M/V PRE TEASER'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return false if title includes trailer', function() {
      const expectedValue = false
      const testValue = '[Teaser] K.A.R.D _ RUMOR MV Trailer'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return false if title includes behind the scenes', function() {
      const expectedValue = false
      const testValue = '로꼬 (Loco) - 시간이 들겠지 MV Behind the Scenes'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return false if title includes Making Film', function() {
      const expectedValue = false
      const testValue = 'THE BOYZ(더보이즈) \'No Air\' M/V MAKING FILM #2'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return true if title includes Official Video', function() {
      const expectedValue = true
      const testValue = 'Sway D - URRRPANG! (feat. Reddy & ICE PUFF) [Official Video]'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return true if title includes MV', function() {
      const expectedValue = true
      const testValue = '[MV] ALEPH(알레프) _ On and On'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })

    it('should return true if title includes Official Music Video', function() {
      const expectedValue = true
      const testValue = '[EXID(이엑스아이디)] 알러뷰 (I LOVE YOU) M/V (Official Music Video)'

      assert.equal(expectedValue, isMusicVideo(testValue))
    })
  })
})
