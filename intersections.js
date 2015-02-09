define(['lines', 'util'], function(lines, util) {
  var Line = lines.Line;

  function Intersections(options) {
    this._canvas = document.getElementById(options.canvas);

    this._ctx = this._canvas.getContext('2d');
    this._canvas.addEventListener('click', this.onClick.bind(this));

    // List of lines we have drawn so far
    this._lines = [];
    this._lineStart = null;

    this._lineOptions = {
      draw : true,
      canvas : this._canvas,
    };
  }

  Intersections.prototype.onClick = function (e) {
    var coords = util.getClickCoords(e, this._canvas);
    // Invalid click
    if (!coords) return;

    if (!this._lineStart) {
      this._lineStart = coords;
    }
    else {
      var newLine = new Line(this._lineStart, coords, this._lineOptions);
      this._lineStart = null;
      this._lines.push(newLine);
      this.findNewIntersections()
    }
  };

  Intersections.prototype.findNewIntersections = function() {
    /* Find the intersections of the last line with any previous line */
    var lastIdx = this._lines.length - 2;
    var newLine = this._lines[lastIdx + 1];

    var ctx = this._ctx;

    for (var i = 0; i <= lastIdx; ++i) {
      var pt = lines.intersect(newLine, this._lines[i]);
      if (!pt) continue;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  };

  return Intersections;
});
