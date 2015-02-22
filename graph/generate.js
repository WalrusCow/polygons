define(['util', 'graph/util', 'graph/graph'], function(util, graphUtil, Graph) {
  function generateWheel(size, midPoint, radius) {
    var graph = new Graph(midPoint, radius);
    var points = graphUtil.convexPoints(size, midPoint, radius);
    var midNode = graph.addNode(midPoint);
    var lastNode;
    var firstNode;

    var outerFace = [];
    for (var i = 0; i < points.length; ++i) {
      var node = graph.addNode(points[i]);
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

    var radius = util.random.number(100, 150);
    var wheelSize = util.random.number(5, 10);

    var graph = new Graph(mid, radius);
    var n1 = graph.addNode({ x : 5, y : canvas.height - 5 });
    var n2 = graph.addNode({ x : 5, y : 5});
    var n3 = graph.addNode({ x : canvas.width - 5, y : 5 });
    var n4 = graph.addNode({ x : canvas.width - 5, y : canvas.height - 5 });

    graph.addEdge(n1, n2);
    graph.addEdge(n2, n3);
    graph.addEdge(n3, n4);
    graph.addEdge(n4, n1);
    graph.setOuterFace([n1, n2, n3, n4]);

    var m = graph.addNode({x : 10, y : 10});
    graph._addEdge(m, n1);
    graph._addEdge(m, n2);
    graph._addEdge(m, n3);
    graph._addEdge(m, n4);


    n1.fixed = true;
    n1.color = 'purple';
    n2.fixed = true;
    n2.color = 'yellow';
    n3.fixed = true;
    n3.color = 'red';
    n4.fixed = true;
    n4.color = 'blue';

    graph.makeBarycentric();

    graph.draw(ctx);
    return;

    var graph = generateWheel(wheelSize, mid, radius);

    for (var action = 0; action < 5; ++action) {
      if (graph.maxDegree < 4) {
        // No choice but to add an edge
        console.log("No node to split");
        graphUtil.addRandomEdge(graph);
        continue;
      }

      var split = Math.random() < 0.5;

      if (split) {
        console.log("Splitting a random node");
        graphUtil.splitRandomNode(graph);
      }
      else {
        console.log("Adding a random edge");
        graphUtil.addRandomEdge(graph);
      }

    }

    graph.draw(ctx);
  };
});
