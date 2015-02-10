define(['lines', 'util'], function(lines, util) {
  var Line = lines.Line;

  function firstFreeIndex(list) {
    for (var i = 0; i < list.length; ++i) {
      if (!list[i]) return i;
    }
    return i;
  }

  function pointsEqual(pt1, pt2) {
    return pt1.x === pt2.x && pt1.y === pt2.y;
  }


  //
  // Edge class
  //
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


  //
  // Node class
  //
  function Node(id, point) {
    this.id = id;
    this.coords = {
      x : Math.round(point.x),
      y : Math.round(point.y)
    };
    this.adj = [];
    this.edges = [];
    this.degree = 0;

    this.radius = 3;
    this.color = 'red';
  }

  Node.prototype.addEdge = function(edge) {
    this.adj.push(edge.otherEnd(this));
    this.edges.push(edge);
    this.degree += 1;
  };

  Node.prototype.deleteEdge = function(edge) {
    var idx = this.edges.findIndex(function(e) { return e.id === edge.id; });
    if (idx != -1) {
      this.edges.splice(idx, 1);
      this.adj.splice(idx, 1);
    }
  };

  Node.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.coords.x, this.coords.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  Node.prototype.neighbours = function(node) {
    // Return true if we neighbour the given node
    for (var i = 0; i < this.adj.length; ++i) {
      if (this.adj[i] === node) return true;
    }
    return false;
  };


  //
  // Graph class
  //
  function Graph() {
    // Maintain a list of nodes that each have adjacency lists
    this.nodes = [];
    this.edges = [];
    this.maxDegree = 0;
  }

  Graph.prototype.crosses = function(edge) {
    // Return true if the line intersects any edge
    for (var i = 0; i < this.edges.length; ++i) {
      if (!this.edges[i]) continue;
      var pt = edge.intersects(this.edges[i]);
      var line = edge.line;
      // No intersection or it was at an endpoint (i.e. in the node)
      if (!pt || pointsEqual(pt, line.start) || pointsEqual(pt, line.end)) {
        continue;
      }
      return true;
    }
    // No intersections
    return false;
  };

  Graph.prototype.deleteNode = function(node) {
    // Delete a node and all its edges
    if (!(node instanceof Node)) node = this.nodes[node];
    var id = node.id;
    for (var i = 0; i < node.edges.length; ++i) {
      // Remove edges from other end
      var edge = node.edges[i];
      node.adj[i].deleteEdge(edge);
      delete this.edges[edge.id];
    }
    delete this.nodes[id];
  };

  Graph.prototype.addNode = function(pt) {
    var id = firstFreeIndex(this.nodes);
    this.nodes[id] = new Node(id, pt);
    return id;
  };

  Graph.prototype.addEdge = function(u, v) {
    // Return true if the edge can be added and keep the embedding planar
    if (!(u instanceof Node)) u = this.nodes[u];
    if (!(v instanceof Node)) v = this.nodes[v];

    if (u.neighbours(v)) {
      // Simple graph only
      return false;
    }

    var id = firstFreeIndex(this.edges);
    var edge = new Edge(id, u, v);
    // Determine if this edge causes an intersection with any existing edges
    if (this.crosses(edge)) {
      // Adding this edge would make this embedding non-planar
      return false;
    }

    // Not a directed graph
    u.addEdge(edge);
    v.addEdge(edge);

    this.edges[id] = edge;
    this.maxDegree = Math.max(u.degree, v.degree, this.maxDegree);
    return true;
  };

  Graph.prototype.draw = function(ctx) {
    for (var i = 0; i < this.edges.length; ++i) {
      if (this.edges[i]) this.edges[i].draw(ctx);
    }

    for (var i = 0; i < this.nodes.length; ++i) {
      if (this.nodes[i]) this.nodes[i].draw(ctx);
    }
  };

  Graph.prototype._orderNeighbours = function(node) {
    // Order the neighbours of node as they appear in CCW direction from the
    // positive x axis.

    // Map neighbouring IDs to nodes and angles from the node
    var angles = node.adj.map(function(neighbour) {
      var to = neighbour.coords;
      var from = node.coords;
      // Calculate the angle from node to neighbour
      var angle = Math.atan2((from.y - to.y), (from.x - to.x));
      // Save the node with the angle for sorting
      return { node : neighbour, angle : angle };
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

    if (!(node instanceof Node)) {
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

    var coord = function(coord) {
      return function(node) { return node.coords[coord]; };
    };
    var sum = function(x, y) { return x + y; };

    // Use average coordinates for new points
    // (solve the system, since we add (u, v) as an edge)
    var s1 = n1.map(coord('x')).reduce(sum, 0);
    var s2 = n2.map(coord('x')).reduce(sum, 0);
    var c1 = n1.length + 1;
    var c2 = n2.length + 1;

    var uPt = {};
    var vPt = {};
    uPt.x = (s1 + s2/c2) / (c1 - (1/c2));
    vPt.x = (s2 + uPt.x) / c2;

    s1 = n1.map(coord('y')).reduce(sum, 0);
    s2 = n2.map(coord('y')).reduce(sum, 0);
    uPt.y = (s1 + s2/c2) / (c1 - (1/c2));
    vPt.y = (s2 + uPt.y) / c2;

    // Remove the split node
    this.deleteNode(node);

    var u = this.addNode(uPt);
    var v = this.addNode(vPt);
    for (var i = 0; i < n1.length; ++i) {
      this.addEdge(u, n1[i]);
    }
    for (var i = 0; i < n2.length; ++i) {
      this.addEdge(v, n2[i]);
    }

    this.addEdge(u, v);

    return [u.id, v.id];
  };

  return Graph;
});
