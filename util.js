define([], function() {
  var util = {};

  util.rateLimit = function(func, rate) {
    var blocked = false;
    return function() {
      if (blocked) {
        return;
      }
      blocked = true;
      setTimeout(function() {
        blocked = false;
      }, rate);
      func.apply(this, arguments);
    };
  };

  return util;
});
