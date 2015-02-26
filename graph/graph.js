define(['lines', 'util', 'graph/node', 'graph/edge', 'graph/util', 'matrix'],
       function(lines, util, Node, Edge, graphUtil, Matrix) {
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
  // Graph class
  //
  function Graph(midPoint, radius) {
    // Maintain a list of nodes that each have adjacency lists
    this.nodes = [];
    this.edges = [];
    this.maxDegree = 0;

    // Mid and radius to use for outer facek
    this.midPoint = midPoint;
    this.radius = radius;
  }

  Graph.prototype.isPlanarEmbedding = function() {
    var planar = true;
    this.edges.forEach(function(e) {
      if (this.crosses(e)) {
        planar = false;
      }
    }, this);
    return planar;
  };

  Graph.prototype.crosses = function(edge) {
    // Return true if the line intersects any edge
    var crosses = false;
    this.edges.forEach(function(e) {
      if (e.id === edge.id) return false;
      var pt = edge.intersects(e);
      if (pt)
        // Round!
        pt = { x : Math.round(pt.x), y : Math.round(pt.y) };
      var line = edge.line;
      var edgesCross = pt &&
        // Doesn't count as crossing if the two lines meet at the ends
        !((pointsEqual(pt, line.start) || pointsEqual(pt, line.end)) &&
          (pointsEqual(pt, e.line.start) || pointsEqual(pt, e.line.end)))
      if (edgesCross) crosses = true;
    }, this);
    return crosses;
  };

  Graph.prototype.computeMaxDegree = function() {
    var a = this.maxDegree;
    this.maxDegree = 0;
    this.nodes.forEach(function(n) {
      this.maxDegree = Math.max(this.maxDegree, n.degree);
    }, this);
  };

  Graph.prototype.deleteNode = function(node) {
    // Delete a node and all its edges
    if (!(node instanceof Node)) node = this.nodes[node];

    node.edges.forEach(function(edge, idx) {
      // Remove the edges from the other ends
      edge.otherEnd(node).deleteEdge(edge);
      delete this.edges[edge.id];
    }, this);
    delete this.nodes[node.id];

    this.computeMaxDegree();
  };

  Graph.prototype.addNode = function(pt) {
    var id = firstFreeIndex(this.nodes);
    this.nodes[id] = new Node(id, pt);
    return this.nodes[id];
  };

  Graph.prototype.setOuterFace = function(nodes) {
    // Set the outer face of the graph. Nodes should be ordered such that
    // nodes[n] is adjacent to nodes[n-1] and nodes[n+1].
    if (this.outerFace) {
      this.outerFace.forEach(function(n) {
        // All other nodes variable position
        n.fixed = false;
      });
    }

    this.outerFace = nodes;
    this.outerFace.forEach(function(n) {
      // Outer face is yellow and fixed position
      n.fixed = true;
    });
  };

  Graph.prototype.makeBarycentric = function() {
    // Modify the graph to have a barycentric embedding using the outer
    // face as the fixed face.
    var pts = graphUtil.convexPoints(
        this.outerFace.length, this.midPoint, this.radius);
    this.outerFace.forEach(function(node, idx) {
      node.updateCoords(pts[idx]);
    });

    // Array of nodes whose positions we must solve for
    var nodesToSolve = [];
    this.nodes.forEach(function(node) {
      if (!node.fixed) nodesToSolve.push(node);
    });

    /* The position of a given node v can be described as
     *      v = (n1 + n2 + ... + nk) / k
     * where ni is the position of the ith neighbour of v. Some nodes have
     * fixed positions. Let c1, c2, ..., ct be the positions of the
     * fixed neighbours of v. Let u1, u2, ..., ul be the positions v's
     * neighbours with unknown positions. Then,
     *      v = (c1 + c2 + ... + ct + u1 + u2 + ... + ul) / k
     * Let C = c1 + c2 + ... + ct. Then,
     *      v = (C + u1 + u2 + ... + ul) / k
     * Writing this in a form suitable for input to a matrix gives
     *      (k * v) - u1 - u2 - ... - ul = C
     * Where u1, u2, ..., ul are variables with coefficient -1.
     */
    var n = nodesToSolve.length;

    var coords = [];
    nodesToSolve.forEach(function(node) {
      coords.push({ x : null, y : null });
      node.coords = null;
    });

    ['x', 'y'].forEach(function(c) {
      var matrix = new Matrix(n);

      // What we will augment the matrix with (known coordinates)
      var aug = [];
      nodesToSolve.forEach(function(node, idx) {
        // Fill the matrix as described above
        var known = 0;

        var row = matrix.rows[idx];
        row[idx] = node.neighbours.length;

        node.neighbours.forEach(function(neighbour) {
          if (neighbour.fixed) {
            known += neighbour.coords[c];
            return;
          }

          // Neighbour not fixed, so it is a variable
          nIndex = nodesToSolve.indexOf(neighbour);
          row[nIndex] = -1;
        });

        aug.push(known);
      });

      matrix.augment(aug);
      var ans = matrix.solve();
      if (!ans) {
        console.log('Degenerate barycentric embedding!');
        return false;
      }

      // Push answers to coords
      ans.forEach(function(val, idx) {
        coords[idx][c] = val;
      });

    });

    // Update coords at the end
    coords.forEach(function(coord, idx) {
      nodesToSolve[idx].updateCoords(coord);
    });
    return true;
  };

  Graph.prototype.cutOuterFace = function(uIdx, vIdx) {
    // Cut out a section between uIdx and vIdx in the outer face
    // e.g.  [u, 1, 2, v, 3, 4, 5] -> [u, v, 3, 4, 5]
    var newFace = [];
    var low = Math.min(uIdx, vIdx);
    var high = Math.max(uIdx, vIdx);

    // Determine if we should start at u or v index
    if ((high - low) > (this.outerFace.length - (high - low))) {
      var startIdx = high;
    } else {
      var startIdx = low;
    }

    // Start at one node and skip straight to the other
    newFace.push(this.outerFace[startIdx]);
    var i = (uIdx == startIdx) ? vIdx : uIdx;
    // Now go around the face until we reach the first node
    for (; i !== startIdx; i = (i + 1) % this.outerFace.length) {
      newFace.push(this.outerFace[i]);
    }
    this.setOuterFace(newFace);
  };

  Graph.prototype.addEdge = function(u, v) {
    // Return true if the edge can be added while keeping the graph planar
    if (!(u instanceof Node)) u = this.nodes[u];
    if (!(v instanceof Node)) v = this.nodes[v];

    if (!this.outerFace) {
      // If we have no outer face then we have not yet been initialized
      // so we should just trust the user to add a good edge.
      // This is because if we are not yet 3-connected then we cannot perform
      // the same planarity checks.
      this._addEdge(u, v);
      return true;
    }

    if (u.adjacentTo(v)) {
      // Simple graph only
      return false;
    }

    var edge = this._addEdge(u, v);

    // Save all node positions before insertion
    var posns = {};
    this.nodes.forEach(function(node) {
      posns[node.id] = node.coords;
    });

    // Update the outer face if we must
    var uIdx = this.outerFace.indexOf(u);
    var vIdx = this.outerFace.indexOf(v);
    var oldFace;
    if (uIdx !== -1 && vIdx !== -1) {
      oldFace = this.outerFace;
      this.cutOuterFace(uIdx, vIdx);
    }

    if (!this.makeBarycentric()) {
      if (oldFace) {
        this.setOuterFace(oldFace);
      }
      this.deleteEdge(edge);
      this.makeBarycentric();
      this.computeMaxDegree();
      return false;
    }

    // Which edges we have to check
    var edgesToCheck = {};
    this.nodes.forEach(function(node) {
      if (pointsEqual(node.coords, posns[node.id])) return;
      node.edges.forEach(function(e) {
        edgesToCheck[e.id] = e;
      });
    });

    for (var key in edgesToCheck) {
      if (!this.crosses(edgesToCheck[key])) continue;
      // We cannot create a barycentric embedding with the added edge,
      // or the barycentric embedding is not planar.
      if (oldFace) {
        this.setOuterFace(oldFace);
      }
      this.deleteEdge(edge);
      this.makeBarycentric();
      this.computeMaxDegree();
      return false;
    }

    this.computeMaxDegree();
    return true;
  };

  Graph.prototype._addEdge = function(u, v) {
    // Directly add an edge with no checks
    var id = firstFreeIndex(this.edges);
    var edge = new Edge(id, u, v);

    u.addEdge(edge);
    v.addEdge(edge);
    this.edges[id] = edge;
    return edge;
  };

  Graph.prototype.deleteEdge = function(edge) {
    // Delete the given edge
    edge.u.deleteEdge(edge);
    edge.v.deleteEdge(edge);
    this.computeMaxDegree();
    delete this.edges[edge.id];
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

    // TODO: Remove once all calls use nodes
    if (!(n1[0] instanceof Node)) {
      var idToNode = (function(id) { return this.nodes[id]; });
      n1 = n1.map(idToNode, this);
      n2 = n2.map(idToNode, this);
    }

    // First check if the split is valid
    //var neighbours = this.radialOrderNeighbours(node);
    // TODO: Now check that n1 and n2 are contiguous in `neighbours`

    var outerFaceIdx = this.outerFace.indexOf(node);
    // Remove the split node
    this.deleteNode(node);

    var u = this.addNode();
    var v = this.addNode();

    n1.forEach(function(n) {
      this._addEdge(u, n);
    }, this);
    n2.forEach(function(n) {
      this._addEdge(v, n);
    }, this);

    this._addEdge(u, v);

    if (outerFaceIdx !== -1) this.splitOuterFace(outerFaceIdx, u, v);
    this.makeBarycentric();
    return [u.id, v.id];
  };

  function mod(a, b) {
    // Actually work for negative numbers...
    return ((a % b) + b) % b;
  }

  Graph.prototype.splitOuterFace = function(idx, u, v) {
      // Update outer face
      var f = this.outerFace;
      var r = f[mod(idx + 1, f.length)];
      var l = f[mod(idx - 1, f.length)];
      var ri = u.neighbours.indexOf(r);
      var li = u.neighbours.indexOf(l);

      if (li === -1 && ri === -1)
        // the split has v adjacent to both neighbours
        this.outerFace.splice(idx, 1, v);
      else if (li !== -1 && ri !== -1)
        // the split has u adjacent to both neighbours
        this.outerFace.splice(idx, 1, u);
      else if (li === -1)
        // the split has u adjacent to the preceding neighbour
        this.outerFace.splice(idx, 1, v, u);
      else
        // the split has v adjacent to the preceding neighbour
        this.outerFace.splice(idx, 1, u, v);
      // Call to update colors etc
      this.setOuterFace(this.outerFace);
  };

  return Graph;
});
