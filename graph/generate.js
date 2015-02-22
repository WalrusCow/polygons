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

    var radius = util.random.number(100, 150);
    var wheelSize = util.random.number(5, 10);

    /*
    var graph = new Graph(mid, radius);
    var n1 = graph.addNode();
    var n2 = graph.addNode();
    var n3 = graph.addNode();
    var n4 = graph.addNode();
    graph.addEdge(n1, n2);
    graph.addEdge(n2, n3);
    graph.addEdge(n3, n4);
    graph.addEdge(n4, n1);

    var v = graph.addNode();
    var u = graph.addNode();
    var x = graph.addNode();
    u.color = 'white';
    v.color = 'black';
    x.color = 'grey';
    graph.addEdge(v, n1);
    graph.addEdge(v, n2);
    graph.addEdge(u, n3);
    graph.addEdge(x, n4);
    graph.addEdge(u, v);
    graph.addEdge(x, v);
    graph.addEdge(x, u);

    graph.setOuterFace([n1, n2, n3, n4]);

    n1.color = 'purple';
    n2.color = 'yellow';
    n3.color = 'red';
    n4.color = 'blue';

    graph.makeBarycentric();

    graph.draw(ctx);
    return;
    */

    ctx = document.getElementById('polyCanvas').getContext('2d');
    var ctx2 = document.getElementById('lineCanvas').getContext('2d');

    var graph = generateWheel(wheelSize, mid, radius);
    graph.makeBarycentric();

    for (var action = 0; action < 5; ++action) {
      if (graph.maxDegree < 4) {
        // No choice but to add an edge
        console.log("No node to split");
        ctx2.clearRect(0,0,1000,1000);
        graph.draw(ctx2);
        graphUtil.addRandomEdge(graph);
        ctx.clearRect(0,0,1000,1000);
        graph.draw(ctx);
        continue;
      }

      var split = Math.random() < 0.5;

      if (split) {
        console.log("Splitting a random node");
        ctx2.clearRect(0,0,1000,1000);
        graph.draw(ctx2);
        graphUtil.splitRandomNode(graph);
        ctx.clearRect(0,0,1000,1000);
        graph.draw(ctx);
      }
      else {
        console.log("Adding a random edge");
        ctx2.clearRect(0,0,1000,1000);
        graph.draw(ctx2);
        graphUtil.addRandomEdge(graph);
        ctx.clearRect(0,0,1000,1000);
        graph.draw(ctx);
      }

    }

    graph.makeBarycentric();
    graph.draw(ctx);
  };
});
