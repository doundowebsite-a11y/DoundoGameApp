import { scaleFont } from '../utils/scale';

export const typography = {
  fontFamily: {
    primary:   'System',
    secondary: 'System',
  },
  sizes: {
    xs:    scaleFont(10),
    sm:    scaleFont(12),
    md:    scaleFont(15),
    lg:    scaleFont(18),
    xl:    scaleFont(22),
    xxl:   scaleFont(28),
    title: scaleFont(42),
  },
  weights: {
    regular: '400',
    medium:  '500',
    bold:    '700',
    heavy:   '900',
  },
};