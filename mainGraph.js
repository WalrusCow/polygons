requirejs.config({
  urlArgs: "ts="+new Date().getTime(),
  baseUrl : '',
  paths : { 'require' : '.' }
});

var canvas = document.getElementById('graphCanvas');
var wrapper = document.getElementById('wrapper');
canvas.height = wrapper.clientHeight;
canvas.width = wrapper.clientWidth;

requirejs(['graph/generate'], function(generateGraph) {
  generateGraph({ canvas: 'graphCanvas' });
});

