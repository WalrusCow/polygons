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
    this.neighbours = [];
    this.edges = [];
    this.degree = 0;

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
    var crosses = false;
    return this.edges.some(function(e) {
      var pt = edge.intersects(e);
      var line = edge.line;
      // Endpoint intersections don't count as crossing
      return pt && !pointsEqual(pt, line.start) && !pointsEqual(pt, line.end)
    });
  };

  Graph.prototype.deleteNode = function(node) {
    // Delete a node and all its edges
    if (!(node instanceof Node)) node = this.nodes[node];

    // We have to find the new max degree
    this.maxDegree = 0;
    this.nodes.forEach(function(n) {
      if (n === node) return;
      if (n.degree > this.maxDegree) this.maxDegree = n.degree;
    }, this);

    // Find new min degree
    this.minDegree = Infinity;
    this.nodes.forEach(function(n) {
      if (n === node) return;
      if (n.degree < this.minDegree) this.minDegree = n.degree;
    }, this);

    node.edges.forEach(function(edge, idx) {
      // Remove the edges from the other ends
      node.neighbours[idx].deleteEdge(edge);
      delete this.edges[edge.id];
    }, this);
    delete this.nodes[node.id];
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

    if (u.adjacentTo(v)) {
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
    function draw(elem) {
      elem.draw(ctx);
    }
    this.edges.forEach(draw);
    this.nodes.forEach(draw);
  };

  Graph._radialOrder = function(nodes, point) {
    // Order the nodes around the point in CCW from positive x axis direction

    // Map neighbouring IDs to nodes and angles from the node
    var angles = nodes.map(function(node) {
      var to = node.coords;
      var from = point;
      // Calculate the angle from node to neighbour
      var angle = Math.atan2((from.y - to.y), (from.x - to.x));
      // Save the node with the angle for sorting
      return { node : node, angle : angle };
    }, this);

    // Sort according to angle
    angles.sort(function(a, b) { return a.angle - b.angle; });

    // Finally, discard the angles because we just want nodes
    return angles.map(function(obj) { return obj.node; });
  };

  Graph.prototype.radialOrderNeighbours = function(node) {
    return Graph._radialOrder(node.neighbours, node.coords);
  };

  Graph.prototype.split = function(node, n1, n2) {
    // Split the given node into two nodes u and v, with u having neighbours
    // n1 and v having neighbours n2. Return false if the result would not be
    // planar or a two-element list of the IDs of the new nodes otherwise

    if (!(node instanceof Node)) {
      node = this.nodes[node];
    }

    if (node.neighbours.length != (n1.length + n2.length)) {
      console.log('Not all neighbours included in split');
      return false;
    }

    // We want to remain 3-connected
    if (n1.length < 2 || n2.length < 2) {
      console.log('Each split set must have at least 2 vertices');
      return false;
    }

    if (!(n1[0] instanceof Node)) {
      var idToNode = (function(id) { return this.nodes[id]; });
      n1 = n1.map(idToNode, this);
      n2 = n2.map(idToNode, this);
    }

    // First check if the split is valid
    var neighbours = this.radialOrderNeighbours(node);
    // TODO: Now check that n1 and n2 are contiguous in `neighbours`

    var coord = function(coord) {
      return function(node) { return node.coords[coord]; };
    };
    var sum = function(x, y) { return x + y; };

    // Use average coordinates for new points
    // (solve the system, since we add (u, v) as an edge)
    // TODO: Generalize to an n-dimensional matrix case for the complete
    // barycentric embedding of a graph
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
    // TODO: These adds can fail sometimes =\
    // Probably need to do this properly (i.e. finding a 3-sep, etc) for this
    // to actually work. That is, not give points to nodes until the end
    n1.forEach(function(n) {
      this.addEdge(u, n);
    }, this);
    n2.forEach(function(n) {
      this.addEdge(v, n);
    }, this);

    this.addEdge(u, v);

    return [u.id, v.id];
  };

  return Graph;
});
