import { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.js';

export function handlerPersons (dom: Document): Record<string, string> {
  const persons: Record<string, string> = {};

  dom.querySelectorAll('personlist > person')
    .forEach(person => {
      persons[attr(person, 'id')] = attr(person, 'displayName');
    });

  return persons;
}
