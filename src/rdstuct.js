import attr from './utils/attr.js';

export default function (dom) {
  const structures = [];

  dom.getElementsByTagName('rvStructures > s')
    .forEach(s => {
      const keys = [];
      const type = attr(s, 't');
      s.getElementsByTagName('k')
        .forEach(k => {
          keys.push({
            name: attr(k, 'n'),
            type: attr(k, 't')
          });
        });
      structures.push({
        type: type,
        keys: keys
      });
    });

  return structures;
}
