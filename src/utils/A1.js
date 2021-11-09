const _A = 65;
const _Z = 90;

export function toCol (col) {
  let n = col;
  let c = '';
  while (n >= 0) {
    c = String.fromCharCode(n % 26 + _A) + c;
    n = Math.floor(n / 26) - 1;
  }
  return c;
}

export function fromCol (colstr) {
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

export function renderA1 (coord) {
  return (
    (coord.$C ? '$' : '') +
    toCol(coord[0]) +
    (coord.$R ? '$' : '') +
    (coord[1] + 1)
  );
}

export function parseA1 (a1) {
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

export function toRect (a1) {
  const b = a1.split(':');
  return [ parseA1(b[0]), parseA1(b[1] || b[0]) ];
}

export function contains (rect, coord) {
  const [ tl, br ] = rect;
  return (
    coord[0] >= tl[0] && coord[0] <= br[0] &&
    coord[1] >= tl[1] && coord[1] <= br[1]
  );
}
