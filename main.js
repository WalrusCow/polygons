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

  //////////////////////////////////////////////////////////////////////////////
  // Intersection //////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  function Line(p1, p2) {
    this.slope = (p1.y - p2.y) / (p1.x - p2.x);
    if (Math.abs(this.slope) === Infinity) {
      // Better to have the same sign on infinities
      this.slope = Infinity;
    }
    this.y_int = p1.y - this.slope * p1.x;
    if (Math.abs(this.y_int) === Infinity) {
      this.y_int = Infinity;
    }
    this.start = p1;
    this.end = p2;
  }

  function inRange(x, start, end) {
    /* true if x is in the given range, inclusive */
    return ((x - start) * (x - end) <= 0);
  }

  function intersect(l1, l2) {
    /* Return:
     * - `null` if the line segments do not intersect
     * - A point of intersection if the lines do intersect
     */
    if ((!inRange(l1.start.x, l2.start.x, l2.end.x) ||
         !inRange(l1.start.y, l2.start.y, l2.end.y)) &&
        (!inRange(l1.end.x, l2.start.x, l2.end.x) ||
         !inRange(l1.end.y, l2.start.y, l2.end.y))) {
      // Bounding boxes do not intersect
      return null;
    }

    if (l1.slope === l2.slope) {
      if (l1.y_int != l2.y_int) {
        // Parallel lines do not intersect
        return null;
      }
      // Coincident lines, with intersecting bounding boxes intersect
      // Intersection point is middle of the endpoints TODO
      return true;
    }

    // If the slopes are not equal, then we can solve for the intersection
    var pt = { x : null, y : null };
    if (l2.slope === Infinity) {
      [l1, l2] = [l2, l1];
    }

    if (l1.slope === Infinity) {
      pt.x = l2.start.x;
      pt.y = l2.start.x * l1.slope + l1.y_int;
    }
    else {
      // So now we have two non-vertical, non-coincident and non-parallel lines
      // Simply find the intersection and then determine if it is in the middle
      // of the two x's and two y's for both line
      // Solve as if we have lines, not line segments
      pt.x = (l2.y_int - l1.y_int) / (l1.slope - l2.slope);
      pt.y = l1.slope * pt.x + l1.y_int;
    }
    // Now determine if the intersection is in the middle of each of the lines
    // We can do this by saying that the product of subtractions must be
    // negative for x and y
    if (inRange(pt.x, l1.start.x, l1.end.x) &&
        inRange(pt.y, l1.start.y, l1.end.y) &&
        inRange(pt.x, l2.start.x, l2.end.x) &&
        inRange(pt.y, l2.start.y, l2.end.y)) {
      return pt;
    }
    return null;
  }

  new PolygonFun({ canvas : 'polyCanvas' });
})();
