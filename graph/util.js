define(['util'], function(util) {
  var GraphUtil = {};

  GraphUtil.circularNeighbours = function(a, b, list) {
    // Return true if a, b are "neighbours" in list, if list was circular
    var i = list.indexOf(a);
    var j = list.indexOf(b);
    if (Math.abs(i - j) <= 1) return true;
    // At least one is zero and they are cumulatively the total elements
    // (at least one is the list.length)
    return (!i || !j) && (i + j === list.length - 1);
  }

  GraphUtil.splitRandomNode = function(graph) {
    /* Possible improvements:
     *  - Split nodes to maximize the difference in direction of edges
     *  - Split the node whose neighbours are furthest away on average
     *    (not the node furthest from all other nodes)
     */
    // Choose a node at random to split
    var choices = [];
    graph.nodes.forEach(function(node) {
      if (node.degree >= 4) choices.push(node);
    });
    if (choices.length === 0) {
      //console.log("Please fix the max degree code");
      return false;
    }
    var node = findIsolatedNodes(choices, graph.nodes, 1)[0];

    // Sorted
    var neighbours = graph.radialOrderNeighbours(node);

    var v1 = util.random.choose(1, neighbours);
    // We want to split almost evenly, but randomly
    var idx = neighbours.indexOf(v1);
    var l = neighbours.length;

    // Allow max split to be a 70/30 split
    var maxSplit = Math.floor(l/2 + l/5);
    var minSplit = Math.max(2, Math.ceil(l/2 - l/5));

    var jdx = (idx + util.random.number(minSplit, maxSplit)) % l;
    // Choose v2 from halfway around the neighbours
    var v2 = neighbours[jdx];

    // The partition groups
    // v1 is in one and v2 is in the other
    var n1 = [];
    var n2 = [];
    neighbours.forEach(function(neighbour) {
      n1.push(neighbour);
      // Swap which array we are pushing to on each discovery of a boundary
      if (neighbour === v1 || neighbour === v2) {
        var tmp = n1;
        n1 = n2;
        n2 = tmp;
      }
    });

    // Split it now!
    return graph.split(node, n1, n2);
  }

  GraphUtil.convexPoints = function(num, mid, radius) {
    // Return an array of points for a regular convex polygon with
    // given radius and center
    var points = [];
    var angle = Math.PI * 2 / num;
    for (var i = 0; i < num; ++i) {
      points.push({
        x : mid.x + (Math.cos(angle * i) * radius),
        y : mid.y + (Math.sin(angle * i) * radius)
      });
    }
    return points;
  }

  function findIsolatedNodes(chooseSet, allNodes, numNodes) {
    /* Find the most isolated node out of all nodes in `chooseSet`
     * by comparing how close they are to each node in `allNodes` */

    numNodes = numNodes || 1;

    // TODO: This could possibly be approximated by checking for how close
    // a node's neighbours are to the node. Either an average or the min
    // might work just as well.

    function distance(n1, n2) {
      function sq(x) { return x * x; }
      return sq(n1.coords.x - n2.coords.x) + sq(n1.coords.y - n2.coords.y);
    }

    var isolatedNodes = [];
    function sortedAdd(dist, node) {
      if (isolatedNodes.length < numNodes) {
        isolatedNodes.push({dist: dist, node: node});
        return;
      }

      for (var i = 0; i < isolatedNodes.length; ++i) {
        if (isolatedNodes[i].dist < dist) {
          isolatedNodes.splice(i, 0, {dist : dist, node : node});
          isolatedNodes.pop();
        }
      }
    }

    chooseSet.forEach(function(node) {
      // Find the closest node to this one
      var closestD;
      allNodes.forEach(function(other) {
        if (other.id === node.id) return;
        if (node.fixed && other.fixed) return;

        var d = distance(node, other);
        if (!closestD || d < closestD) {
          // Other is the closest to node so far
          closestD = d;
        }
      });

      sortedAdd(closestD, node);
    });
    return isolatedNodes.map(function(x) { return x.node; });
  }

  GraphUtil.addRandomEdge = function(graph) {
    /* Possible improvements:
     *  - Find the face of largest area and add an edge between opposing
     *    nodes in the face.
     *      - Traverse edges clockwise & anti-clockwise
     *      - Find initial faces (when outer face is set) and keep track
     *        while adding edges and splitting vertices.
     *  - Improve success rate: For a given node, send out lines in several
     *    directions. On the *first* (closest to the node) intersection of a
     *    line, look at the ends. If an end is not adjacent to the node then
     *    add an edge to it.
     *  - Improve success rate (?): Try to add an edge only to nodes within
     *    a certain radius? Try to add an edge to every node?
     */
    // Add a random edge in the graph that maintains planarity
    var TRIES = 20;

    // Try to create an edge from a node with no close nodes
    var isolatedNodes = findIsolatedNodes(graph.nodes, graph.nodes, 6);
    var isolatedNode = util.random.choose(1, isolatedNodes);

    // Now try to add an edge from isolatedNode
    var nodesToTry = util.random.choose(TRIES, graph.nodes);
    var fixed = isolatedNode.fixed;
    for (var i = 0; i < nodesToTry.length; ++i) {
      var n = nodesToTry[i];
      if (n.id === isolatedNode.id
          || isolatedNode.adjacentTo(n)
          || fixed && n.fixed) {
        continue;
      }
      if (graph.addEdge(isolatedNode, n)) return true;
    }
    console.log("Fail add edge");
    return false;
  }
  return GraphUtil;
});
