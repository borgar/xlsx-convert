import { attr } from './utils/attr.ts';
import { pathBasename } from './utils/path.ts';
import { convertStyles } from './utils/convertStyles.ts';
import { resolveColumnMdw } from './utils/mdw.ts';
import { ConversionContext } from './ConversionContext.ts';
import type { Rel } from './handler/rels.ts';
import { handlerWorkbook } from './handler/workbook.ts';
import { handlerSharedStrings } from './handler/sharedstrings.ts';
import { handlerPersons } from './handler/persons.ts';
import { handlerTheme } from './handler/theme.ts';
import { handlerAppdata } from './handler/appdata.ts';
import { handlerStyles } from './handler/styles.ts';
import { handlerRDStruct } from './handler/rdstuct.ts';
import { handlerRDValue } from './handler/rdvalue.ts';
import { handlerMetaData } from './handler/metadata.ts';
import { handlerComments } from './handler/comments.ts';
import { handlerNotes } from './handler/notes.ts';
import { handlerWorksheet } from './handler/worksheet.ts';
import { handlerExternal } from './handler/external.ts';
import { handlerTable } from './handler/table.ts';
import { handlerPivotCacheDefinition } from './handler/pivotTables/pivotCacheDefinition.ts';
import { handlerPivotCacheRecords } from './handler/pivotTables/pivotCacheRecords.ts';
import { handlerPivotTable } from './handler/pivotTable.ts';
import type { Workbook as JSFWorkbook, PivotTable, PivotCache } from '@jsfkit/types';
import type { ConversionOptions } from './index.ts';
import { InvalidFileError, MissingSheetError } from './errors.ts';
import { handlerDrawing } from './handler/drawing.ts';
import { arrayBufferToDataUri } from './utils/arrayBufferToDataUri.ts';
import { getMimeType } from './utils/getMimeType.ts';
import { isLikelyGSExport } from './utils/isLikelyGSExport.ts';
import { handlerChart } from './handler/chart.ts';
import { hasKeys } from './utils/hasKeys.ts';
import type { ChartSpace } from './handler/charts/types/ChartSpace.ts';
import { XlsxArchive } from './XlsxArchive.ts';
import { getFirstChild } from './utils/getFirstChild.ts';
import { handlerCustomdata } from './handler/customdata.ts';
import {
  MISSING_ASSET_EXT, MISSING_ASSET_PQ, MISSING_ASSET_PY, MISSING_ASSET_VBA, MISSING_CHART,
  MISSING_CHART_CHARTEX, MISSING_CHART_PIVOT, MISSING_VIEW_TABSELECTED,
} from './constants.ts';

let CHARTS_ENABLED = false;
/** @ignore */
export type ExtendedWorkbook = Workbook & { charts?: Record<string, ChartSpace> };
export type Workbook = JSFWorkbook & { unsupported?: string[] };

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  skipMerged: true,
  cellFormulas: false,
  skipStyledEmptyCells: false,
  reportUnsupported: true,
};

/**
 * Convert an XLSX binary into a JSON format.
 *
 * The returned JSF structure contains most of the data from the original file, although some details
 * may be lost in the conversion process.
 *
 * @param buffer Buffer containing the file to convert
 * @param filename Name of the file being converted
 * @param [options] Conversion options
 * @return A JSON spreadsheet formatted object.
 */
