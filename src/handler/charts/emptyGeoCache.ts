/**
 * Remove the cached map data from a ChartEx part's XML text. Excel rebuilds an empty geocache when
 * it opens the file, and the cache is often most of the part, sometimes megabytes of it.
 *
 * Only the content of each `binary` element inside a `geoCache` is removed: the rest of the part
 * stays as it is, character for character.
 *
 * @param xml The part's XML text
 * @return The XML text with empty geocaches
 */
export function emptyGeoCache (xml: string): string {
  return xml.replace(
    /(<(\w+:)?geoCache\b[^>]*>)([\s\S]*?)(<\/\2geoCache>)/g,
    (_, open: string, prefix: string | undefined, content: string, close: string) => {
      const p = prefix ?? '';
      const binary = new RegExp(`(<${p}binary\\b[^>/]*>)[\\s\\S]*?(</${p}binary>)`, 'g');
      return open + content.replace(binary, '$1$2') + close;
    },
  );
}
