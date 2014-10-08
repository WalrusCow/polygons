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

  util.getClickCoords = function(e, clickElem) {
    /* Get the coordinates for a click on canvas, or null if invalid */
    var offset = {
      x : 0,
      y : 0
    };

    var el = clickElem;
    do {
      console.log(el, el.offsetLeft, el.scrollLeft, el.offsetTop, el.scrollTop);
      offset.x += el.offsetLeft - el.scrollLeft;
      offset.y += el.offsetTop - el.scrollTop;
    } while (el = el.offsetParent)

    // TODO: Verify offset and pageX/pageY in chrome/ff
    //var x = e.clientX - offset.x;
    //var y = e.clientY - offset.y;
    console.log(e);
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

  return util;
});
