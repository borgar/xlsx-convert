const attr = require('./utils/attr');

module.exports = (dom, wb) => {
  const tables = {};

  dom.getElementsByTagName('futureMetadata')
    .forEach(fMD => {
      const table = [];
      tables[attr(fMD, 'name')] = table;

      fMD.getElementsByTagName('bk > ext')
        .forEach(ext => {
          const uri = attr(ext, 'uri');
          // XLDAPR
          if (uri === '{bdbb8cdc-fa1e-496e-a857-3c3f30c029c3}') {
            const dAP = ext.getElementsByTagName('dynamicArrayProperties')[0];
            table.push({
              _type: '_dynamicArray',
              fCollapsed: attr(dAP, 'fCollapsed'),
              fDynamic: attr(dAP, 'fDynamic')
            });
          }
          // XLRICHVALUE
          else if (uri === '{3e2802c4-a4d2-4d8b-9148-e3be6c30e623}') {
            const rvb = ext.getElementsByTagName('rvb')[0];
            table.push(wb.richValues[+attr(rvb, 'i', 0)]);
          }
        });
    });

  function parseBk (bk) {
    const rc = bk.getElementsByTagName('rc')[0];
    const t = +attr(rc, 't', 0);
    const v = +attr(rc, 'v', 0);
    // BÞ: not actually sure t refers to tables like this.
    //     it seems to make sense, but will need more data or documentation
    if (t === 1) {
      return tables.XLDAPR[v];
    }
    else if (t === 2) {
      return tables.XLRICHVALUE[v];
    }
    throw new Error(`Unknown table t="${t}" in metadata.xml`);
  }

  // Cell metadata contains information about the cell itself.
  const cells = [];
  dom.querySelectorAll('cellMetadata > bk')
    .forEach(bk => cells.push(parseBk(bk)));

  // Value metadata is information about the value of a particular cell.
  // Value metadata properties can be propagated along with the value as it is referenced in formulas.
  const values = [];
  dom.querySelectorAll('valueMetadata > bk')
    .forEach(bk => values.push(parseBk(bk)));

  return {
    tables: tables,
    values: values,
    cells: cells
  };
};
