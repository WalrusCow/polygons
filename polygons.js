define(['polygon', 'util'], function(Polygon, util) {
  function Polygons(options) {
    this._canvas = document.getElementById(options.canvas);

    this._ctx = this._canvas.getContext('2d');
    this._canvas.addEventListener('click', this.onClick.bind(this));
    this._canvas.addEventListener('dblclick', this.onDblClick.bind(this));

    // Draw polygons, each of which is a list of points.
    this._polygons = [];
    // Whether or not we are currently drawing a polygon
    this._drawing = false;
  }

  Polygons.prototype.onDblClick = function(e) {
    /* Close the polygon on double click */
    if (!this._drawing) return;
    this._drawing = false;

    // Draw the last line segment
    this._polygons[this._polygons.length - 1].fill();
  };

  function onClick(e) {
    var coords = util.getClickCoords(e, this._canvas);
    // Invalid click
    if (!coords) return;

    if (!this._drawing) {
      this._polygons.push(new Polygon(this._canvas));
      this._drawing = true;
    }
    this._polygons[this._polygons.length - 1].addPoint(coords);
  }
  Polygons.prototype.onClick = util.rateLimit(onClick, 160);

  return Polygons;
});
