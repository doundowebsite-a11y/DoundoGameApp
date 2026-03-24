import React from 'react';
import Svg, { Circle, Path, LinearGradient, RadialGradient, Stop, G, Defs } from 'react-native-svg';
import { colors } from '../../theme/colors';

/**
 * DoundoLogo renders the actual Doundo brand logo from the SVG source.
 * The SVG viewBox is 120x32, so width/height should maintain ~3.75:1 ratio for the full logo.
 * For a square icon version, use the IconOnly variant which crops to the "D" mark.
 */
export const DoundoLogo = ({ width = 120, height = 32, style }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 120 32"
    style={style}
  >
    <Defs>
      <LinearGradient id="lg1" x1="20.95" y1="15.98" x2="38.63" y2="15.98" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#F1582D" />
        <Stop offset="1" stopColor="#D25432" />
      </LinearGradient>

      <RadialGradient id="rg1" cx="29.34" cy="15.98" r="8.84" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#F1582D" />
        <Stop offset="0.5084" stopColor="#FAB490" />
        <Stop offset="1" stopColor="#F1582D" />
      </RadialGradient>

      <LinearGradient id="lg2" x1="49.77" y1="7.14" x2="49.77" y2="24.86" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" />
        <Stop offset="0.1221" stopColor="#367A85" />
        <Stop offset="0.3504" stopColor="#428893" />
        <Stop offset="0.6154" stopColor="#4A919C" />
        <Stop offset="1" stopColor="#4C94A0" />
      </LinearGradient>

      <LinearGradient id="lg3" x1="58.63" y1="17.12" x2="40.91" y2="17.12" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#31737E" />
        <Stop offset="0.5" stopColor="#EAEAE8" />
        <Stop offset="1" stopColor="#317480" />
      </LinearGradient>

      <LinearGradient id="lg4" x1="70.23" y1="24.86" x2="70.23" y2="7.14" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" />
        <Stop offset="0.1221" stopColor="#367A85" />
        <Stop offset="0.3504" stopColor="#428893" />
        <Stop offset="0.6154" stopColor="#4A919C" />
        <Stop offset="1" stopColor="#4C94A0" />
      </LinearGradient>

      <LinearGradient id="lg5" x1="61.37" y1="14.88" x2="79.09" y2="14.88" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#31737E" />
        <Stop offset="0.5" stopColor="#EAEAE8" />
        <Stop offset="1" stopColor="#317480" />
      </LinearGradient>

      <LinearGradient id="lg6" x1="81.83" y1="16" x2="99.54" y2="16" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" />
        <Stop offset="0.1221" stopColor="#367A85" />
        <Stop offset="0.3504" stopColor="#428893" />
        <Stop offset="0.6154" stopColor="#4A919C" />
        <Stop offset="1" stopColor="#4C94A0" />
      </LinearGradient>

      <LinearGradient id="lg7" x1="84.07" y1="16" x2="97.29" y2="16" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#31737E" />
        <Stop offset="0.5" stopColor="#EAEAE8" />
        <Stop offset="1" stopColor="#317480" />
      </LinearGradient>

      <LinearGradient id="lg8" x1="81.83" y1="16" x2="99.54" y2="16" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#3D8C99" stopOpacity="0" />
        <Stop offset="0.1216" stopColor="#3D8C99" stopOpacity="0.1216" />
        <Stop offset="1" stopColor="#3D8C99" />
      </LinearGradient>

      <LinearGradient id="lg9" x1="37.68" y1="15.98" x2="20" y2="15.98" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#DE5631" stopOpacity="0" />
        <Stop offset="0.1319" stopColor="#E25730" stopOpacity="0.1319" />
        <Stop offset="0.5462" stopColor="#EC582E" stopOpacity="0.5462" />
        <Stop offset="1" stopColor="#F1582D" />
      </LinearGradient>
    </Defs>

    <G>
      {/* Orange circle (O in dOundo) */}
      <Circle cx="29.34" cy="15.98" r="8.84" fill="url(#lg1)" />
      <Circle cx="29.34" cy="15.98" r="8.84" fill="url(#rg1)" />
      <Circle cx="29.29" cy="15.98" r="6.61" fill="#F1582D" />

      {/* D shape */}
      <Path d="M17.72,16C17.72,20.89,13.75,24.86,8.86,24.86H0V7.14h8.86C13.75,7.14,17.72,11.11,17.72,16z" fill="#F1582D" />

      {/* Last O */}
      <Circle cx="111.14" cy="16" r="8.86" fill="#3D8C99" />

      {/* U shape */}
      <Path d="M58.63,7.14V16c0,4.89-3.97,8.86-8.86,8.86c-4.89,0-8.86-3.97-8.86-8.86V7.14H58.63z" fill="url(#lg2)" />
      <Path d="M58.63,9.39V16c0,4.89-3.97,8.86-8.86,8.86c-4.89,0-8.86-3.97-8.86-8.86V9.39H58.63z" fill="url(#lg3)" opacity="0.5" />
      <Path d="M56.38,9.39V16c0,3.65-2.96,6.61-6.61,6.61c-3.65,0-6.61-2.96-6.61-6.61V9.39H56.38z" fill="#45979F" />

      {/* N shape (inverted U) */}
      <Path d="M61.37,24.86V16c0-4.89,3.97-8.86,8.86-8.86c4.89,0,8.86,3.97,8.86,8.86v8.86H61.37z" fill="url(#lg4)" />
      <Path d="M61.37,22.61V16c0-4.89,3.97-8.86,8.86-8.86c4.89,0,8.86,3.97,8.86,8.86v6.61H61.37z" fill="url(#lg5)" opacity="0.5" />
      <Path d="M63.62,22.61V16c0-3.65,2.96-6.61,6.61-6.61c3.65,0,6.61,2.96,6.61,6.61v6.61H63.62z" fill="#45979F" />

      {/* D shape (right) */}
      <Path d="M81.83,7.14h8.86c4.89,0,8.86,3.97,8.86,8.86c0,4.89-3.97,8.86-8.86,8.86h-8.86V7.14z" fill="url(#lg6)" />
      <Path d="M84.07,7.14h6.61c4.89,0,8.86,3.97,8.86,8.86c0,4.89-3.97,8.86-8.86,8.86h-6.61V7.14z" fill="url(#lg7)" opacity="0.5" />
      <Path d="M84.07,9.39h6.61c3.65,0,6.61,2.96,6.61,6.61c0,3.65-2.96,6.61-6.61,6.61h-6.61V9.39z" fill="#489BA4" />

      {/* Overlay gradients */}
      <Path d="M99.54,16c0,4.89-3.97,8.86-8.86,8.86h-8.86V7.14h8.86C95.58,7.14,99.54,11.11,99.54,16z" fill="url(#lg8)" />
      <Circle cx="29.29" cy="15.98" r="8.84" fill="url(#lg9)" />
    </G>
  </Svg>
);

export default DoundoLogo;
