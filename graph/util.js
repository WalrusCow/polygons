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
      console.log("Please fix the max degree code");
      return false;
    }
    var node = util.random.choose(1, choices)[0];

    // Sorted
    var neighbours = graph.radialOrderNeighbours(node);

    // Now randomly partition the neighbours
    var v1, v2;
    // We cannot choose nodes that are next to each other in radial order
    do {
      var l = util.random.choose(2, neighbours);
      v1 = l[0]; v2 = l[1];
    } while (GraphUtil.circularNeighbours(v1, v2, neighbours))

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

  GraphUtil.addRandomEdge = function(graph) {
    // Add a random edge in the graph that maintains planarity
    var TRIES = 20;
    var nodes = graph.nodes;

    for (var i = 0; i < TRIES; ++i) {
      var choices = util.random.choose(2, nodes);
      var u = choices[0];
      var v = choices[1];
      if (graph.addEdge(u, v)) {
        console.log("Adding random edge on attempt " + i);
        return true;
      }
    }

    console.log("Failed to add random edge");
    return false;
  }

  return GraphUtil;
});
