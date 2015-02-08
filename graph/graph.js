define([], function() {
  function Node(id, adj) {
    this.id = id;
    this.adj = adj
    this.degree = adj.length;
  }

  Node.prototype.addEdge = function(end) {
    if (end instanceof Node) {
      // Support passing nodes as well
      end = end.id;
    }
    this.adj.push(end);
    this.degree += 1;
  };

  function Graph() {
    // Maintain a list of nodes that each have adjacency lists
    this.nodes = [];
    this.maxDegree = 0;
  }

  Graph.randomWheel = function(size) {
  }

  Graph.prototype.addNode = function(adj) {
    var id = this.nodes.length;

    for (var i = 0; i < adj.length; ++i) {
      this.nodes[adj[i]].addEdge(id);
    }

    // Copy the neighbours to avoid ugliness
    this.nodes.push(new Node(id, adj.slice(0)));
  };

  Graph.prototype.addEdge = function(u, v) {
    u = this.nodes[u];
    v = this.nodes[v];
    u.addEdge(v);
    v.addEdge(u);

    this.maxDegree = Math.max(u.degree, v.degree, this.maxDegree);
  };

  return Graph;
});
