import type { Element } from '@borgar/simple-xml';
import type { CellOffset } from './types.ts';
import { emu2px } from './emu2px.ts';

export function readCellPos (elm: Element | null): CellOffset {
  return {
    row: +(elm?.querySelector('row')?.textContent ?? 0),
    rowOffset: emu2px(+(elm?.querySelector('rowOff')?.textContent ?? 0)),
    column: +(elm?.querySelector('col')?.textContent ?? 0),
    columnOffset: emu2px(+(elm?.querySelector('colOff')?.textContent ?? 0)),
  };
}
