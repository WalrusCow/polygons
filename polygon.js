define([], function() {
  function Polygon(canvas) {
    /* "Class" for a Polygon on a canvas */
    this._points = [];
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._strokeColour = 'blue';
    this._fillColour = 'blue';
  }

  Polygon.prototype.addPoint = function(coords) {
    this._points.push(coords);
    // Also draw line segment, if relevant
    if (this._points.length <= 1) return;
    var ctx = this._ctx;
    ctx.beginPath();
    var pt = this._points[this._points.length - 2];
    ctx.moveTo(pt.x, pt.y);
    pt = this._points[this._points.length - 1];
    ctx.lineTo(pt.x, pt.y);

    ctx.strokeStyle = this._strokeColour;
    ctx.stroke();
  };

  Polygon.prototype.fill = function() {
    // Not enough to draw
    if (this._points.length < 2) return;
    var ctx = this._ctx;
    ctx.beginPath();
    var pt = this._points[0];
    ctx.moveTo(pt.x, pt.y);
    for (var i = 1; i < this._points.length; ++i) {
      pt = this._points[i];
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();

    ctx.fillStyle = this._fillColour;
    ctx.fill();
  };

  return Polygon;
});
