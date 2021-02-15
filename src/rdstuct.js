const attr = require('./utils/attr');

module.exports = dom => {
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
};
