define(['graph/edge'], function(Edge) {
  function Node(id, point, fixed) {
    this.id = id;
    this.coords = {
      x : Math.round(point.x),
      y : Math.round(point.y)
    };
    this.neighbours = [];
    this.edges = [];
    this.degree = 0;

    // Whether or not this node is fixed in position
    this.fixed = fixed;

    this.radius = 3;
    this.color = 'red';
  }

  Node.prototype.addEdge = function(edge) {
    this.neighbours.push(edge.otherEnd(this));
    this.edges.push(edge);
    this.degree += 1;
  };

  Node.prototype.deleteEdge = function(edge) {
    this.edges = this.edges.filter(function(e) {
      return e.id !== edge.id;
    });
    this.neighbours = this.neighbours.filter(function(n) {
      return edge.otherEnd(this) !== n;
    }, this);
    this.degree -= 1;
  };

  Node.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.coords.x, this.coords.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  Node.prototype.adjacentTo = function(node) {
    // Return true if we neighbour the given node
    return this.neighbours.indexOf(node) !== -1;
  };

  return Node;
});
