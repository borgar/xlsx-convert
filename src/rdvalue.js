import attr from './utils/attr.js';

export default function (dom, wb) {
  const values = [];
  const structures = wb.richStuct || [];

  dom.querySelectorAll('rvData > rv')
    .forEach(rv => {
      const nth = +attr(rv, 's', 0);
      const s = structures[nth];
      const val = { _type: s.type };

      rv.getElementsByTagName('v')
        .forEach((k, i) => {
          const def = s.keys[i];
          let v = k.textContent;
          // FIXME: what other types exist? (a spec on it does not)
          if (def.type === 'i') {
            v = Math.floor(+v);
          }
          val[def.name] = v;
        });

      values.push(val);
    });

  return values;
}
