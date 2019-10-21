function createLib (execlib) {
  'use strict';

  var ret = {};

  require('./clientcreator')(execlib, ret);

  return ret;
}

module.exports = createLib;
