define(['util'], function(util) {
  var GraphUtil = {};

  GraphUtil.generate = function(options) {
    var canvas = document.getElementById(options.canvas);
    var ctx = canvas.getContext('2d');

    var mid = {
      x : canvas.width / 2,
      y : canvas.height / 2
    };

    var radius = util.randomNumber(100, 150);
    var polygonSize = util.randomNumber(5, 10);
    var points = convexPoints(polygonSize, radius, mid);

    for (var i = 0; i < points.length; ++i) {
      drawNode(points[i], ctx);
    }
    drawNode(mid, ctx);
  };

  function drawNode(pt, ctx) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function convexPoints(num, radius, mid) {
    // Return an array of points for a regular convex polygon with
    // given radius and center
    var points = [];
    var angle = Math.PI * 2 / num;
    for (var i = 0; i < num; ++i) {
      points.push({
        x : mid.x + (Math.cos(angle * i) * radius),
        y : mid.y + (Math.sin(angle * i) * radius)
      });
    }
    return points;
  }

  return GraphUtil;
});
