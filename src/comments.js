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

  // FIXME: while we do discard the threads, we should still order the comments

  return comments;
};
