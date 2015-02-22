define(['lines'], function(lines) {
  var Line = lines.Line;

  function Edge(id, u, v) {
    this.id = id;
    this.line = new Line(u.coords, v.coords);
    this.nodes = [u, v];
  }

  Edge.prototype.otherEnd = function(end) {
    if (this.nodes[0].id === end.id) return this.nodes[1];
    if (this.nodes[1].id === end.id) return this.nodes[0];
    throw new Error("Given node not in this edge");
  };

  Edge.prototype.intersects = function(edge) {
    return lines.intersect(this.line, edge.line);
  };

  Edge.prototype.draw = function(ctx) {
    this.line.setContext(ctx);
    this.line.draw();
  };

  Edge.prototype.updateCoords = function() {
    this.line = new Line(this.nodes[0].coords, this.nodes[1].coords);
  };

  return Edge;
});
