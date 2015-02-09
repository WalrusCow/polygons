define(['lines'], function(lines) {
  var Line = lines.Line;

  function Node(id, point) {
    this.id = id;
    this.coords = {
      x : Math.round(point.x),
      y : Math.round(point.y)
    };
    this.adj = [];
    this.degree = 0;

    this.radius = 3;
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

  Node.prototype.neighbours = function(node) {
    // Return true if we neighbour the given node
    if (node instanceof Node) {
      node = node.id;
    }
    for (var i = 0; i < this.adj.length; ++i) {
      if (this.adj[i] == node) return true;
    }
    return false;
  };

  function Graph() {
    // Maintain a list of nodes that each have adjacency lists
    this.nodes = [];
    this.edges = [];
    this.maxDegree = 0;
  }

  Graph.prototype.addNode = function(pt) {
    var id = this.nodes.length;
    this.nodes.push(new Node(id, pt));
    return id;
  };

  function pointsEqual(pt1, pt2) {
    return pt1.x == pt2.x && pt1.y == pt2.y;
  }

  Graph.prototype.intersects = function(line) {
    // Return true if the line intersects any edge
    for (var i = 0; i < this.edges.length; ++i) {
      var pt = lines.intersect(line, this.edges[i]);
      // No intersection or it was at an endpoint (i.e. in the node)
      if (!pt || pointsEqual(pt, line.start) || pointsEqual(pt, line.end)) {
        continue;
      }
      return true;
    }
    // No intersections
    return false;
  };

  Graph.prototype.addEdge = function(u, v) {
    // Return true if the edge can be added and keep the embedding planar
    u = this.nodes[u];
    v = this.nodes[v];

    if (u.neighbours(v)) {
      // Simple graph only
      return false;
    }

    var line = new Line(u.coords, v.coords);
    // Determine if this edge causes an intersection with any existing edges
    if (this.intersects(line)) {
      // Adding this edge would make this embedding non-planar
      return false;
    }

    // Not a directed graph
    u.addEdge(v);
    v.addEdge(u);

    this.edges.push(line);
    this.maxDegree = Math.max(u.degree, v.degree, this.maxDegree);
    return true;
  };

  Graph.prototype.draw = function(ctx) {
    for (var i = 0; i < this.edges.length; ++i) {
      this.edges[i].setContext(ctx);
      this.edges[i].draw();
    }

    for (var i = 0; i < this.nodes.length; ++i) {
      this.nodes[i].draw(ctx);
    }
  };

  return Graph;
});
