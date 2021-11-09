import { parseA1, renderA1 } from './utils/A1.js';

const tokenHandlers = [
  [ 'operator',    /^(<=|>=|<>|[-+/*^%&<>=]|[{},;]|[()]|@|:|!)/ ],
  [ 'bool',        /^(TRUE|FALSE)\b/i ],
  [ 'error',       /^#(NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!)/ ],
  [ 'number',      /^(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/ ],
  [ 'function',    /^[A-Z]+(?=\s*\()/i ],
  [ 'whitespace',  /^\s+/ ],
  [ 'string',      /^"(?:""|[^"])*("|$)/ ],
  [ 'path:quote',  /^'(?:''|[^'])*('|$)/ ],
  [ 'path:brace',  /^\[(?:[^\]])*(\]|$)/ ],
  [ 'range:a1',    /^\$?[A-Z]+\$?[1-9][0-9]*/ ],
  [ 'range:rc',    /^((R(?=[C[])(\[[+-]?\d+\])?)?C(\[[+-]?\d+\]|\b)|R(\[[+-]?\d+\]))/ ],
  [ 'range:named', /^[A-Z\d_.]+/ ]
];

function tokenize (fx) {
  const tokens = [];
  let pos = 0;
  while (pos < fx.length) {
    const s = fx.slice(pos);
    let tokenType = '';
    let tokenValue = '';
    for (let i = 0; i < tokenHandlers.length; i++) {
      const tokenHandler = tokenHandlers[i];
      const m = tokenHandler[1].exec(s);
      if (m) {
        tokenType = tokenHandler[0];
        tokenValue = m[0];
        pos += m[0].length;
        break;
      }
    }
    if (!tokenType) {
      tokenType = 'unknown';
      tokenValue = fx[pos];
      pos++;
    }
    tokens.push({
      type: tokenType,
      value: tokenValue
    });
  }
  return tokens;
}

export default class RelativeFormula {
  constructor (formula, anchorCell) {
    this.fx = formula;
    this.anchorA1 = anchorCell;
    this.anchor = parseA1(anchorCell);
    this.tokens = tokenize(formula);
    this.tokens.forEach(d => {
      if (d.type === 'range:a1') {
        d.data = parseA1(d.value);
      }
    });
  }

  translate (offsetCell) {
    const offs = parseA1(offsetCell);
    const dC = offs[0] - this.anchor[0];
    const dR = offs[1] - this.anchor[1];
    return this.tokens.map(d => {
      if (d.type === 'range:a1') {
        const point = Object.assign([], d.data);
        if (!point.$C && dC) { point[0] += dC; }
        if (!point.$R && dR) { point[1] += dR; }
        return renderA1(point);
      }
      else {
        return d.value;
      }
    }).join('');
  }
}
