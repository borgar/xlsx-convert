import { parseXML } from '@borgar/simple-xml';
import { describe, expect, it } from 'vitest';

import { ConversionContext } from '../../ConversionContext.ts';
import { handlerConditionalFormatting } from './handlerConditionalFormatting.ts';

const X14 = 'xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"';
const XM = 'xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"';

function parse (body: string) {
  const dom = parseXML(
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData/>' +
      body +
      '</worksheet>',
  );
  const ctx = new ConversionContext();
  ctx.workbook = { name: '', sheets: [] };
  return { rules: handlerConditionalFormatting(dom, ctx), ctx };
}

describe('handlerConditionalFormatting', () => {
  it('maps top10 and aboveAverage to rank and average rules', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A9 C1:C9">' +
        '<cfRule type="top10" dxfId="1" priority="2" bottom="1" percent="1" rank="5"/>' +
        '<cfRule type="aboveAverage" dxfId="0" priority="1" aboveAverage="0" equalAverage="1" stopIfTrue="1"/>' +
        '</conditionalFormatting>',
    );
    expect(rules).toEqual([
      {
        type: 'average',
        ref: [ 'A1:A9', 'C1:C9' ],
        priority: 1,
        direction: 'below',
        inclusive: true,
        dxf: 0,
        stopIfTrue: true,
      },
      {
        type: 'rank',
        ref: [ 'A1:A9', 'C1:C9' ],
        priority: 2,
        count: 5,
        unit: 'percent',
        direction: 'bottom',
        dxf: 1,
      },
    ]);
  });

  it('reads a literal text match from the text attribute', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="containsText" dxfId="0" priority="1" operator="containsText" text="ex">' +
        '<formula>NOT(ISERROR(SEARCH("ex",A1)))</formula>' +
        '</cfRule>' +
        '</conditionalFormatting>',
    );
    expect(rules[0]).toEqual({
      type: 'text',
      ref: [ 'A1' ],
      priority: 1,
      operator: 'contains',
      match: 'ex',
      dxf: 0,
    });
  });

  it('reads a formula text match from the second x14 formula', () => {
    const { rules } = parse(
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
        '<x14:cfRule type="endsWith" priority="1" operator="endsWith" id="{ID-4}">' +
        '<xm:f>RIGHT(A1,LEN($B$1))=$B$1</xm:f>' +
        '<xm:f>$B$1</xm:f>' +
        '</x14:cfRule>' +
        '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
        '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules[0]).toEqual({
      type: 'text',
      ref: [ 'A1' ],
      priority: 1,
      operator: 'endsWith',
      match: '$B$1',
      matchIsFormula: true,
    });
  });

  it('merges an x14 data bar extension into its OOXML rule', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="dataBar" priority="1">' +
        '<dataBar><cfvo type="min"/><cfvo type="max"/><color rgb="FF638EC6"/></dataBar>' +
        `<extLst><ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}" ${X14}><x14:id>{ID-1}</x14:id></ext></extLst>` +
        '</cfRule>' +
        '</conditionalFormatting>' +
        `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
        '<x14:cfRule type="dataBar" id="{ID-1}">' +
        '<x14:dataBar minLength="0" maxLength="100" gradient="0" axisPosition="middle">' +
        '<x14:cfvo type="autoMin"/><x14:cfvo type="formula"><xm:f>$B$1</xm:f></x14:cfvo>' +
        '<x14:negativeFillColor rgb="FFFF0000"/>' +
        '</x14:dataBar>' +
        '</x14:cfRule>' +
        '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
        '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({
      type: 'dataBar',
      ref: [ 'A1:A5' ],
      priority: 1,
      dataBar: {
        min: { type: 'autoMin' },
        max: { type: 'formula', value: '$B$1' },
        minLength: 0,
        maxLength: 100,
        fillColor: { type: 'srgb', value: '638EC6' },
        negativeFillColor: { type: 'srgb', value: 'FF0000' },
        gradient: false,
        axisPosition: 'middle',
      },
    });
  });

  it('reads standalone x14 rules and stores their inline dxf on the workbook', () => {
    const { rules, ctx } = parse(
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM} pivot="1">` +
        '<x14:cfRule type="cellIs" priority="1" operator="between" id="{ID-2}">' +
        '<xm:f>Other!$A$1</xm:f><xm:f>Other!$A$2</xm:f>' +
        '<x14:dxf><font><b/></font><fill><patternFill><bgColor rgb="FFFFFF00"/></patternFill></fill></x14:dxf>' +
        '</x14:cfRule>' +
        '<xm:sqref>B2:B9</xm:sqref>' +
        '</x14:conditionalFormatting>' +
        '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toEqual([
      {
        type: 'compare',
        ref: [ 'B2:B9' ],
        priority: 1,
        pivot: true,
        operator: 'between',
        formulas: [ 'Other!$A$1', 'Other!$A$2' ],
        dxf: 0,
      },
    ]);
    expect(ctx.workbook!.diffStyles).toEqual([
      { bold: true, fillColor: { type: 'srgb', value: 'FFFF00' } },
    ]);
  });

  it('maps negated rule types to a negate flag', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="containsBlanks" dxfId="0" priority="1"/>' +
        '<cfRule type="notContainsBlanks" dxfId="0" priority="2"/>' +
        '<cfRule type="notContainsErrors" dxfId="0" priority="3"/>' +
        '<cfRule type="uniqueValues" dxfId="0" priority="4"/>' +
        '</conditionalFormatting>',
    );
    expect(rules.map(r => [ r.type, 'negate' in r ? r.negate : undefined ])).toEqual([
      [ 'blank', undefined ],
      [ 'blank', true ],
      [ 'error', true ],
      [ 'duplicate', true ],
    ]);
  });

  it('reads data bar colours only when their flags say they are in use', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="dataBar" priority="1">' +
        '<dataBar><cfvo type="min"/><cfvo type="max"/><color rgb="FF638EC6"/></dataBar>' +
        `<extLst><ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}" ${X14}><x14:id>{ID-3}</x14:id></ext></extLst>` +
        '</cfRule>' +
        '</conditionalFormatting>' +
        `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
        '<x14:cfRule type="dataBar" id="{ID-3}">' +
        '<x14:dataBar border="0" negativeBarColorSameAsPositive="1">' +
        '<x14:cfvo type="autoMin"/><x14:cfvo type="autoMax"/>' +
        '<x14:borderColor rgb="FF111111"/>' +
        '<x14:negativeFillColor rgb="FF222222"/>' +
        '<x14:negativeBorderColor rgb="FF333333"/>' +
        '</x14:dataBar>' +
        '</x14:cfRule>' +
        '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
        '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules[0]).toEqual({
      type: 'dataBar',
      ref: [ 'A1:A5' ],
      priority: 1,
      dataBar: {
        min: { type: 'autoMin' },
        max: { type: 'autoMax' },
        fillColor: { type: 'srgb', value: '638EC6' },
      },
    });
  });

  it('replaces an OOXML icon set with its x14 extension', () => {
    const cfvo3 = '<cfvo type="percent" val="0"/><cfvo type="percent" val="33"/><cfvo type="percent" val="67"/>';
    const xcfvo3 =
      '<x14:cfvo type="percent"><xm:f>0</xm:f></x14:cfvo>' +
      '<x14:cfvo type="percent"><xm:f>33</xm:f></x14:cfvo>' +
      '<x14:cfvo type="percent" gte="0"><xm:f>67</xm:f></x14:cfvo>';
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="iconSet" priority="1">' +
          `<iconSet iconSet="3Arrows">${cfvo3}</iconSet>` +
          `<extLst><ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}" ${X14}><x14:id>{ID-5}</x14:id></ext></extLst>` +
        '</cfRule>' +
        '<cfRule type="iconSet" priority="2">' +
          `<iconSet>${cfvo3}</iconSet>` +
          `<extLst><ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}" ${X14}><x14:id>{ID-6}</x14:id></ext></extLst>` +
        '</cfRule>' +
      '</conditionalFormatting>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="iconSet" priority="1" id="{ID-5}">' +
            `<x14:iconSet iconSet="3Triangles" reverse="1" showValue="0" custom="1">${xcfvo3}` +
              '<x14:cfIcon iconSet="3Arrows" iconId="0"/>' +
              '<x14:cfIcon iconSet="NoIcons" iconId="0"/>' +
              '<x14:cfIcon iconSet="3Stars" iconId="2"/>' +
            '</x14:iconSet>' +
          '</x14:cfRule>' +
          '<x14:cfRule type="iconSet" priority="2" id="{ID-6}">' +
            // a partial list of custom icons has no JSF form and is dropped
            `<x14:iconSet iconSet="5Boxes" custom="1">${xcfvo3}` +
              '<x14:cfIcon iconSet="3Arrows" iconId="0"/>' +
            '</x14:iconSet>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toEqual([
      {
        type: 'iconSet',
        ref: [ 'A1:A5' ],
        priority: 1,
        iconSet: {
          thresholds: [
            { type: 'percent', value: 0 },
            { type: 'percent', value: 33 },
            { type: 'percent', value: 67, inclusive: false },
          ],
          name: '3Triangles',
          showValue: false,
          reverse: true,
          customIcons: [
            { iconSet: '3Arrows', index: 0 },
            { iconSet: 'NoIcons', index: 0 },
            { iconSet: '3Stars', index: 2 },
          ],
        },
      },
      {
        type: 'iconSet',
        ref: [ 'A1:A5' ],
        priority: 2,
        iconSet: {
          thresholds: [
            { type: 'percent', value: 0 },
            { type: 'percent', value: 33 },
            { type: 'percent', value: 67, inclusive: false },
          ],
          name: '5Boxes',
        },
      },
    ]);
  });

  it('types thresholds by their xlsx type and value', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="colorScale" priority="1"><colorScale>' +
          '<cfvo type="min"/>' +
          '<cfvo type="num" val="5"/>' +
          '<cfvo type="percentile" val="90"/>' +
          '<cfvo type="formula" val="$B$2*2"/>' +
          '<cfvo type="bogus" val="1"/>' +
          '<cfvo type="max"/>' +
          '<color rgb="FF000001"/><color rgb="FF000002"/><color rgb="FF000003"/>' +
          '<color rgb="FF000004"/><color rgb="FF000005"/>' +
        '</colorScale></cfRule>' +
      '</conditionalFormatting>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="dataBar" priority="2" id="{ID-7}">' +
            '<x14:dataBar>' +
              '<x14:cfvo type="percent"><xm:f>$B$3</xm:f></x14:cfvo>' +
              '<x14:cfvo type="autoMax"/>' +
              '<x14:color rgb="FF638EC6"/>' +
            '</x14:dataBar>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules[0].type === 'colorScale' && rules[0].colorScale.map(d => ({ ...d, color: undefined }))).toEqual([
      { type: 'min', color: undefined },
      { type: 'number', value: 5, color: undefined },
      { type: 'percentile', value: 90, color: undefined },
      { type: 'formula', value: '$B$2*2', color: undefined },
      // the unknown threshold is dropped, so the last colour pairs with `max`
      { type: 'max', color: undefined },
    ]);
    expect(rules[1].type === 'dataBar' && [ rules[1].dataBar.min, rules[1].dataBar.max ]).toEqual([
      { type: 'percent', value: '$B$3' },
      { type: 'autoMax' },
    ]);
  });

  it('normalises formulas from both the main part and the x14 extension', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="expression" dxfId="0" priority="1"><formula>_xlfn.IFS(A1&gt;1,TRUE)</formula></cfRule>' +
      '</conditionalFormatting>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="expression" priority="2" id="{ID-8}">' +
            '<xm:f>_xlfn.CONCAT(A1,"x")="ax"</xm:f>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules.map(r => r.type === 'formula' && r.formula)).toEqual([
      'IFS(A1>1,TRUE)',
      'CONCAT(A1,"x")="ax"',
    ]);
  });

  it('orders rules by priority across the main part and the x14 extension', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="containsBlanks" dxfId="0" priority="3"/>' +
        '<cfRule type="containsBlanks" dxfId="0" priority="1"/>' +
      '</conditionalFormatting>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="expression" priority="2" id="{ID-9}"><xm:f>TRUE</xm:f></x14:cfRule>' +
          '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules.map(r => [ r.priority, r.type ])).toEqual([
      [ 1, 'blank' ],
      [ 2, 'formula' ],
      [ 3, 'blank' ],
    ]);
  });

  it('appends inline x14 dxfs after the workbook\'s existing differential styles', () => {
    const dom = parseXML(
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="expression" priority="1" id="{ID-10}"><xm:f>TRUE</xm:f><x14:dxf><font><b/></font></x14:dxf></x14:cfRule>' +
          '<x14:cfRule type="expression" priority="2" id="{ID-11}"><xm:f>TRUE</xm:f><x14:dxf><font><i/></font></x14:dxf></x14:cfRule>' +
          '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>' +
      '</worksheet>',
    );
    const ctx = new ConversionContext();
    ctx.workbook = { name: '', sheets: [], diffStyles: [ { bold: false }, { italic: false } ] };
    const rules = handlerConditionalFormatting(dom, ctx);
    expect(rules.map(r => 'dxf' in r && r.dxf)).toEqual([ 2, 3 ]);
    expect(ctx.workbook.diffStyles).toEqual([
      { bold: false },
      { italic: false },
      { bold: true },
      { italic: true },
    ]);
  });

  it('reuses an existing differential style for an equal inline x14 dxf', () => {
    const dom = parseXML(
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="expression" priority="1" id="{ID-12}"><xm:f>TRUE</xm:f>' +
            '<x14:dxf><font><color rgb="FF9C0006"/></font><fill><patternFill><bgColor rgb="FFFFC7CE"/></patternFill></fill></x14:dxf>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>' +
      '</worksheet>',
    );
    const ctx = new ConversionContext();
    ctx.workbook = {
      name: '',
      sheets: [],
      diffStyles: [
        { bold: true },
        { color: { type: 'srgb', value: '9C0006' }, fillColor: { type: 'srgb', value: 'FFC7CE' } },
      ],
    };
    const rules = handlerConditionalFormatting(dom, ctx);
    expect(rules.map(r => 'dxf' in r && r.dxf)).toEqual([ 1 ]);
    expect(ctx.workbook.diffStyles).toHaveLength(2);
  });

  it('shares one differential style between equal inline x14 dxfs', () => {
    const sheet = (id: string) => (
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/>' +
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          `<x14:cfRule type="expression" priority="1" id="{${id}-A}"><xm:f>TRUE</xm:f><x14:dxf><font><b/></font></x14:dxf></x14:cfRule>` +
          `<x14:cfRule type="expression" priority="2" id="{${id}-B}"><xm:f>FALSE</xm:f><x14:dxf><font><b/></font></x14:dxf></x14:cfRule>` +
          '<xm:sqref>A1</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>' +
      '</worksheet>'
    );
    const ctx = new ConversionContext();
    ctx.workbook = { name: '', sheets: [] };
    // Two rules on the same sheet...
    const rules1 = handlerConditionalFormatting(parseXML(sheet('ID-13')), ctx);
    expect(rules1.map(r => 'dxf' in r && r.dxf)).toEqual([ 0, 0 ]);
    // ...and two more on a second sheet all share one entry
    const rules2 = handlerConditionalFormatting(parseXML(sheet('ID-14')), ctx);
    expect(rules2.map(r => 'dxf' in r && r.dxf)).toEqual([ 0, 0 ]);
    expect(ctx.workbook.diffStyles).toEqual([ { bold: true } ]);
  });

  it('reads a standalone x14 data bar', () => {
    const { rules } = parse(
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="dataBar" priority="1" id="{ID-15}">' +
            '<x14:dataBar minLength="0" maxLength="100" gradient="0">' +
              '<x14:cfvo type="autoMin"/>' +
              '<x14:cfvo type="autoMax"/>' +
              '<x14:fillColor rgb="FF638EC6"/>' +
              '<x14:negativeFillColor rgb="FFFF0000"/>' +
            '</x14:dataBar>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toEqual([
      {
        type: 'dataBar',
        ref: [ 'A1:A5' ],
        priority: 1,
        dataBar: {
          min: { type: 'autoMin' },
          max: { type: 'autoMax' },
          minLength: 0,
          maxLength: 100,
          fillColor: { type: 'srgb', value: '638EC6' },
          negativeFillColor: { type: 'srgb', value: 'FF0000' },
          gradient: false,
        },
      },
    ]);
  });

  it('skips a standalone x14 data bar with no fill colour', () => {
    const { rules } = parse(
      `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
          '<x14:cfRule type="dataBar" priority="1" id="{ID-16}">' +
            '<x14:dataBar><x14:cfvo type="autoMin"/><x14:cfvo type="autoMax"/></x14:dataBar>' +
          '</x14:cfRule>' +
          '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
      '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toEqual([]);
  });

  it('lets an x14 fillColor override the main part data bar colour', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="dataBar" priority="1">' +
        '<dataBar><cfvo type="min"/><cfvo type="max"/><color rgb="FF638EC6"/></dataBar>' +
        `<extLst><ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}" ${X14}><x14:id>{ID-17}</x14:id></ext></extLst>` +
        '</cfRule>' +
        '</conditionalFormatting>' +
        `<extLst><ext uri="{78C0D931-6437-407d-A8EE-F0AAD7539E65}" ${X14}><x14:conditionalFormattings>` +
        `<x14:conditionalFormatting ${XM}>` +
        '<x14:cfRule type="dataBar" id="{ID-17}">' +
        '<x14:dataBar><x14:cfvo type="autoMin"/><x14:cfvo type="autoMax"/><x14:fillColor rgb="FF00FF00"/></x14:dataBar>' +
        '</x14:cfRule>' +
        '<xm:sqref>A1:A5</xm:sqref>' +
        '</x14:conditionalFormatting>' +
        '</x14:conditionalFormattings></ext></extLst>',
    );
    expect(rules).toHaveLength(1);
    expect(rules[0].type === 'dataBar' && rules[0].dataBar.fillColor).toEqual({ type: 'srgb', value: '00FF00' });
  });

  it('ignores equalAverage when stdDev is set', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="aboveAverage" dxfId="0" priority="1" equalAverage="1" stdDev="2"/>' +
        '<cfRule type="aboveAverage" dxfId="0" priority="2" equalAverage="1"/>' +
      '</conditionalFormatting>',
    );
    expect(rules).toEqual([
      { type: 'average', ref: [ 'A1' ], priority: 1, standardDeviations: 2, dxf: 0 },
      { type: 'average', ref: [ 'A1' ], priority: 2, inclusive: true, dxf: 0 },
    ]);
  });

  it('maps timePeriod rules to date rules', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="timePeriod" dxfId="0" priority="1" timePeriod="last7Days"><formula>TRUE</formula></cfRule>' +
      '</conditionalFormatting>',
    );
    expect(rules).toEqual([
      { type: 'date', ref: [ 'A1' ], priority: 1, period: 'last7Days', dxf: 0 },
    ]);
  });

  it('skips a data bar with no fill colour', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1:A5">' +
        '<cfRule type="dataBar" priority="1"><dataBar><cfvo type="min"/><cfvo type="max"/></dataBar></cfRule>' +
      '</conditionalFormatting>',
    );
    expect(rules).toEqual([]);
  });

  it('skips rules it cannot represent', () => {
    const { rules } = parse(
      '<conditionalFormatting sqref="A1">' +
        '<cfRule type="cellIs" dxfId="0" priority="1" operator="between"><formula>1</formula></cfRule>' +
        '<cfRule type="colorScale" priority="2"><colorScale><cfvo type="min"/><color rgb="FF000000"/></colorScale></cfRule>' +
        '<cfRule type="expression" dxfId="0" priority="3"/>' +
        '</conditionalFormatting>',
    );
    expect(rules).toEqual([]);
  });
});
