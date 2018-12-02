const assert = require('assert')
const dateFns = require('date-fns')

const { isOldTrack } =  require('../lib/charts')

describe('Utils', function() {
  describe('isOldTrack', function() {
    it('should return false if track is from today', function() {
      const expectedValue = false
      const testValue = {
        published: new Date()
      }

      assert.equal(expectedValue, isOldTrack(testValue))
    })

    it('should return true if track is from 30 days ago', function() {
      const expectedValue = true
      const testValue = {
        published: dateFns.subDays(new Date(), 30)
      }

      assert.equal(expectedValue, isOldTrack(testValue))
    })

    it('should return true if track is from 60 days ago', function() {
      const expectedValue = true
      const testValue = {
        published: dateFns.subDays(new Date(), 60)
      }

      assert.equal(expectedValue, isOldTrack(testValue))
    })

  })
})
