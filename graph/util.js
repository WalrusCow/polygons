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
    // Choose a node at random to split
    var choices = [];
    graph.nodes.forEach(function(node) {
      if (node.degree >= 4) choices.push(node);
    });
    if (choices.length === 0) {
      //console.log("Please fix the max degree code");
      return false;
    }
    var node = util.random.choose(1, choices);

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
    graph.split(node, n1, n2);
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

  function findIsolatedNode(chooseSet, allNodes) {
    // TODO: This could possibly be approximated by checking for how close
    // a node's neighbours are to the node. Either an average or the min
    // might work just as well.

    function distance(n1, n2) {
      function sq(x) { return x * x; }
      return sq(n1.coords.x - n2.coords.x) + sq(n1.coords.y - n2.coords.y);
    }

    var isolatedNode;
    var maxDistance;
    chooseSet.forEach(function(node) {
      // Find the closest node to this one
      var closestD;
      allNodes.forEach(function(other) {
        if (other.id === node.id) return;

        var d = distance(node, other);
        if (!closestD || d < closestD) {
          // Other is the closest to node so far
          closestD = d;
        }
      });

      if (!maxDistance || closestD > maxDistance) {
        maxDistance = closestD;
        isolatedNode = node;
      }
    });
    return isolatedNode;
  }

  GraphUtil.addRandomEdge = function(graph) {
    // Add a random edge in the graph that maintains planarity
    var TRIES = 20;

    // Try to create an edge from a node with no close nodes
    var isolatedNode = findIsolatedNode(graph.nodes, graph.nodes);

    // Now try to add an edge from isolatedNode
    var nodesToTry = util.random.choose(TRIES, graph.nodes);
    for (var i = 0; i < nodesToTry.length; ++i) {
      if (nodesToTry[i].id === isolatedNode.id
          || isolatedNode.adjacentTo(nodesToTry[i])) {
        continue;
      }
      if (graph.addEdge(isolatedNode, nodesToTry[i])) return true;
    }
    return false;
  }

  return GraphUtil;
});
