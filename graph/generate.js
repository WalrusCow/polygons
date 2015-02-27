define(['util', 'graph/util', 'graph/graph'], function(util, graphUtil, Graph) {
  function generateWheel(size, midPoint, radius) {
    var graph = new Graph(midPoint, radius);
    var midNode = graph.addNode();
    var lastNode;
    var firstNode;

    var outerFace = [];
    for (var i = 0; i < size; ++i) {
      var node = graph.addNode();
      outerFace.push(node);

      if (lastNode) graph.addEdge(node, lastNode);
      else firstNode = node;
      lastNode = node;
      graph.addEdge(node, midNode);
    }
    graph.addEdge(node, firstNode);

    graph.setOuterFace(outerFace);
    return graph;
  }

  return function(options) {
    var EDGES_PER_NODE = 6;
    var SPLIT_CHANCE = 0.35;

    var canvas = document.getElementById(options.canvas);
    var ctx = canvas.getContext('2d');

    var mid = {
      x : canvas.width / 2,
      y : canvas.height / 2
    };

    var radius = 400
    var wheelSize = util.random.number(8, 16);

    var graph = generateWheel(wheelSize, mid, radius);
    graph.makeBarycentric();

    var edgeCount = graph.edges.length;
    var nodeCount = graph.nodes.length;

    // TODO: Keep a ratio of nodes to edges and use that to determine
    // whether to split a node or to add an edge
    for (var action = 0; action < 80; ++action) {
      if (graph.maxDegree < 4) {
        // No choice but to add an edge
        if (graphUtil.addRandomEdge(graph)) {
          edgeCount += 1;
        }
        continue;
      }

      // To split or add edge?
      var split;
      if ((edgeCount / nodeCount) > EDGES_PER_NODE) {
        // More than 5 edges per node
        split = true;
      } else {
        split = Math.random() < SPLIT_CHANCE;
      }

      if (split) {
        if (graphUtil.splitRandomNode(graph)) {
          nodeCount += 1;
        }
      }
      else {
        if (graphUtil.addRandomEdge(graph)) {
          edgeCount += 1;
        }
      }
    }

    graph.makeBarycentric();
    graph.draw(ctx);
    return graph;
  };
});
