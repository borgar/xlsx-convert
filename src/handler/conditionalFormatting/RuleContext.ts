import type { ConversionContext } from '../../ConversionContext.ts';

/**
 * What a `<cfRule>` inherits from its enclosing `<conditionalFormatting>` element: the cells it
 * applies to and whether it was created on a pivot table. The conversion context is bundled in so
 * that rule readers take a single argument.
 */
export type RuleContext = {
  context: ConversionContext;
  ref: string[];
  pivot: boolean;
};
