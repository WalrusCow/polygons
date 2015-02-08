define(['util'], function(util) {
  var GraphUtil = {};

  GraphUtil.generate = function(options) {
    var canvas = document.getElementById(options.canvas);
    var ctx = canvas.getContext('2d');

    var mid = {
      x : canvas.width / 2,
      y : canvas.height / 2
    };

    drawConvex(util.randomNumber(10, 20), mid, ctx);
  };

  function drawNode(pt, ctx) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  function drawConvex(size, mid, ctx) {
    // Draw a regular convex polyon on the context
    drawNode(mid, ctx);

    var radius = 100;

    var angle = Math.PI * 2 / size;
    for (var i = 0; i < size; ++i) {
      var pt = {
        x : mid.x + (Math.cos(angle * i) * radius),
        y : mid.y + (Math.sin(angle * i) * radius)
      };
      drawNode(pt, ctx);
    }
  }

  return GraphUtil;
});
