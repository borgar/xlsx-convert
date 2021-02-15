const attr = require('./utils/attr');

module.exports = dom => {
  const persons = {};

  dom.querySelectorAll('personlist > person')
    .forEach(person => {
      persons[attr(person, 'id')] = attr(person, 'displayName');
    });

  return persons;
};
