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

    // TODO: Keep a ratio of nodes to edges and use that to determine
    // whether to split a node or to add an edge
    for (var action = 0; action < 80; ++action) {
      if (graph.maxDegree < 4) {
        // No choice but to add an edge
        graphUtil.addRandomEdge(graph);
        continue;
      }

      var split = Math.random() < 0.7;
      if (split) {
        graphUtil.splitRandomNode(graph);
      }
      else {
        graphUtil.addRandomEdge(graph);
      }
    }

    graph.makeBarycentric();
    graph.draw(ctx);
    return graph;
  };
});
