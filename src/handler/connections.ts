import { type Document } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import type { Connection } from '@jsfkit/types';

/**
 * Parse `xl/connections.xml` into the workbook's data connections. Each `<connection>` is the
 * external data source a pivot cache with `sourceType: 'external'` points at via its `connectionId`.
 *
 * Only the `<connection>` core attributes and the `<dbPr>` (database/file) child are read; other
 * source children (`olapPr`, `webPr`, `textPr`) are not yet modelled, but such a connection still
 * round-trips its attributes.
 */
export function handlerConnections (dom: Document): Connection[] {
  const connections: Connection[] = [];
  for (const el of dom.querySelectorAll('connections > connection')) {
    const id = numAttr(el, 'id');
    if (id == null) {
      continue;
    }
    const conn: Connection = { id };
    const name = attr(el, 'name');
    if (name != null) {
      conn.name = name;
    }
    const type = numAttr(el, 'type');
    if (type != null) {
      conn.type = type;
    }
    const sourceFile = attr(el, 'sourceFile');
    if (sourceFile != null) {
      conn.sourceFile = sourceFile;
    }
    const keepAlive = boolAttr(el, 'keepAlive');
    if (keepAlive != null) {
      conn.keepAlive = keepAlive;
    }
    const background = boolAttr(el, 'background');
    if (background != null) {
      conn.background = background;
    }
    const refreshedVersion = numAttr(el, 'refreshedVersion');
    if (refreshedVersion != null) {
      conn.refreshedVersion = refreshedVersion;
    }
    const uid = attr(el, 'xr16:uid');
    if (uid != null) {
      conn.uid = uid;
    }
    const dbPrEl = el.querySelectorAll('dbPr')[0];
    if (dbPrEl) {
      const dbPr: NonNullable<Connection['dbPr']> = {};
      const connection = attr(dbPrEl, 'connection');
      if (connection != null) {
        dbPr.connection = connection;
      }
      const command = attr(dbPrEl, 'command');
      if (command != null) {
        dbPr.command = command;
      }
      const commandType = numAttr(dbPrEl, 'commandType');
      if (commandType != null) {
        dbPr.commandType = commandType;
      }
      const serverCommand = attr(dbPrEl, 'serverCommand');
      if (serverCommand != null) {
        dbPr.serverCommand = serverCommand;
      }
      conn.dbPr = dbPr;
    }
    connections.push(conn);
  }
  return connections;
}
