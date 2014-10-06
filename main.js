(function() {
  //////////////////////////////////////////////////////////////////////////////
  // Polygon ///////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function Polygon(canvas) {
    this._points = [];
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
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
    ctx.fill();
  };

  //////////////////////////////////////////////////////////////////////////////
  // Canvas wrapper ////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function PolygonFun(options) {
    this._canvas = document.getElementById(options.canvas);

    this._ctx = this._canvas.getContext('2d');
    this._ctx.strokeStyle = 'blue';
    this._ctx.fillStyle = 'blue';

    this._canvas.addEventListener('click', this.onClick.bind(this));
    this._canvas.addEventListener('dblclick', this.onDblClick.bind(this));

    // Draw polygons, each of which is a list of points.
    this._polygons = [];
    // Whether or not we are currently drawing a polygon
    this._drawing = false;
  }

  PolygonFun.prototype._getClickCoords = function(e) {
    /* Get the coordinates for a click on canvas, or null if invalid */
    var offset = {
      x : 0,
      y : 0
    };
    var el = this._canvas;
    do {
      offset.x += el.offsetLeft - el.scrollLeft;
      offset.y += el.offsetTop - el.scrollTop;
    } while (el = el.offsetParent)

    var x = e.clientX - offset.x;
    var y = e.clientY - offset.y;

    // Account for the border
    var canvasStyle = getComputedStyle(this._canvas);
    x -= canvasStyle.getPropertyValue('border-left-width').replace(/px$/, '');
    y -= canvasStyle.getPropertyValue('border-top-width').replace(/px$/, '');
    // Invalid click handling
    if (y < 0 || y > this._canvas.height || x < 0 || x > this._canvas.width) {
      return null;
    }
    return { x : x, y : y };
  };

  PolygonFun.prototype.onDblClick = function(e) {
    /* Close the polygon on double click */
    if (!this._drawing) return;
    this._drawing = false;

    // Draw the last line segment
    this._polygons[this._polygons.length - 1].fill();
  };

  function rateLimit(func, rate) {
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
  }

  var onClick = function(e) {
    var coords = this._getClickCoords(e);
    // Invalid click
    if (!coords) return;

    if (!this._drawing) {
      this._polygons.push(new Polygon(this._canvas));
      this._drawing = true;
    }
    this._polygons[this._polygons.length - 1].addPoint(coords);
  };
  PolygonFun.prototype.onClick = rateLimit(onClick, 160);

  new PolygonFun({ canvas : 'polyCanvas' });
})();
