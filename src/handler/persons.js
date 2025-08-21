import { attr } from '../utils/attr.js';

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @returns {Record<string, string>}
 */
export function handlerPersons (dom) {
  /** @type {Record<string, string>} */
  const persons = {};

  dom.querySelectorAll('personlist > person')
    .forEach(person => {
      persons[attr(person, 'id')] = attr(person, 'displayName');
    });

  return persons;
}
