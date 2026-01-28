import type { Document } from '@borgar/simple-xml';
import type { Person } from '@jsfkit/types';
import { attr } from '../utils/attr.ts';

export function handlerPersons (dom: Document): Person[] {
  const persons: Person[] = [];

  dom.querySelectorAll('personList > person')
    .forEach(person => {
      const id = attr(person, 'id');
      const displayName = attr(person, 'displayName');

      if (id && displayName) {
        const p: Person = { id, displayName };

        const userId = attr(person, 'userId');
        if (userId) {
          p.userId = userId;
        }

        const providerId = attr(person, 'providerId');
        if (providerId) {
          p.providerId = providerId;
        }

        persons.push(p);
      }
    });

  return persons;
}
