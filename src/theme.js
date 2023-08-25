import attr from './utils/attr.js';
import { COLOR_INDEX } from './constants.js';

const colorIndexes = {
  lt1:       0, // Light 1
  dk1:       1, // Dark 1
  lt2:       2, // Light 2
  dk2:       3, // Dark 2
  accent1:   4, // Accent 1
  accent2:   5, // Accent 2
  accent3:   6, // Accent 3
  accent4:   7, // Accent 4
  accent5:   8, // Accent 5
  accent6:   9, // Accent 6
  hlink:    10, // Hyperlink
  folHlink: 11  // Followed Hyperlink
};

export default function (dom) {
  const theme = {
    // FIXME: what is the default windows Excel color scheme? (clue: not this)
    scheme: [
      'WindowText',
      'Window',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000',
      'FF000000'
    ],
    indexedColors: [ ...COLOR_INDEX ]
  };

  dom.querySelectorAll('theme > themeElements > clrScheme > *')
    .forEach(d => {
      let index = colorIndexes[d.tagName];
      if (index == null) {
        index = theme.scheme.length;
      }
      d.children.forEach(c => {
        // One of: [ srgbClr, sysClr ]
        // Other variants in VML:
        //   [ scrgbClr, srgbClr, hslClr, sysClr, schemeClr, prstClr ]
        // TODO: determine if alternate colors are able to turn up in clrScheme.
        const val = attr(c, 'val');
        if (c.tagName === 'sysClr') {
          theme.scheme[index] = val;
        }
        if (c.tagName === 'srgbClr') {
          // for some reason colors here are in the RRGGBB format, not ARGB
          theme.scheme[index] = 'FF' + val;
        }
      });
    });

  return theme;
}