export async function convertBinary (
  buffer: Buffer | ArrayBuffer,
  filename: string,
  options?: ConversionOptions,
): Promise<Workbook> {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const xlsx = new XlsxArchive(buffer);

  // manifest
  const baseRels = await xlsx.readRels();
  const wbRel = baseRels.find(d => d.type === 'officeDocument');
  if (!wbRel) {
    throw new InvalidFileError('Input is missing a workbook definition');
  }

  const context = new ConversionContext();
  context.rels = await xlsx.readRels(wbRel.target);
  context.options = options;
  context.filename = pathBasename(filename);
  context.isLikelyGSExport = isLikelyGSExport(xlsx.zip);

  // workbook - read DOM first to get externalReferences order
  const wbDom = await xlsx.readXML(wbRel.target);
  if (!wbDom) {
    throw new InvalidFileError('Input is missing a workbook');
  }

  // external links - use order from <externalReferences> in workbook.xml,
  // not the document order in workbook.xml.rels (which can differ)
  const extRefRIds = wbDom?.getElementsByTagName('externalReference').map(d => attr(d, 'r:id')) ?? [];
  for (const rId of extRefRIds) {
    const rel = context.rels.find(d => d.id === rId);
    if (rel) {
      const extRels = await xlsx.readRels(rel.target);
      const targetRel = extRels.find(d => d.id === 'rId1');
      const target = targetRel?.target;
      if (target) {
        const exDoc = await xlsx.readXML(rel.target);
        if (exDoc) {
          const exlink = handlerExternal(exDoc, target, extRels);
          context.externalLinks.push(exlink);
          if (targetRel.type.endsWith('xlPathMissing')) {
            exlink.pathMissing = true;
          }
        }
      }
      else {
        // TODO: Throw in strict mode?
      }
    }
  }

  // workbook
  const wb: Workbook = handlerWorkbook(wbDom, context);
  context.workbook = wb;
  // copy external links in
  if (context.externalLinks.length) {
    wb.externals = context.externalLinks;
  }

  // strings
  context.sst = await xlsx.readRel(context, 'sharedStrings', handlerSharedStrings, []);

  // persons
  const people = await xlsx.readRel(context, 'person', handlerPersons, []);

  // richData
  context.richStruct = await xlsx.readRel(context, 'rdRichValueStructure', handlerRDStruct);
  context.richValues = await xlsx.readRel(context, 'rdRichValue', handlerRDValue);

  // metadata
  context.metadata = await xlsx.readRel(context, 'sheetMetadata', handlerMetaData);

  // styles — read early so numFmts are available for pivot cache/table parsing
  const styleDefs = await xlsx.readRel(context, 'styles', handlerStyles);

  // pivot caches (workbook-level) — prefer order from <pivotCaches> in workbook.xml
  // over the document order in workbook.xml.rels (which can differ)
  const pivotCacheRIds = wbDom.querySelectorAll('pivotCaches > pivotCache')
    .map(d => attr(d, 'r:id'));
  const pivotCacheRels = pivotCacheRIds.length > 0
    ? pivotCacheRIds.map(rId => context.rels.find(d => d.id === rId)).filter((d): d is Rel => d != null)
    : context.rels.filter(d => d.type === 'pivotCacheDefinition');

  const cacheResults = await Promise.all(pivotCacheRels.map(async cacheRel => {
    const [ cacheDom, cacheDefRels ] = await Promise.all([
      xlsx.readXML(cacheRel.target),
      xlsx.readRels(cacheRel.target),
    ]);
    if (!cacheDom) { return null; }
    const cache = handlerPivotCacheDefinition(cacheDom, styleDefs?.numFmts);
    if (!cache) { return null; }
    // read the cache records via the cache definition's rels
    const recordsRel = cacheDefRels.find(d => d.type === 'pivotCacheRecords');
    if (recordsRel) {
      const recordsDom = await xlsx.readXML(recordsRel.target);
      if (recordsDom) {
        const records = handlerPivotCacheRecords(recordsDom);
        if (records.length > 0) {
          cache.records = records;
        }
      }
    }
    return { cache, target: cacheRel.target };
  }));
  const cachePathToCache = new Map<string, PivotCache>();
  for (const result of cacheResults) {
    if (result) {
      cachePathToCache.set(result.target, result.cache);
    }
  }

  // theme
  context.theme = await xlsx.readRel(context, 'theme', handlerTheme);
  wb.theme = context.theme;

  // convert styles to JSF format (styleDefs was read earlier for pivot numFmtId resolution)
  const { styles, namedStyles } = convertStyles(styleDefs);
  wb.styles = styles;
  if (Object.keys(namedStyles).length > 0) {
    wb.namedStyles = namedStyles;
  }

  // The Normal font (cellStyleXfs[0], defaulting to the theme minor typeface) sets the MDW that every
  // column width is recorded against; resolve it once for the worksheet handlers.
  const normalFont = styleDefs?.cellStyleXfs[0]?.font ?? styleDefs?.font[0];
  const fontScheme = context.theme?.fontScheme;
  const normalFamily = (normalFont?.name ||
    (normalFont?.scheme === 'major'
      ? fontScheme?.major.latin.typeface
      : fontScheme?.minor.latin.typeface) ||
    'Aptos Narrow');
  context.normalMdw = resolveColumnMdw(normalFamily, normalFont?.size ?? 11, context.options);

  const pivotTables: PivotTable[] = [];

  // worksheets — processed sequentially to avoid shared-state races
  for (const [ index, sheetLink ] of context.sheetLinks.entries()) {
    const sheetRel = context.rels.find(d => d.id === sheetLink.rId);
    if (sheetRel) {
      const sheetName = sheetLink.name || `Sheet${sheetLink.index}`;
      const sheetRels = await xlsx.readRels(sheetRel.target);

      // tables are accessed when external refs are normalized, so they have
      // to be read before that happens
      const tableRels = sheetRels.filter(rel => rel.type === 'table');
      for (const tableRel of tableRels) {
        const tableDom = await xlsx.readXML(tableRel.target);
        const table = handlerTable(tableDom, context);
        if (table) {
          table.sheet = sheetName;
          wb.tables!.push(table);
        }
      }

      const pivotTableRels = sheetRels.filter(rel => rel.type === 'pivotTable');
      await Promise.all(pivotTableRels.map(async ptRel => {
        const [ ptDom, ptRels ] = await Promise.all([
          xlsx.readXML(ptRel.target),
          xlsx.readRels(ptRel.target),
        ]);
        if (ptDom) {
          const pt = handlerPivotTable(ptDom, styleDefs?.numFmts);
          if (pt) {
            pt.sheet = sheetName;
            // resolve cache from pivot table's rels -> pivotCacheDefinition
            const ptCacheRel = ptRels.find(d => d.type === 'pivotCacheDefinition');
            if (ptCacheRel) {
              const cache = cachePathToCache.get(ptCacheRel.target);
              if (cache) { pt.cache = cache; }
            }
            // Only include pivot tables whose cache was successfully parsed
            if (pt.cache != null) {
              pivotTables.push(pt as PivotTable);
            }
            else {
              context.warn(`Pivot table "${pt.name}" on sheet "${sheetName}" dropped: cache definition not found (rel target: ${ptCacheRel?.target ?? 'none'})`);
            }
          }
        }
      }));

      // convert the sheet
      const sheetFile = await xlsx.readXML(sheetRel.target);
      if (!sheetFile) {
        throw new MissingSheetError('Missing sheet file: ' + sheetRel.target);
      }

      context.images = [];
      const sh = handlerWorksheet(sheetFile, context, sheetRels, sheetName);

      // Notes (old school, 90s, sticky notes).
      const notes = await xlsx.readRel(context, 'comments', handlerNotes, [], sheetRels);
      if (notes.length > 0) {
        sh.notes = notes;
      }

      // Threaded comments (since Excel 2019).
      const comments = await xlsx.readRel(context, 'threadedComment', handlerComments, [], sheetRels);
      if (comments.length > 0) {
        sh.comments = comments;
      }

      wb.sheets[index] = sh;

      if (context.images.length) {
        // process drawings (these may contain either charts or images)
        for (const img of context.images) {
          if (img.type === 'drawing') {
            const drawingDom = await xlsx.readXML(img.rel.target);
            context.drawingRels = await xlsx.readRels(img.rel.target);
            sh.drawings = handlerDrawing(drawingDom, context);
          }
        }
        // process charts
        if (CHARTS_ENABLED) {
          const charts: Record<string, ChartSpace> = {};
          for (const img of context.charts) {
            if (img.type === 'chart' || img.type === 'chartEx') {
              // const chartRels = await archive.readRels(img.rel.target);
              const chartDom = await xlsx.readXML(img.rel.target);
              if (chartDom) {
                if (getFirstChild(chartDom.root, 'pivotSource')) {
                  context.unsupported.add(MISSING_CHART_PIVOT);
                }
                // read rel type: chartColorStyle
                // read rel type: chartStyle
                const chart = handlerChart(chartDom, context);
                charts[img.rel.target] = chart;
              }
            }
          }
          if (hasKeys(charts)) {
            (wb as ExtendedWorkbook).charts = charts;
          }
        }
        else {
          for (const img of context.charts) {
            if (img.type === 'chart') {
              context.unsupported.add(MISSING_CHART);
            }
            else if (img.type === 'chartEx') {
              context.unsupported.add(MISSING_CHART_CHARTEX);
            }
          }
        }

        // process images
        let imageCount = 0;
        const images: Record<string, string> = {};
        for (const img of context.images) {
          if (img.type === 'picture') {
            // sheet.background = ...

            // only do this once per image file
            if (!images[img.rel.target]) {
              // img.rel.type should be "image"
              const fileData = await xlsx.readBinary(img.rel.target);
              if (fileData) {
                let imageValue: string | null = null;
                if (options.imageCallback) {
                  const ret = await options.imageCallback(fileData, img.rel.target);
                  if (typeof ret === 'string') { imageValue = ret; }
                }
                if (typeof imageValue !== 'string') {
                  const mime = getMimeType(img.rel.target);
                  imageValue = await arrayBufferToDataUri(fileData, mime);
                }
                images[img.rel.target] = imageValue;
                imageCount++;
              }
            }
          }
        }
        if (imageCount) {
          wb.images ??= {};
          Object.assign(wb.images, images);
        }
      }
    }
    else {
      // TODO: add strict mode that: throw new Error('No rel found for sheet ' + sheetLink.rId);
    }
  }

  // Sort pivot tables by sheet position, then by name within each sheet.
  // Sheet order is already guaranteed by sequential processing, but rels
  // order within a sheet is not deterministic by name.
  if (pivotTables.length > 1) {
    const sheetOrder = new Map(context.sheetLinks.map((sl, i) => [ sl.name || `Sheet${sl.index}`, i ]));
    pivotTables.sort((a, b) => {
      const si = (sheetOrder.get(a.sheet) ?? Infinity) - (sheetOrder.get(b.sheet) ?? Infinity);
      return si !== 0 ? si : a.name.localeCompare(b.name);
    });
  }

  if (pivotTables.length > 0) {
    wb.pivotTables = pivotTables;
  }

  // Store people from the workbook.
  if (people.length > 0) {
    wb.people = people;
  }

  if (!options.cellFormulas) {
    wb.formulas = [ ...context._formulasR1C1.list() ];
  }

  // appdata/meta
  const appMeta = handlerAppdata(await xlsx.readXML('docProps/app.xml'), context);
  if (appMeta) {
    wb.meta = appMeta;
  }
  handlerCustomdata(await xlsx.readXML('docProps/custom.xml'), context);

  // custom XML -- JS or PQ most likely
  const fileList = xlsx.zip.files.filter(d => /^customXml\//i.test(d));
  if (fileList.length) {
    // load content types
    const ctypes = await xlsx.readXML('[Content_Types].xml');
    if (ctypes?.root) {
      for (const child of ctypes.root.children) {
        const ct = child.getAttribute('ContentType');
        if (ct === 'application/vnd.openxmlformats-officedocument.customXmlProperties+xml') {
          const part = child.getAttribute('PartName');
          if (part) {
            const itemProps = await xlsx.readXML(part.replace(/^\//, ''));
            if (itemProps) {
              const schemaRef = itemProps.querySelector('schemaRef');
              const uri = schemaRef ? attr(schemaRef, 'uri') ?? attr(schemaRef, 'ds:uri') : null;
              if (uri === 'http://schemas.microsoft.com/DataMashup') {
                context.unsupported.add(MISSING_ASSET_PQ);
              }
              else {
                // Best guess is that this is an Office Script, but we'd have to look in the accompanying
                // item file, which is a bunch of steps for something we don't support.
                context.unsupported.add(MISSING_ASSET_EXT);
              }
            }
          }
        }
      }
    }
  }

  // list any unsupported things found in this workbook
  if (options.reportUnsupported) {
    if (context.rels.find(d => d.type === 'Python')) {
      context.unsupported.add(MISSING_ASSET_PY);
    }
    if (context.rels.find(d => d.type === 'vbaProject')) {
      context.unsupported.add(MISSING_ASSET_VBA);
    }
    // this really only matters when there are 2+ tabs selected
    if (context.selectedTabs.size > 1) {
      context.unsupported.add(MISSING_VIEW_TABSELECTED);
    }
    const taglist: string[] = Array.from(context.unsupported).sort();
    if (taglist.length) { wb.unsupported = taglist; }
  }

  CHARTS_ENABLED = false;
  return wb;
}

/**
 * An experimental version of convertBinary that includes charts the workbook payload.
 *
 * @param buffer Buffer containing the file to convert
 * @param filename Name of the file being converted
 * @param [options] Conversion options
 * @return A JSON spreadsheet formatted object.
 * @ignore
 */
export async function convertBinaryFuture (
  buffer: Buffer | ArrayBuffer,
  filename: string,
  options?: ConversionOptions,
): Promise<ExtendedWorkbook> {
  CHARTS_ENABLED = true;
  return convertBinary(buffer, filename, options);
}
