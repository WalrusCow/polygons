define(['util', 'graph/graph'], function(util, Graph) {
  var GraphUtil = {};

  GraphUtil.generate = function(options) {
    // I imagine something like this:
    // First, generate a random planar wheel embedding
    // Next we continue with making the graph interesting
    // We only ever need to choose to split a vertex or add an edge

    // Decide whether to split a vertex or add an edge.
    // To do this, we also need to determine if we can split a vertex.
    // (We can split if graph.maxDegree >= 4)
    // Now, to split a vertex, choose two random non-adjacent vertices

    // To add an edge, simply add one and check for intersections
    // We can retry this some number of times before giving up
    var canvas = document.getElementById(options.canvas);
    canvas.addEventListener('click', this.generate.bind(this, options));
    var ctx = canvas.getContext('2d');

    var mid = {
      x : canvas.width / 2,
      y : canvas.height / 2
    };

    var radius = util.random.number(100, 150);
    var wheelSize = util.random.number(5, 10);

    var graph = generateWheel(wheelSize, mid, radius);

    splitRandomNode(graph);

    var success = false;
    while (success) {
      if (graph.maxDegree < 3) {
        // No choice but to add an edge
        success = addRandomEdge(graph);
        continue;
      }

      var split = Math.random() < 0.5;

      if (split) {
        success = splitRandomNode(graph);
      }
      else {
        success = addRandomEdge(graph);
      }

    }

    graph.draw(ctx);
  };

  function circularNeighbours(a, b, list) {
    // Return true if a, b are "neighbours" in list, if list was circular
    var i = list.indexOf(a);
    var j = list.indexOf(b);
    var tmp = Math.max(i, j);
    j = Math.min(i, j);
    i = tmp;
    if (i - j <= 1) return true;
    // True if the two elements are the ends of the lists
    return (i === (list.length - 1) && j === 0);
  }

  function splitRandomNode(graph) {
    // Choose a node at random to split
    var choices = [];
    for (var i = 0; i < graph.nodes.length; ++i) {
      if (graph.nodes[i].degree >= 4) {
        choices.push(graph.nodes[i]);
      }
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
    } while (circularNeighbours(v1, v2, neighbours))

    // The partition groups
    // v1 is in one and v2 is in the other
    var n1 = [];
    var n2 = [];
    for (var i = 0; i < neighbours.length; ++i) {
      var neighbour = neighbours[i];
      if (!neighbour) continue;

      n1.push(neighbour);
      // Swap which array we are pushing to on each discovery of a boundary
      if (neighbour === v1 || neighbour === v2) {
        var tmp = n1;
        n1 = n2;
        n2 = tmp;
      }
    }

    // Split it now!
    graph.split(node, n1, n2);
  }

  function convexPoints(num, mid, radius) {
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

  function addRandomEdge(graph) {
    // Add a random edge in the graph that maintains planarity
    var TRIES = 10;
    var nodes = graph.nodes;

    for (var i = 0; i < TRIES; ++i) {
      var choices = util.random.choose(2, nodes);
      var u = choices[0];
      var v = choices[1];
      if (graph.addEdge(u, v)) {
        return true;
      }
    }

    return false;
  }

  function generateWheel(size, midPoint, radius) {
    var graph = new Graph();
    var points = convexPoints(size, midPoint, radius);
    var midId = graph.addNode(midPoint);
    var lastId;
    var firstId;

    for (var i = 0; i < points.length; ++i) {
      var id = graph.addNode(points[i]);
      if (lastId) graph.addEdge(id, lastId);
      else firstId = id;
      lastId = id;
      graph.addEdge(id, midId);
    }
    graph.addEdge(id, firstId);

    return graph;
  }

  return GraphUtil;
});
