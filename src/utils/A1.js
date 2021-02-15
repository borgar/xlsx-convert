const _A = 65;
const _Z = 90;

function toCol (col) {
  let n = col;
  let c = '';
  while (n >= 0) {
    c = String.fromCharCode(n % 26 + _A) + c;
    n = Math.floor(n / 26) - 1;
  }
  return c;
}

function fromCol (colstr) {
  const c = colstr.toUpperCase();
  let d = 0;
  let i = 0;
  for (; i !== c.length; ++i) {
    const chr = c.charCodeAt(i);
    if (chr >= _A && chr <= _Z) { // omits any non A-Z character
      d = 26 * d + chr - 64;
    }
  }
  return d - 1;
}

function renderA1 (coord) {
  return (
    (coord.$C ? '$' : '') +
    toCol(coord[0]) +
    (coord.$R ? '$' : '') +
    (coord[1] + 1)
  );
}

function parseA1 (a1) {
  const m = /^(\$)?([a-z]+)(\$)?(\d+)$/i.exec(a1);
  if (m) {
    const point = [
      fromCol(m[2]),
      +m[4] - 1
    ];
    point.$C = !!m[1];
    point.$R = !!m[3];
    return point;
  }
  throw new Error('Invalid A1 ref: ' + a1);
}

function toRect (a1) {
  const b = a1.split(':');
  return [ parseA1(b[0]), parseA1(b[1] || b[0]) ];
}

function isInside (rect, coord) {
  const [ tl, br ] = rect;
  return (
    coord[0] >= tl[0] && coord[0] <= br[0] &&
    coord[1] >= tl[1] && coord[1] <= br[1]
  );
}

exports.parseA1 = parseA1;
exports.renderA1 = renderA1;
exports.toRect = toRect;
exports.toCol = toCol;
exports.fromCol = fromCol;
exports.isInside = isInside;

/*
console.log(fromCol('A'), toCol(fromCol('A')));

const r = toRect('F2:F19');
console.log( isInside(r, parseA1('F2')), true );
console.log( isInside(r, parseA1('F9')), true );
console.log( isInside(r, parseA1('F19')), true );
console.log( isInside(r, parseA1('F1')), false );
console.log( isInside(r, parseA1('F20')), false );
console.log( isInside(r, parseA1('E7')), false );
console.log( isInside(r, parseA1('G7')), false );
*/

