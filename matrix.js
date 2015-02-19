define([], function() {
  function Matrix(n) {
    // Square matrix n x n
    this.rows = [];

    // Initialize to zeroes
    for (var i = 0; i < n; ++i) {
      var row = [];
      for (var j = 0; j < n; ++j) {
        row.push(0);
      }
      this.rows.push(row);
    }
  }

  Matrix.prototype.solve = function() {
    // Solve the matrix, returning a list of length n containing the solutions
    // (in the original order they were entered)
    // This *will* modify the matrix
    // Return false if the matrix is not solvable (a bad time)

    // Augment the matrix such that we can solve it
    this.rows.forEach(function(row) {
      row.push(1);
    });
    this.augmented = true;

    // Now row-reduce the augmented matrix using some basic strategy
    for (var i = 0; i < this.rows.length; ++i) {
      // Unable to create a 1 in this column
      if (!this.reduceColumn(i)) return false;
    }

    var ans = [];
    for (var i = 0; i < this.rows.length; ++i) {
      // Put the answer into the correct return slot
      ans.push(this.rows[i].pop());
    }
    return ans;
  };

  Matrix.prototype.reduceColumn = function(n) {
    // Reduce the specified column
    if (this.rows[n][n] === 0) {
      // We have a zero in the spot we are supposed to be using to reduce
      // Find a new row, or return false if no such row exists
      for (var newRow = n + 1; newRow < this.rows.length; ++newRow) {
        // Found one
        if (this.rows[newRow][newRow] !== 0) break;
      }
      // None found
      if (newRow === this.rows.length) return false;

      // Swap the rows
      tmp = this.rows[n];
      this.rows[n] = this.rows[newRow];
      this.rows[newRow] = tmp;
    }

    this.multiplyRow(this.rows[n], 1 / this.rows[n][n]);
    // Exact
    this.rows[n][n] = 1;

    // Create zeros in lower rows
    for (var i = 0; i < this.rows.length; ++i) {
      if (i == n) continue;
      // Already have a zero here
      if (this.rows[i][n] === 0) continue;
      var mult = this.rows[i][n];// / this.rows[n][n];
      // Subtract to create a 0
      this.addToRow(this.rows[i], this.rows[n], -mult);
      // Exact
      this.rows[i][n] = 0;
    }

    return true;
  };


  Matrix.prototype.multiplyRow = function(row, mult) {
    for (var i = 0 ; i < row.length; ++i) {
      if (row[i]) row[i] *= mult;
    }
  };

  Matrix.prototype.addToRow = function(dest, source, mult) {
    // Add (mult * source) to dest row
    for (var i = 0; i < dest.length; ++i) {
      dest[i] += mult * source[i];
    }
  };

  Matrix.prototype.toString = function() {
    var strs = [''];

    function toString(n) {
      // Two decimal places (or none for whole numbers)
      return (n % 1 === 0) ? n : n.toFixed(2);
    }

    // Collect the maximum length of a number
    var maxLen = 0;
    for (var i = 0; i < this.rows.length; ++i) {
      for (var j = 0; j < this.rows[i].length; ++j) {
        maxLen = Math.max(maxLen, toString(this.rows[i][j]).length);
      }
    }

    for (var i = 0; i < this.rows.length; ++i) {
      var numStrs = [];
      for (var j = 0; j < this.rows[i].length; ++j) {
        // Add to the string
        var n = toString(this.rows[i][j]);
        var s = '';
        // Left pad
        for (var k = n.length; k < maxLen; ++k) s += ' ';
        numStrs.push(s + n);
      }
      strs.push('| ' + numStrs.join('  ') + ' |');
    }

    return strs.join('\n');
  };

  return Matrix;
});
