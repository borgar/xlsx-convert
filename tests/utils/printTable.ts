export const color = (s: string, n: number) => `\x1B[${n}m${s}\x1B[0m`;

export function printTable (data: (Record<string, string | number | boolean | undefined | null> | null)[]) {
  // eslint-disable-next-line no-control-regex
  const uncolor = (s: string) => s.replace(/\x1B\[(\d+m)/g, '');

  const print = (o: string[], sep = ' │ ') => {
    // eslint-disable-next-line no-console
    console.log(
      color(sep.slice(1), 2) +
      o.join(color(sep, 2)) +
      color(sep.slice(0, -1), 2),
    );
  };

  const cols: Record<string, string> = {};

  // find longest string per-column
  data.forEach(d => {
    for (const k in d) {
      const s = uncolor(String(d[k] ?? '---'));
      if (!cols[k]) {
        cols[k] = k.length > s.length ? k : s;
      }
      else if (s.length > cols[k].length) {
        cols[k] = s;
      }
    }
  });

  // print headers
  print(Object.keys(cols).map(k => k.padStart(cols[k].length)));

  // print separator
  print(Object.keys(cols).map(k => '─'.repeat(cols[k].length)));

  // print table body
  data.forEach((d: any) => {
    print(Object.keys(cols).map(k => {
      const s = String(d[k] ?? '---');
      return ' '.repeat(cols[k].length - uncolor(s).length) + s;
    }));
  });
}
