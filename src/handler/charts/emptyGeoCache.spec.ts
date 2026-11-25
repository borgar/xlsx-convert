import { describe, expect, it } from 'vitest';

import { emptyGeoCache } from './emptyGeoCache.ts';

const PROVIDER = 'provider="{E9337A44-BEBE-4D9F-B70C-5C5E7DAFC167}"';

describe('emptyGeoCache', () => {
  it('empties the binary in a geoCache', () => {
    expect(emptyGeoCache(
      `<cx:geography cultureLanguage="en-US"><cx:geoCache ${PROVIDER}>` +
      '<cx:binary>7HzZltzGteWv\naOm5QcU8eNn3A==</cx:binary>' +
      '</cx:geoCache></cx:geography>',
    )).toBe(
      `<cx:geography cultureLanguage="en-US"><cx:geoCache ${PROVIDER}>` +
      '<cx:binary></cx:binary>' +
      '</cx:geoCache></cx:geography>',
    );
  });

  it('empties every geoCache', () => {
    const cache = `<cx:geoCache ${PROVIDER}><cx:binary>abc</cx:binary></cx:geoCache>`;
    const empty = `<cx:geoCache ${PROVIDER}><cx:binary></cx:binary></cx:geoCache>`;
    expect(emptyGeoCache(`<a>${cache}</a><b>${cache}</b>`)).toBe(`<a>${empty}</a><b>${empty}</b>`);
  });

  it('works with any namespace prefix, or none', () => {
    expect(emptyGeoCache('<x:geoCache><x:binary>abc</x:binary></x:geoCache>'))
      .toBe('<x:geoCache><x:binary></x:binary></x:geoCache>');
    expect(emptyGeoCache('<geoCache><binary>abc</binary></geoCache>'))
      .toBe('<geoCache><binary></binary></geoCache>');
  });

  it('keeps whitespace around the binary', () => {
    const xml = '<cx:geoCache>\n  <cx:binary>abc</cx:binary>\n</cx:geoCache>';
    expect(emptyGeoCache(xml)).toBe('<cx:geoCache>\n  <cx:binary></cx:binary>\n</cx:geoCache>');
  });

  it('leaves an uncompressed (clear) geoCache as it is', () => {
    const xml = '<cx:geoCache><cx:clear><cx:geoLocationQueryResults/></cx:clear></cx:geoCache>';
    expect(emptyGeoCache(xml)).toBe(xml);
  });

  it('leaves binary elements outside a geoCache as they are', () => {
    const xml = '<cx:other><cx:binary>abc</cx:binary></cx:other>';
    expect(emptyGeoCache(xml)).toBe(xml);
  });

  it('leaves a part without a geoCache as it is', () => {
    const xml = '<cx:chartSpace><cx:chart><cx:f>_xlchart.v5.1</cx:f></cx:chart></cx:chartSpace>';
    expect(emptyGeoCache(xml)).toBe(xml);
  });
});
