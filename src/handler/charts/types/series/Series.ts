import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { PictureOptions } from '../plots/PictureOptions.ts';
import type { Trendline } from '../trendline/Trendline.ts';
import type { ErrBars } from '../errorbars/ErrBars.ts';
import type { integer, Shape } from '@jsfkit/types';
import type { BarShape } from '../plots/BarShape.ts';
import type { Marker } from '../marker/Marker.ts';
import type { StrRef } from '../data/StrRef.ts';

export type Series = {
  /**
   * Reference index of the series.
   */
  idx: integer;
  /**
   * The order number for the series.
   */
  order: integer;
  /**
   * Text label for the series.
   */
  text?: StrRef | string;
  /**
   * Visual properties specific to this series.
   */
  shape?: Shape;
  /**
   * Data points
   *
   * Used by: All except *Surface*
   */
  dPt?: DPt[];
  /**
   * Data labels
   *
   * Used by: All except *Surface*
   */
  dLbls?: DLbls;
  /**
   * Used by: *Bar, Area*
   */
  pictureOptions?: PictureOptions;
  /**
   * Shape of the bar mark
   *
   * Used by: *Bar*
   */
  barShape?: BarShape;
  /**
   * Trendline
   *
   * Used by: *Area, Bar, Bubble, Line, Scatter*
   */
  trendline?: Trendline[];
  /**
   * Error bars
   *
   * Used by: *Area, Bar, Bubble, Line, Scatter*
   */
  errBars?: ErrBars;
  /**
   * Marker style properties
   *
   * Used by: *Line, Radar, Scatter*
   */
  marker?: Marker;
  /**
   * Point of explosion (mark pushed away from center)
   *
   * Used by: *Pie*
   */
  explosion?: integer;
  /**
   * Smoothed line
   *
   * Used by: *Line, Scatter*
   */
  smooth?: boolean;
  /**
   * Bubble size
   *
   * Used by: *Bubble*
   */
  bubbleSize?: NumDataSource;
  /**
  * Bubble "3D" shading
  *
  * Used by: *Bubble*
   */
  bubble3D?: boolean;
  /**
   * Draw an alternate style for negative numbers
   *
   * Used by: *Bar, Bubble*
   */
  invertIfNegative?: boolean;
  /**
   * Category data
   *
   * Used by: *Area, Bar, Line, Pie, Radar, Surface*
   *
   * In *Bubble* and *Scatter* charts these are the x-axis values.
   */
  cat?: AxDataSource;
  /**
   * Value data
   *
   * Used by: *Area, Bar, Line, Pie, Radar, Surface*
   *
   * In *Bubble* and *Scatter* charts these are the y-axis values.
   */
  val?: NumDataSource;
};
