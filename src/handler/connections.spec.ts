import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { handlerConnections } from './connections.ts';

describe('handlerConnections', () => {
  it('parses a database connection with its dbPr', () => {
    const xml = [
      '<connections>',
      '<connection id="1" xr16:uid="{UID}" sourceFile="C:\\src.xlsx" keepAlive="1"',
      ' name="MyConn" type="5" refreshedVersion="8" background="1">',
      '<dbPr connection="Provider=ACE" command="Sheet1$" commandType="3"/>',
      '</connection>',
      '</connections>',
    ].join('');
    expect(handlerConnections(parseXML(xml))).toEqual([ {
      id: 1,
      name: 'MyConn',
      type: 5,
      sourceFile: 'C:\\src.xlsx',
      keepAlive: true,
      background: true,
      refreshedVersion: 8,
      uid: '{UID}',
      dbPr: { connection: 'Provider=ACE', command: 'Sheet1$', commandType: 3 },
    } ]);
  });

  it('keeps a connection with no dbPr and skips one without an id', () => {
    const xml = '<connections><connection id="2" name="Bare"/><connection name="NoId"/></connections>';
    expect(handlerConnections(parseXML(xml))).toEqual([ { id: 2, name: 'Bare' } ]);
  });
});
