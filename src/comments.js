const attr = require('./utils/attr');

module.exports = (dom, wb) => {
  const persons = wb.persons || {};
  const comments = {};

  dom.getElementsByTagName('threadedComment')
    .forEach(d => {
      const ref = attr(d, 'ref');
      if (!comments[ref]) {
        comments[ref] = [];
      }
      const personId = attr(d, 'personId');
      // wb.persons
      comments[ref].push({
        // author
        a: persons[personId] || '',
        d: new Date(Date.parse(attr(d, 'dT'))).toISOString(),
        // text
        t: d.getElementsByTagName('text')[0].textContent
      });
    });

  // FIXME: while threads are discarded, comments should still be ordered

  return comments;
};
