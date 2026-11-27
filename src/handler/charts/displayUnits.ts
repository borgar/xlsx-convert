/**
 * The factor of each of Excel's built-in display units. Legacy charts and ChartEx charts name them
 * the same way.
 */
export const BUILT_IN_UNITS = {
  hundreds: 1e2,
  thousands: 1e3,
  tenThousands: 1e4,
  hundredThousands: 1e5,
  millions: 1e6,
  tenMillions: 1e7,
  hundredMillions: 1e8,
  billions: 1e9,
  trillions: 1e12,
} as const;
