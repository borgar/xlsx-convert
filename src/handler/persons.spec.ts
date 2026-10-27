import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerPersons } from './persons.ts';

describe('handlerPersons', () => {
  it('decodes _xHHHH_ escapes in display names', () => {
    const persons = handlerPersons(parseXML(
      '<personList><person displayName="J_x0041_ _x005F_x0041_" id="{1}"/></personList>',
    ));

    expect(persons).toEqual([ { id: '{1}', displayName: 'JA _x0041_' } ]);
  });
});
