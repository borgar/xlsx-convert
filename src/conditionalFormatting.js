import attr, { numAttr, boolAttr } from './utils/attr.js';
import color from './color.js';

function readCFVO (node, readGte = false) {
  const type = attr(node, 'type', null);
  const cfvo = { type: type };
  if (type === 'formula') {
    cfvo.v = attr(node, 'val', '');
  }
  else if (type === 'percent' || type === 'num' || type === 'percentile') {
    cfvo.v = +attr(node, 'val', 0);
  }
  else if (type === 'min' || type === 'max') {
    // noop
  }
  else {
    console.error('Unknown cfvo type: ' + type);
  }
  if (readGte) {
    cfvo.gte = !!+attr(node, 'gte', 1);
  }
  return cfvo;
}

function noOp () {
  return {};
}

const handlers = {
  cellIs: cfRule => {
    return { operator: attr(cfRule, 'operator', null) };
  },
  containsText: cfRule => {
    return { text: attr(cfRule, 'text', null) };
  },
  notContainsText: cfRule => {
    return { text: attr(cfRule, 'text', null) };
  },
  beginsWith: cfRule => {
    return { text: attr(cfRule, 'text', null) };
  },
  endsWith: cfRule => {
    return { text: attr(cfRule, 'text', null) };
  },
  timePeriod: cfRule => {
    return { timePeriod: attr(cfRule, 'timePeriod', null) };
  },
  containsBlanks: noOp,
  notContainsBlanks: noOp,
  containsErrors: noOp,
  notContainsErrors: noOp,
  top10: cfRule => {
    const data = {};
    data.rank = numAttr(cfRule, 'rank');
    data.percent = !!+attr(cfRule, 'percent', null);
    data.bottom = !!+attr(cfRule, 'bottom', null);
    return data;
  },
  aboveAverage: cfRule => {
    // defaults: { aboveAverage: 1, equalAverage: 0, stdDev: null }
    // gt:  {}
    // gte: { equalAverage: 1 }
    // lt:  { aboveAverage: 0, }
    // lte: { aboveAverage: 0, equalAverage: 1 }
    const data = {};
    data.aboveAverage = +attr(cfRule, 'aboveAverage', 1);
    data.equalAverage = +attr(cfRule, 'equalAverage', 0);
    data.stdDev = +attr(cfRule, 'stdDev', 0);
    return data;
  },
  duplicateValues: noOp,
  uniqueValues: noOp,
  expression: noOp,
  iconSet: cfRule => {
    // FIXME: this is an incomplete list:
    //   3Arrows, 3ArrowsGray, 3Flags, 3TrafficLights1, 3TrafficLights2, 3Signs,
    //   3Symbols, 3Symbols2, 4Arrows, 4ArrowsGray, 4RedToBlack, 4Rating, 4TrafficLights
    //   5Arrows, 5ArrowsGray, 5Rating, 5Quarters
    const data = {
      iconSet: '3TrafficLights1',
      icons: []
    };
    cfRule.querySelectorAll('> iconset').forEach(iconSet => {
      data.iconSet = attr(iconSet, 'iconSet', '3TrafficLights1');
      iconSet.querySelectorAll('> cfvo').forEach(cfvo => {
        data.icons.push(readCFVO(cfvo, true));
      });
    });
    return data;
  },
  colorScale: (cfRule, wb) => {
    const data = {
      colorScale: []
    };
    cfRule.querySelectorAll('> colorscale').forEach(scale => {
      scale.querySelectorAll('> cfvo').forEach((cfvo, i) => {
        data.colorScale[i] = readCFVO(cfvo);
      });
      scale.querySelectorAll('> color').forEach((colorNode, i) => {
        data.colorScale[i].color = String(color(colorNode, wb.theme));
      });
    });
    return data;
  },
  dataBar: cfRule => {
    const dataBar = cfRule.querySelectorAll('> DATABAR')[0];
    const data = {
      minLength: numAttr(dataBar, 'minLength'),
      maxLength: numAttr(dataBar, 'maxLength'),
      gradient: numAttr(dataBar, 'gradient'), // FIXME: attr seems wrong?
      showValue: boolAttr(dataBar, 'showValue'),
      border: boolAttr(dataBar, 'border'),
      direction: attr(dataBar, 'direction', null), // leftToRight | rightToLeft | [null]
      axisPosition: attr(dataBar, 'axisPosition', null), // middle
      negativeBarBorderColorSameAsPositive: boolAttr(dataBar, 'negativeBarBorderColorSameAsPositive'),
    };

    dataBar.children.forEach(child => {
      if (child.nodeName === 'AXISCOLOR') {
        data.axisColor = String(color(child));
      }
      else if (child.nodeName === 'COLOR') {
        data.fillColor = String(color(child));
      }
      else if (child.nodeName === 'NEGATIVEFILLCOLOR') {
        data.negativeFillColor = String(color(child));
      }
      else if (child.nodeName === 'BORDERCOLOR') {
        data.borderColor = String(color(child));
      }
      else if (child.nodeName === 'NEGATIVEBORDERCOLOR') {
        data.negativeBorderColor = String(color(child));
      }
      else if (child.nodeName === 'CFVO') {
        data.autoMax = attr(child, 'autoMax', null);
        data.autoMin = attr(child, 'autoMin', null);
      }
      else {
        console.error('Unknown dataBar property: ' + child.nodeName);
      }
    });
    return data;
  }
};

const warnOnce = {};

export default function (dom, wb) {
  const rules = [];
  dom.getElementsByTagName('conditionalFormatting')
    .forEach(condFmt => {
      // FIXME: likely pivot needs to be read the same way sqref is for extLst formats
      const pivot = +attr(condFmt, 'pivot', 0);
      let sqref = attr(condFmt, 'sqref', null);
      if (!sqref) {
        const s = condFmt.querySelectorAll('> sqref')[0];
        if (s) {
          sqref = s.textContent;
        }
      }

      condFmt.querySelectorAll('> cfRule').forEach(cfRule => {
        const priority = +attr(cfRule, 'priority', 0);
        const type = attr(cfRule, 'type', null);
        const dxfId = attr(cfRule, 'dxfId', null);

        const rule = {
          ref: sqref,
          priority: priority,
          type: type,
          si: dxfId == null ? null : +dxfId
        };
        if (pivot) {
          rule.pivot = true;
        }

        if (handlers[type]) {
          // formula
          const formula = cfRule.getElementsByTagName('formula');
          if (formula.length === 1) {
            rule.f = formula[0].textContent;
          }
          else if (formula.length > 1) {
            // used only by type:cellIs + op:between
            rule.fMin = formula[0].textContent;
            rule.fMax = formula[1].textContent;
            if (formula.length > 2) {
              // TODO: complain about it?
            }
          }
          Object.assign(rule, handlers[type](cfRule, wb));

          // remove nulls
          for (const key in rule) {
            if (rule[key] == null) {
              delete rule[key];
            }
          }

          if (type === 'cellIs') {
            console.log(type, rule);
          }


          rules.push(rule);
        }
        else if (!warnOnce[type]) {
          console.error('Unknown custom formatting rule type: ' + type);
          warnOnce[type] = true;
        }
      });
    });

  return rules;
}
