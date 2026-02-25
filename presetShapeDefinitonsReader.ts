import { Document, Element, parseXML } from '@borgar/simple-xml';
import { readFile, writeFile } from 'node:fs/promises';
import { readShapeProperties } from './src/handler/drawings/readShapeProperties.ts';
import { ConversionContext } from './src/ConversionContext.ts';

function convertPresets (doc: Document) {
  const presetShapes = {};
  const context = new ConversionContext();
  doc.root.children.forEach(child => {
    // if (child.tagName !== 'actionButtonMovie') return;
    const dummy = new Element('dummy');
    const custGeom = new Element('custGeom');
    dummy.appendChild(custGeom);
    custGeom.appendChild(child);
    const props = readShapeProperties(dummy, context);
    presetShapes[child.tagName] = props;
  });
  // console.log(makeNiceJson(presetShapes));
  return presetShapes;
}

function makeNiceJson (ent) {
  let keyIdx = 1;
  const _tempStore = new Map();
  const save = str => {
    const key = '~~xlsx-convert~~' + (keyIdx++);
    _tempStore.set(key, str);
    return key;
  };
  const formatJSON = s => JSON.stringify(s, null, 2).replace(/\n */g, ' ');
  const MAXLEN = 70;
  function replacer (key, value) {
    const subJSON = value ? formatJSON(value) : JSON.stringify(value);
    const subLen = subJSON.length;
    if ((typeof value === 'object' && value) || Array.isArray(value)) {
      if (subLen < MAXLEN) {
        return save(subJSON);
      }
    }
    return value;
  }
  return JSON
    .stringify(ent, replacer, 2)
    .replace(/"(~~xlsx-convert~~\d+)"/g, (_, key) => _tempStore.get(key))
    .replace(/"([a-z_][a-z0-9_]*)":/gi, '$1:')
    .replace(/"([^']*?)"/g, (a, b) => {
      return `'${b}'`;
    });
}

const src = await readFile('./presetShapeDefinitons.xml', 'utf-8');
const presets = convertPresets(parseXML(src));
await writeFile(
  'presetShapeDefinitons.json5',
  makeNiceJson(presets),
  'utf8',
);
