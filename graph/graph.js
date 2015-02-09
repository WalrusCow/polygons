define(['lines', 'util'], function(lines, util) {
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
    if (!u instanceof Node) u = this.nodes[u];
    if (!v instanceof Node) v = this.nodes[v];

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

  Graph.prototype._orderNeighbours = function(node) {
    // Order the neighbours of node as they appear in CCW direction from the
    // positive x axis.

    // Map neighbouring IDs to nodes and angles from the node
    var angles = node.adj.map(function(id) {
      var to = this.nodes[id].coords;
      var from = node.coords;
      // Calculate the angle from node to neighbour
      var angle = Math.atan2((from.y - to.y), (from.x - to.x));
      // Save the node with the angle for sorting
      return { node : this.nodes[id], angle : angle };
    }, this);

    // Sort according to angle
    angles.sort(function(a, b) { return a.angle - b.angle; });

    // Finally, discard the angles because we just want nodes
    return angles.map(function(obj) { obj.node });
  };

  Graph.prototype.split = function(node, n1, n2) {
    // Split the given node into two nodes u and v, with u having neighbours
    // n1 and v having neighbours n2. Return false if the result would not be
    // planar or a two-element list of the IDs of the new nodes otherwise

    if (!node instanceof Node) {
      node = this.nodes[node];
    }

    // We want to remain 3-connected
    if (n1.length < 2 || n2.length < 2) {
      return false;
    }

    var idToNode = (function(id) { return this.nodes[id]; });
    n1 = n1.map(idToNode, this);
    n2 = n2.map(idToNode, this);

    // First check if the split is valid
    var neighbours = this._orderNeighbours(node);
    // TODO: Now check that n1 and n2 are contiguous in `neighbours`

    // Remove the split node
    // TODO: Reuse one? Or have a getId() for no holes?
    delete this.nodes[node.id];

    var coord = function(coord) {
      return function(node) { return node.coords[coord]; };
    };

    // Use average coordinates for new points
    var pt1 = {
      x : util.average(n1.map(coord('x'))),
      y : util.average(n1.map(coord('y')))
    };
    var pt2 = {
      x : util.average(n2.map(coord('x'))),
      y : util.average(n2.map(coord('y')))
    };

    var u = this.addNode(pt1);
    var v = this.addNode(pt2);
    for (var i = 0; i < n1.length; ++i) {
      this.addEdge(u, n1[i]);
    }
    for (var i = 0; i < n2.length; ++i) {
      this.addEdge(v, n2[i]);
    }

    return [u.id, v.id];
  };

  return Graph;
});
