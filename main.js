requirejs.config({
  urlArgs: "ts="+new Date().getTime(),
  baseUrl : '',
  paths : { 'require' : '.' }
});

requirejs(['polygons', 'intersections', 'graphUtil'],
          function(Polygons, Intersections, GraphUtil) {
  var polygons = new Polygons({ canvas : 'polyCanvas' });
  var intersections = new Intersections({ canvas: 'lineCanvas' });
  GraphUtil.generate({ canvas: 'graphCanvas' });
});
