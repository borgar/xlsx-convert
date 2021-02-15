const attr = require('./utils/attr');

module.exports = dom => {
  const sst = dom.querySelectorAll('sst')[0];

  const stringTable = sst.querySelectorAll('si').map(d => {
    return d.querySelectorAll('t').map(d => d.textContent).join('');
  });

  const count = +attr(sst, 'uniqueCount');
  if (count !== stringTable.length) {
    console.warn('String table did not contain correct amount of entries.');
    console.warn(`I got ${stringTable.length}, but expected ${count}`);
  }

  return stringTable;
};
