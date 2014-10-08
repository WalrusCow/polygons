define([], function() {
  var lines = {};

  //////////////////////////////////////////////////////////////////////////////
  // Intersection //////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  lines.Line = function (p1, p2) {
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

  Lines.intersect = function (l1, l2) {
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
  };

  return lines;
});
