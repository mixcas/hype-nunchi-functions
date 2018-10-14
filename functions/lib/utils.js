const _ = require('underscore')

const compactObject = o => {
  let clone = _.clone(o)
  _.each(clone, (v, k) => {
    if(!v) {
      delete clone[k]
    }
  });
  return clone
}
module.exports.compactObject = compactObject;
