requirejs.config({
  urlArgs: "ts="+new Date().getTime(),
  baseUrl : '',
  paths : { 'require' : '.' }
});

requirejs(['polygons', 'intersections', 'graph/generate'],
          function(Polygons, Intersections, generateGraph) {
  var polygons = new Polygons({ canvas : 'polyCanvas' });
  var intersections = new Intersections({ canvas: 'lineCanvas' });
  generateGraph({ canvas: 'graphCanvas' });
});
