define(['util', 'graph/util', 'graph/graph'], function(util, graphUtil, Graph) {
  function generateWheel(size, midPoint, radius, options) {
    var graph = new Graph(midPoint, radius, options);
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
    var MOVES = 150;

    var canvas = document.getElementById(options.canvas);
    var ctx = canvas.getContext('2d');

    var mid = {
      x : canvas.width / 2,
      y : canvas.height / 2
    };

    var radius = Math.max(canvas.width / 2, canvas.height / 2) + 100;
    var wheelSize = util.random.number(8, 10);

    var graph = generateWheel(wheelSize, mid, radius, options.graph);
    graph.makeBarycentric();

    var edgeCount = graph.edges.length;
    var nodeCount = graph.nodes.length;

    function addEdge() {
      if (graphUtil.addRandomEdge(graph)) {
        edgeCount += 1;
        return true;
      }
      return false;
    }

    function splitNode() {
      if (graphUtil.splitRandomNode(graph)) {
        nodeCount += 1;
        return true;
      }
      return false;
    }

    // TODO: Keep a ratio of nodes to edges and use that to determine
    // whether to split a node or to add an edge
    for (var action = 0; action < MOVES; ++action) {
      if (graph.maxDegree < 4) {
        // No choice but to add an edge
        addEdge();
        continue;
      }

      // To split or add edge?
      var split;
      if ((edgeCount / nodeCount) > EDGES_PER_NODE) {
        split = true;
      } else {
        split = Math.random() < SPLIT_CHANCE;
      }

      if (split) split = splitNode();
      if (!split) addEdge();
    }

    graph.makeBarycentric();
    graph.draw(ctx);
    return graph;
  };
});
