requirejs.config({
  urlArgs: "ts="+new Date().getTime(),
  baseUrl : '',
  paths : { 'require' : '.' }
});

requirejs(['polygons'/*, 'intersections'*/], function(Polygons/*, Intersections*/) {
  var polygons = new Polygons({ canvas : 'polyCanvas' });
  //var intersections = new Intersections();
});
