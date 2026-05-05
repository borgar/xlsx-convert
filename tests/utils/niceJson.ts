const wrapColor = (s: string, n: number) => `\x1B[${n}m${s}\x1B[0m`;

/**
 * Produce a more compact and hopefully more readable JSON serialization.
 *
 * @param item The target item to serialize.
 * @param colorize Inject control characters to colorize the output in a terminal.
 * @param depth Recursive depth parameter that controls indentation.
 * @returns A stringification of the target item.
 */
export function niceJson (item: unknown, colorize: boolean = false, depth = 0) {
  const clr = colorize ? wrapColor : String;
  const op = (s: string) => clr(s, 90);
  const str = (s: string, n: number) => op('"') + clr(JSON.stringify(s).slice(1, -1), n) + op('"');
  let output = '';

  if (Array.isArray(item)) {
    if (!item.length) {
      return output + op('[]');
    }
    const hasNesting = item.some(d => typeof d === 'object');
    const collapse = (!hasNesting || item.length === 1) && JSON.stringify(item).length < 50;
    output += collapse ? op('[ ') : op('[\n');
    {
      const indent = collapse ? '' : '  '.repeat(depth + 1);
      output += item
        .map(d => indent + niceJson(d, colorize, depth + 1))
        .join(collapse ? op(', ') : op(',\n'));
    }
    output += (collapse ? ' ' : '\n' + '  '.repeat(depth)) + op(']');
  }
  else if (item && typeof item === 'object') {
    const values = Object.values(item);
    if (!values.length) {
      return output + op('{}');
    }
    const hasNesting = values.some(d => typeof d === 'object');
    const collapse = !hasNesting && JSON.stringify(item).length < 50;
    output += op('{') + (collapse ? ' ' : '\n');
    {
      const props = [];
      for (const [ key, val ] of Object.entries(item)) {
        props[props.length] = str(key, 0) + op(': ') + niceJson(val, colorize, depth + 1);
      }
      const indent = collapse ? '' : '  '.repeat(depth + 1);
      output += indent + props.join(op(',') + (collapse ? ' ' : '\n' + indent));
    }
    output += collapse ? op(' }') : '\n' + '  '.repeat(depth) + op('}');
  }
  else if (typeof item === 'string') {
    return str(item, 32);
  }
  else if (typeof item === 'number' || typeof item === 'boolean') {
    return clr(JSON.stringify(item), 33);
  }
  else {
    return JSON.stringify(item);
  }

  return output;
}
