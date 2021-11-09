import attr from './utils/attr.js';

export default function (dom) {
  const persons = {};

  dom.querySelectorAll('personlist > person')
    .forEach(person => {
      persons[attr(person, 'id')] = attr(person, 'displayName');
    });

  return persons;
}
