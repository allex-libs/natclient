function createLib (execlib) {
  return execlib.loadDependencies('client', ['allex:jobondestroyable:lib'], libCreator.bind(null, execlib));
}

function libCreator (execlib, jobondestroyablelib) {
  'use strict';

  var ret = {};

  require('./clientcreator')(execlib, jobondestroyablelib, ret);

  return ret;
}

module.exports = createLib;
