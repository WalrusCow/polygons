define([], function() {
  var lines = {};

  function inRange(x, start, end) {
    /* true if x is in the given range, inclusive */
    return ((x - start) * (x - end) <= 0);
  }

  function Line(p1, p2, options) {
    options = options || {};
    if (options.canvas) {
      this.setCanvas(options.canvas);
    }
    this._strokeColour = 'blue';

    this.slope = (p1.y - p2.y) / (p1.x - p2.x);
    if (isNaN(this.slope) || Math.abs(this.slope) === Infinity) {
      // Better to have the same sign on infinities
      this.slope = Infinity;
    }
    this.y_int = p1.y - this.slope * p1.x;
    if (Math.abs(this.y_int) === Infinity) {
      this.y_int = Infinity;
    }
    this.start = p1;
    this.end = p2;
    if (options.draw) {
      this.draw();
    }
  }

  Line.prototype.setCanvas = function(canvas) {
    this.setContext(canvas.getContext('2d'));
  };

  Line.prototype.setContext = function(context) {
    this._ctx = context;
  };

  Line.prototype.draw = function() {
    var ctx = this._ctx;
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.strokeStyle = this._strokeColour;
    ctx.stroke();
  };

  lines.Line = Line;

  function boundingBoxesIntersect(l1, l2) {
    /* True if the bounding boxes for the lines intersect */
    r1 = {
      left : Math.min(l1.start.x, l1.end.x),
      right : Math.max(l1.start.x, l1.end.x),
      top : Math.max(l1.start.y, l1.end.y),
      bottom : Math.min(l1.start.y, l1.end.y)
    };
    r2 = {
      left : Math.min(l2.start.x, l2.end.x),
      right : Math.max(l2.start.x, l2.end.x),
      top : Math.max(l2.start.y, l2.end.y),
      bottom : Math.min(l2.start.y, l2.end.y)
    };
    // They do *not* intersect if the right is left of the left or the
    // top is under the bottom
    return !(r2.left > r1.right
        || r2.right < r1.left
        || r2.top < r1.bottom
        || r2.bottom > r1.top);
  }

  lines.intersect = function (l1, l2) {
    /* Return:
     * - `null` if the line segments do not intersect
     * - A point of intersection if the lines do intersect
     */

    if (!boundingBoxesIntersect(l1, l2)) {
      // Bounding boxes do not intersect
      return null;
    }

    if (l1.slope === l2.slope) {
      if (l1.y_int != l2.y_int) {
        // Parallel lines do not intersect
        return null;
      }

      // Intersection point is one of the middle points. Since there are two
      // middle points, we only need to sort 3 points.
      var ptArr = [l1.start, l1.end, l2.start];
      ptArr.sort(function(a, b) {
        // We will sort based on the sum of coordinates. Because x, y > 0 and
        // the lines are coincident, this is an okay sort for the middle
        return (a.x + a.y) - (b.x + b.y);
      });
      return ptArr[1];
    }

    // If the slopes are not equal, then we can solve for the intersection
    var pt = { x : null, y : null };
    if (l2.slope === Infinity) {
      [l1, l2] = [l2, l1];
    }

    if (l1.slope === Infinity) {
      pt.x = l1.start.x;
      pt.y = l1.start.x * l2.slope + l2.y_int;
    }
    else {
      // So now we have two non-vertical, non-coincident and non-parallel lines
      // Simply find the intersection and then determine if it is in the middle
      // of the two x's and two y's for both line
      // Solve as if we have lines, not line segments
      pt.x = (l2.y_int - l1.y_int) / (l1.slope - l2.slope);
      pt.y = l1.slope * pt.x + l1.y_int;
    }

    // Because of floating point errors, if lines intersect on exactly the
    // endpoints, we might not see that as an intersection
    pt.x = Math.round(pt.x);
    pt.y = Math.round(pt.y);

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
  };

  return lines;
});
