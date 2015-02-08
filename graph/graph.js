define([], function() {
  function Node(id, point) {
    this.id = id;
    this.coords = point;
    this.adj = [];
    this.degree = 0;

    this.radius = 2;
    this.color = 'red';
  }

  Node.prototype.addEdge = function(end) {
    if (end instanceof Node) {
      // Support passing nodes as well
      end = end.id;
    }
    this.adj.push(end);
    this.degree += 1;
  };

  Node.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.coords.x, this.coords.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  function Graph() {
    // Maintain a list of nodes that each have adjacency lists
    this.nodes = [];
    this.maxDegree = 0;
  }

  Graph.wheel = function(size) {
  };

  Graph.prototype.addNode = function(pt) {
    // New id
    var id = this.nodes.length;
    this.nodes.push(new Node(id, pt));
    return id;
  };

  Graph.prototype.addEdge = function(u, v) {
    u = this.nodes[u];
    v = this.nodes[v];
    u.addEdge(v);
    v.addEdge(u);

    this.maxDegree = Math.max(u.degree, v.degree, this.maxDegree);
  };

  Graph.prototype.draw = function(ctx) {
    for (var i = 0; i < this.nodes.length; ++i) {
      this.nodes[i].draw(ctx);
    }
  };

  return Graph;
});
