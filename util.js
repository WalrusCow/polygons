define([], function() {
  var util = {};

  util.random = {};
  util.random.number = function(min, max) {
    return Math.floor(min + (Math.random() * (max - min)))
  };

  util.random.choose = function(num, list) {
    // Choose at random from the list without replacement
    var keys = Object.keys(list);
    var ret = [];

    for (var i = 0; i < num; ++i) {
      var keysLeft = Object.keys(keys);
      var idx = util.random.number(0, keysLeft.length);
      ret.push(list[keys[keysLeft[idx]]]);
      delete keys[keysLeft[idx]];
    }
    return ret;
  };

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

  util.getClickCoords = function(e, clickElem) {
    /* Get the coordinates for a click on canvas, or null if invalid */
    var offset = {
      x : 0,
      y : 0
    };

    var el = clickElem;
    do {
      offset.x += el.offsetLeft - el.scrollLeft;
      offset.y += el.offsetTop - el.scrollTop;
      // Do not do body, because chrome adds scroll to body but FF does not
    } while ((el = el.offsetParent) && (el !== document.body))

    var x = e.pageX - offset.x;
    var y = e.pageY - offset.y;

    // Account for the border
    var canvasStyle = getComputedStyle(clickElem);
    x -= canvasStyle.getPropertyValue('border-left-width').replace(/px$/, '');
    y -= canvasStyle.getPropertyValue('border-top-width').replace(/px$/, '');
    // Invalid click handling
    if (y < 0 || y > clickElem.height || x < 0 || x > clickElem.width) {
      return null;
    }
    return { x : x, y : y };
  };

  util.average = function(list) {
    var sum = function(x, y) { return x + y; };
    return (list.reduce(sum, 0)) / list.length;
  };

  return util;
});
