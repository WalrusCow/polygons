requirejs.config({
  urlArgs: "ts="+new Date().getTime(),
});

requirejs(['polygon'], function(Polygon) {
  function rateLimit(func, rate) {
    var blocked = false;
    return function() {
      if (blocked) {
        return;
      }
      blocked = true;
      setTimeout(function() {
        blocked = false;
      }, rate);
      func.apply(this, arguments);
    };
  };

  function getClickCoords(e, clickElem) {
    /* Get the coordinates for a click on canvas, or null if invalid */
    var offset = {
      x : 0,
      y : 0
    };

    var el = clickElem;
    do {
      offset.x += el.offsetLeft - el.scrollLeft;
      offset.y += el.offsetTop - el.scrollTop;
      // Do not do body, because chrome adds scroll to body but FF does not
    } while ((el = el.offsetParent) && (el !== document.body))

    var x = e.pageX - offset.x;
    var y = e.pageY - offset.y;

    // Account for the border
    var canvasStyle = getComputedStyle(clickElem);
    x -= canvasStyle.getPropertyValue('border-left-width').replace(/px$/, '');
    y -= canvasStyle.getPropertyValue('border-top-width').replace(/px$/, '');
    // Invalid click handling
    if (y < 0 || y > clickElem.height || x < 0 || x > clickElem.width) {
      return null;
    }
    return { x : x, y : y };
  };

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
    var coords = getClickCoords(e, this._canvas);
    // Invalid click
    if (!coords) return;

    if (!this._drawing) {
      this._polygons.push(new Polygon(this._canvas));
      this._drawing = true;
    }
    this._polygons[this._polygons.length - 1].addPoint(coords);
  }
  Polygons.prototype.onClick = rateLimit(onClick, 160);

  new Polygons({ canvas : 'polyCanvas' });
});
