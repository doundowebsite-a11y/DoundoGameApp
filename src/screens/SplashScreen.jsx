/**
 * SplashScreen.jsx  —  src/screens/SplashScreen.jsx
 *
 * ✅  Works on iOS + Android (expo-gl is a first-party Expo package)
 * ✅  All elements flex-centred — phones, tablets, iPads, all sizes
 * ✅  Cards orbit AROUND the grid in a circular path
 * ✅  Cards always IN FRONT of grid (zIndex / elevation)
 * ✅  Vortex shader is the exact one provided (logarithmic spiral)
 * ✅  DoundoLogo + symbol icons animate in
 *
 * LAYER ORDER  (back → front):
 *   1.  Deep-space gradient background
 *   2.  Drifting star particles
 *   3.  GLView  — logarithmic golden spiral vortex  (zIndex 1)
 *   4.  4×4 symbol grid                             (zIndex 5)
 *   5.  8 orbiting symbol cards                     (zIndex 10)
 *   6.  DoundoLogo + tagline
 *   7.  Loading bar
 *
 * ANIMATION SEQUENCE:
 *   0.0 s  BG + particles fade in
 *   0.3 s  Vortex GL canvas fades in, shader starts rotating
 *   1.8 s  Grid springs in from vortex centre (scale 0→1)
 *   2.8 s  8 cards burst out staggered, then orbit continuously
 *   4.0 s  Logo + tagline slide up and fade in
 *   4.5 s+ Loading bar fills (3.8 s) → master fade out → onFinish()
 *
 * INSTALL (one command):
 *   npx expo install expo-gl
 */

import React, {
  useEffect, useRef, useMemo, useCallback,
} from 'react';
import {
  View, StyleSheet, Animated, Easing,
  StatusBar, Text, Image, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GLView }         from 'expo-gl';
import Svg, {
  Circle, Path, G, Defs,
  LinearGradient as SvgLG,
  RadialGradient as SvgRG,
  Stop,
} from 'react-native-svg';

// ─── Symbol assets (exact paths from symbols.js) ─────────────────────────────
const SYMBOLS = [
  { id: 'AHURA',  label: 'Ahura',  color: '#8ED8F8', icon: require('../assets/icons/symbol_AHURA.png')  },
  { id: 'ARES',   label: 'Ares',   color: '#ED2024', icon: require('../assets/icons/symbol_ARES.png')   },
  { id: 'ASGARD', label: 'Asgard', color: '#F8D210', icon: require('../assets/icons/symbol_ASGARD.png') },
  { id: 'ENKI',   label: 'Enki',   color: '#D87AB1', icon: require('../assets/icons/symbol_ENKI.png')   },
  { id: 'GAIA',   label: 'Gaia',   color: '#A5CE3C', icon: require('../assets/icons/symbol_GAIA.png')   },
  { id: 'HERA',   label: 'Hera',   color: '#5F2D85', icon: require('../assets/icons/symbol_HERA.png')   },
  { id: 'LAOZI',  label: 'Laozi',  color: '#F58220', icon: require('../assets/icons/symbol_LAOZI.png')  },
  { id: 'MITRA',  label: 'Mitra',  color: '#ABABAB', icon: require('../assets/icons/symbol_MITRA.png')  },
  { id: 'SETNA',  label: 'Setna',  color: '#A5CE3C', icon: require('../assets/icons/symbol_SETNA.png')  },
  { id: 'SHAMAN', label: 'Shaman', color: '#C8A020', icon: require('../assets/icons/symbol_SHAMAN.png') },
  { id: 'SHIVA',  label: 'Shiva',  color: '#1A5592', icon: require('../assets/icons/symbol_SHIVA.png')  },
  { id: 'TITAN',  label: 'Titan',  color: '#914A21', icon: require('../assets/icons/symbol_TITAN.png')  },
];

// Grid: 16 slots using all 12 symbols (some repeated)
const GRID_SLOTS  = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 3, 5, 7];
// 8 orbit cards — one per unique symbol (first 8)
const CARD_COUNT  = 8;

// ─── Inlined DoundoLogo SVG ───────────────────────────────────────────────────
const DoundoLogo = ({ width = 200, height = 54 }) => (
  <Svg width={width} height={height} viewBox="0 0 120 32">
    <Defs>
      <SvgLG id="lg1" x1="20.95" y1="15.98" x2="38.63" y2="15.98" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#F1582D" /><Stop offset="1" stopColor="#D25432" />
      </SvgLG>
      <SvgRG id="rg1" cx="29.34" cy="15.98" r="8.84" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#F1582D" />
        <Stop offset="0.51" stopColor="#FAB490" />
        <Stop offset="1" stopColor="#F1582D" />
      </SvgRG>
      <SvgLG id="lg2" x1="49.77" y1="7.14" x2="49.77" y2="24.86" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" /><Stop offset="1" stopColor="#4C94A0" />
      </SvgLG>
      <SvgLG id="lg4" x1="70.23" y1="24.86" x2="70.23" y2="7.14" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" /><Stop offset="1" stopColor="#4C94A0" />
      </SvgLG>
      <SvgLG id="lg6" x1="81.83" y1="16" x2="99.54" y2="16" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#2D6F7A" /><Stop offset="1" stopColor="#4C94A0" />
      </SvgLG>
    </Defs>
    <G>
      <Circle cx="29.34" cy="15.98" r="8.84" fill="url(#lg1)" />
      <Circle cx="29.34" cy="15.98" r="8.84" fill="url(#rg1)" />
      <Circle cx="29.29" cy="15.98" r="6.61" fill="#F1582D" />
      <Path d="M17.72,16C17.72,20.89,13.75,24.86,8.86,24.86H0V7.14h8.86C13.75,7.14,17.72,11.11,17.72,16z" fill="#F1582D" />
      <Circle cx="111.14" cy="16" r="8.86" fill="#3D8C99" />
      <Path d="M58.63,7.14V16c0,4.89-3.97,8.86-8.86,8.86c-4.89,0-8.86-3.97-8.86-8.86V7.14H58.63z" fill="url(#lg2)" />
      <Path d="M56.38,9.39V16c0,3.65-2.96,6.61-6.61,6.61c-3.65,0-6.61-2.96-6.61-6.61V9.39H56.38z" fill="#45979F" />
      <Path d="M61.37,24.86V16c0-4.89,3.97-8.86,8.86-8.86c4.89,0,8.86,3.97,8.86,8.86v8.86H61.37z" fill="url(#lg4)" />
      <Path d="M63.62,22.61V16c0-3.65,2.96-6.61,6.61-6.61c3.65,0,6.61,2.96,6.61,6.61v6.61H63.62z" fill="#45979F" />
      <Path d="M81.83,7.14h8.86c4.89,0,8.86,3.97,8.86,8.86c0,4.89-3.97,8.86-8.86,8.86h-8.86V7.14z" fill="url(#lg6)" />
      <Path d="M84.07,9.39h6.61c3.65,0,6.61,2.96,6.61,6.61c0,3.65-2.96,6.61-6.61,6.61h-6.61V9.39z" fill="#489BA4" />
    </G>
  </Svg>
);

// ─── GLSL shaders ─────────────────────────────────────────────────────────────
// Vertex: simple full-screen quad pass-through
const VERT = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

// Fragment: the exact provided logarithmic spiral shader,
// with u_open (0→1) for the fade-in entrance animation
const FRAG = `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform float u_open;       /* 0.0 = invisible, 1.0 = fully open */

  float glow(float d, float power) {
    return pow(1.0 / (d + 0.05), power);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    /* Centre + zoom — canvas is oversized to give the fade room,
       so zoom is increased to keep the visible glow the same size */
    uv = (uv - 0.5) * 2.4;
    uv.x *= u_resolution.x / u_resolution.y;

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    /* Logarithmic spiral (tighter winding) */
    float swirl = a + log(r + 0.05) * 2.0 - u_time * 0.4;

    /* Spiral bands */
    float bands = sin(swirl * 5.0);

    /* Thick, soft bands */
    float mask = smoothstep(0.8, 0.0, abs(bands));

    /* Bright core */
    float core = glow(r, 3.0);

    /* Outer ambient glow */
    float outerGlow = glow(r, 1.5) * 0.3;

    float intensity = mask * 0.6 + core * 1.8 + outerGlow;

    /* Outer fade — tapers smoothly to zero.
       Starting fade at 0.75 and ending at 1.1 ensures intensity is 0
       before reaching the canvas boundary at r≈1.0 (after the *1.6 zoom).
       This eliminates the hard rectangular box edge completely. */
    intensity *= smoothstep(1.1, 0.3, r);

    /* Golden colour */
    vec3 color = vec3(1.0, 0.9, 0.4) * intensity;

    /* Soft bloom tone-curve */
    color = pow(color, vec3(0.85));

    /* Alpha = intensity itself so dark pixels are fully transparent.
       This eliminates the hard rectangular box edge — the glow
       feathers smoothly into the transparent RN background.
       u_open fades the whole thing in during the entrance animation. */
    float alpha = clamp(intensity, 0.0, 1.0) * u_open;

    /* Pre-multiplied alpha output for correct additive blending.
       Bright glow pixels accumulate naturally on the dark background. */
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

// ─── VortexGL ─────────────────────────────────────────────────────────────────
/**
 * Renders the logarithmic golden spiral via expo-gl raw WebGL.
 * The `openValue` ref is read every frame so the shader fades in
 * without needing to recreate the GL context.
 *
 * iOS: expo-gl uses Metal under the hood on iOS — fully supported.
 * Android: expo-gl uses OpenGL ES — fully supported.
 */
const VortexGL = ({ size, canvasSize, openValueRef }) => {
  const glRef    = useRef(null);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  const onContextCreate = useCallback((gl) => {
    glRef.current = gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;

    // Compile helper
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[VortexGL] shader error:', gl.getShaderInfoLog(s));
      }
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1,  1,-1,  -1,1,  1,1]),
      gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    const uOpen = gl.getUniformLocation(prog, 'u_open');

    gl.viewport(0, 0, W, H);
    gl.uniform2f(uRes, W, H);

    // Additive-style blending: glow accumulates on the transparent background.
    // This makes the vortex merge smoothly with the RN dark background —
    // no hard box edge, no colour mismatch.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // pre-multiplied alpha

    // Render loop
    const frame = (ts) => {
      if (!glRef.current) return;
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t * 1.0); // 50% slower — was t*2, now t*1
      gl.uniform1f(uOpen, openValueRef.current ?? 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.flush();
      gl.endFrameEXP();

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    glRef.current = null;
  }, []);

  return (
    <GLView
      style={{ width: canvasSize, height: canvasSize, backgroundColor: 'transparent' }}
      onContextCreate={onContextCreate}
    />
  );
};

// ─── Grid4x4 ─────────────────────────────────────────────────────────────────
const Grid4x4 = ({ gridSize, scaleAnim, floatAnim }) => {
  const cell = gridSize / 4;
  return (
    <Animated.View style={{
      width: gridSize,
      height: gridSize,
      transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
    }}>
      {/* Dark glass background */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#08081c',
        borderRadius: 10,
      }} />

      {/* Symbol icons in each cell */}
      {GRID_SLOTS.map((si, slot) => {
        const sym = SYMBOLS[si];
        const row = Math.floor(slot / 4);
        const col = slot % 4;
        return (
          <View key={slot} style={{
            position: 'absolute',
            left: col * cell, top: row * cell,
            width: cell, height: cell,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Image
              source={sym.icon}
              style={{ width: cell * 0.60, height: cell * 0.60, resizeMode: 'contain' }}
            />
          </View>
        );
      })}

      {/* Inner grid lines */}
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <View style={{
            position: 'absolute', left: 0, right: 0,
            top: i * cell, height: 1,
            backgroundColor: 'rgba(215,168,42,0.30)',
          }} />
          <View style={{
            position: 'absolute', top: 0, bottom: 0,
            left: i * cell, width: 1,
            backgroundColor: 'rgba(215,168,42,0.30)',
          }} />
        </React.Fragment>
      ))}

      {/* Outer border */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(215,168,42,0.65)',
      }} />
    </Animated.View>
  );
};

// ─── FloatingCard ─────────────────────────────────────────────────────────────
/**
 * Orbit maths:
 *   - 60 keyframes pre-baked so trig is not computed in the render path
 *   - All 8 cards orbit the same circle (ORBIT_R) at the same angular speed
 *     so they stay evenly spaced — exactly like planets on a circular orbit
 *   - Enter: spring from grid centre (0,0) → first orbit position
 *   - zIndex:10 / elevation:10 → always in front of grid
 */
const ORBIT_STEPS = 60;

const FloatingCard = ({
  symIndex, cardIndex, cardW, cardH, orbitR,
  enterAnim, orbitAnim,
}) => {
  const sym = SYMBOLS[symIndex];

  // Evenly spaced base angle
  const baseAngle = (cardIndex / CARD_COUNT) * Math.PI * 2;

  // All cards same angular speed (1 full revolution per orbitAnim 0→1 cycle)
  // Small speed variation (±10%) keeps the group feeling alive without breaking spacing
  const speedMul = 1.0 + (cardIndex % 3 - 1) * 0.08;

  // Depth: cards at slightly different scales simulate a circle in 3D perspective
  const depth = 0.82 + (cardIndex % 4) * 0.045;

  // Static tilt so each card looks naturally thrown
  const tiltDeg = (cardIndex % 2 === 0 ? 1 : -1) * (8 + (cardIndex % 4) * 3);

  // Pre-bake 60 (x,y) positions for the orbit
  const { inp, xOut, yOut } = useMemo(() => {
    const inp  = Array.from({ length: ORBIT_STEPS + 1 }, (_, k) => k / ORBIT_STEPS);
    // Pure circular orbit (not flattened) — cards go fully around the grid
    const xOut = inp.map(t =>
      Math.cos(baseAngle + t * Math.PI * 2 * speedMul) * orbitR * depth
    );
    const yOut = inp.map(t =>
      Math.sin(baseAngle + t * Math.PI * 2 * speedMul) * orbitR * depth
    );
    return { inp, xOut, yOut };
  }, [orbitR]);

  // Enter: 0 → first orbit position (burst out from grid)
  const enterX = enterAnim.interpolate({ inputRange: [0,1], outputRange: [0, xOut[0]] });
  const enterY = enterAnim.interpolate({ inputRange: [0,1], outputRange: [0, yOut[0]] });

  // Orbit delta: subtract first position so orbit starts where enter lands
  const deltaX = orbitAnim.interpolate({
    inputRange: inp,
    outputRange: xOut.map(x => x - xOut[0]),
    extrapolate: 'clamp',
  });
  const deltaY = orbitAnim.interpolate({
    inputRange: inp,
    outputRange: yOut.map(y => y - yOut[0]),
    extrapolate: 'clamp',
  });

  const tx = Animated.add(enterX, deltaX);
  const ty = Animated.add(enterY, deltaY);

  const cardScale   = enterAnim.interpolate({ inputRange: [0,1], outputRange: [0, depth] });
  const cardOpacity = enterAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View style={{
      position: 'absolute',
      width: cardW, height: cardH,
      marginLeft: -cardW / 2,
      marginTop:  -cardH / 2,
      opacity:  cardOpacity,
      zIndex:   10,     // in front of grid (zIndex 5)
      elevation: 10,    // Android
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: cardScale },
        { rotate: `${tiltDeg}deg` },
      ],
    }}>
      <View style={{
        flex: 1,
        backgroundColor: '#0c0c1e',
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: `${sym.color}60`,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingBottom: 5,
        gap: 3,
        // Card drop shadow
        shadowColor: '#000',
        shadowOpacity: 0.70,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}>
        {/* Subtle colour wash at top */}
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '60%',
          backgroundColor: `${sym.color}12`,
          borderTopLeftRadius: 8, borderTopRightRadius: 8,
        }} />
        <Image
          source={sym.icon}
          style={{ width: cardW * 0.52, height: cardW * 0.52, resizeMode: 'contain' }}
        />
        <Text style={{
          fontSize: 7.5, fontWeight: '800',
          letterSpacing: 1, color: sym.color,
          opacity: 0.92, marginTop: 1,
        }}>
          {sym.label.toUpperCase()}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Particle ─────────────────────────────────────────────────────────────────
const Particle = React.memo(({ x, y, size, color, delay }) => {
  const drift   = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dx  = (Math.random() - 0.5) * 80;
    const dy  = -(Math.random() * 90 + 20);
    const dur = 5000 + Math.random() * 5000;
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.75, duration: dur * 0.3, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,    duration: dur * 0.7, useNativeDriver: true }),
        ]),
        Animated.timing(drift, {
          toValue: { x: dx, y: dy }, duration: dur,
          easing: Easing.linear, useNativeDriver: true,
        }),
      ]),
      Animated.timing(drift, { toValue: { x:0, y:0 }, duration: 0, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity,
      transform: drift.getTranslateTransform(),
    }} />
  );
});

// ─── SplashScreen ─────────────────────────────────────────────────────────────
export default function SplashScreen({ onFinish }) {
  const { width: W, height: H } = useWindowDimensions();

  // ── Responsive sizing ─────────────────────────────────────────
  // VORTEX_SIZE: square canvas, fills the upper portion of screen
  // Vortex fills full screen width — the shader's own smoothstep fade
  // at r=1.3 means glow naturally tapers to zero before the canvas edge,
  // so there is no hard rectangular border visible.
  const VORTEX_SIZE = Math.min(W, H * 0.72) * 0.40;
  // GL canvas is oversized so the shader's soft fade has room to reach
  // zero before hitting the canvas edge — eliminates rectangular crop
  const CANVAS_SIZE = Math.round(VORTEX_SIZE * 1.5);
  // Grid: decoupled from vortex, sized 50% larger
  const GRID_SIZE   = Math.round(VORTEX_SIZE * 0.38 * 1.5);
  const CELL        = GRID_SIZE / 4;
  const CARD_W      = Math.round(CELL * 1.55);
  const CARD_H      = Math.round(CELL * 1.92);
  // Orbit radius: cards circle the outer edge of the grid
  const ORBIT_R     = GRID_SIZE * 0.50 + CARD_W * 0.80;

  // ── Animated values ───────────────────────────────────────────
  const bgFade      = useRef(new Animated.Value(0)).current;
  const vortexFade  = useRef(new Animated.Value(0)).current; // opacity of GL canvas
  const vortexOpen  = useRef(new Animated.Value(0)).current; // 0→1, fed to u_open
  const gridScale   = useRef(new Animated.Value(0)).current;
  const gridFloat   = useRef(new Animated.Value(0)).current;
  const orbitAnim   = useRef(new Animated.Value(0)).current;
  const cardEnters  = useRef(
    Array.from({ length: CARD_COUNT }, () => new Animated.Value(0))
  ).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.88)).current;
  const logoTransY  = useRef(new Animated.Value(20)).current;
  const loadProg    = useRef(new Animated.Value(0)).current; // 0→1
  const masterFade  = useRef(new Animated.Value(1)).current;

  // Live JS value of vortexOpen → read by GL frame callback each tick
  const openValRef = useRef(0);
  useEffect(() => {
    const id = vortexOpen.addListener(({ value }) => { openValRef.current = value; });
    return () => vortexOpen.removeListener(id);
  }, []);

  // ── Particle field ────────────────────────────────────────────
  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      x:     Math.random() * 1200,
      y:     Math.random() * 2600,
      size:  Math.random() * 2.5 + 0.8,
      color: i % 3 === 0 ? 'rgba(255,200,50,0.80)'
           : i % 3 === 1 ? 'rgba(120,185,255,0.55)'
           :                'rgba(255,255,255,0.40)',
      delay: Math.random() * 5000,
    })), []
  );

  // ── Main animation sequence ───────────────────────────────────
  useEffect(() => {
    StatusBar.setHidden(true);

    // BG fade
    Animated.timing(bgFade, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Vortex GL fades in (View opacity)
    Animated.timing(vortexFade, {
      toValue: 1, duration: 1000, delay: 300,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();

    // u_open uniform 0→1 (not native — feeds JS listener → ref → GL)
    Animated.timing(vortexOpen, {
      toValue: 1, duration: 1400, delay: 300,
      easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();

    // Grid springs in from vortex centre
    Animated.spring(gridScale, {
      toValue: 1, friction: 6, tension: 80,
      delay: 1800, useNativeDriver: true,
    }).start();

    // Grid gentle float (starts after spring settles)
    setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(gridFloat, {
          toValue: -5, duration: 2600,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(gridFloat, {
          toValue: 5, duration: 2600,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])).start();
    }, 3200);

    // Orbit loop (non-native for interpolation)
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1, duration: 18000,
        easing: Easing.linear, useNativeDriver: false,
      })
    ).start();

    // Cards burst out staggered at 2.8 s
    setTimeout(() => {
      Animated.stagger(110,
        cardEnters.map(a => Animated.spring(a, {
          toValue: 1, friction: 6, tension: 60,
          useNativeDriver: false,
        }))
      ).start();
    }, 2800);

    // Logo + tagline slide up at start
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 900,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(logoTransY, {
          toValue: 0, duration: 900,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1, friction: 7, tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Loading bar fills over 3.8 s (starts at 0.6 s)
    Animated.timing(loadProg, {
      toValue: 1, duration: 3800, delay: 600,
      easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      setTimeout(() => {
        Animated.timing(masterFade, {
          toValue: 0, duration: 700,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }).start(({ finished: done }) => {
          if (done) {
            StatusBar.setHidden(false);
            onFinish && onFinish();
          }
        });
      }, 400);
    });

    return () => StatusBar.setHidden(false);
  }, []);

  const loadBarW = loadProg.interpolate({
    inputRange: [0, 1], outputRange: [0, W * 0.72],
  });

  return (
    <Animated.View style={[s.root, { opacity: masterFade }]}>
      <StatusBar hidden />

      {/* ── 1. Background gradient ─────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgFade }]}>
        <LinearGradient
          colors={['#02020a', '#060414', '#0c091c', '#04040e']}
          locations={[0, 0.28, 0.68, 1]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* ── 2. Star / dust particles ───────────────────────── */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── 3. Centre stage: vortex + grid + cards ─────────── */}
      {/*    flex:1 column centres the zero-size anchor precisely */}
      <View style={s.stage}>

        {/*  Zero-size anchor — everything offsets from this point */}
        <View style={s.anchor}>

          {/* 3a. GL vortex — rendered behind grid and cards */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -CANVAS_SIZE / 2,
              top:  -CANVAS_SIZE / 2,
              zIndex: 1,
              opacity: vortexFade,
              backgroundColor: 'transparent', // no background bleed through
            }}
          >
            <VortexGL size={VORTEX_SIZE} canvasSize={CANVAS_SIZE} openValueRef={openValRef} />
          </Animated.View>

          {/* 3b. Grid — centred at anchor, zIndex 5 */}
          <View style={{
            position: 'absolute',
            left: -GRID_SIZE / 2,
            top:  -GRID_SIZE / 2,
            zIndex: 5,
          }}>
            <Grid4x4
              gridSize={GRID_SIZE}
              scaleAnim={gridScale}
              floatAnim={gridFloat}
            />
          </View>

          {/* 3c. Orbiting cards — zIndex 10, always in front */}
          {Array.from({ length: CARD_COUNT }, (_, i) => (
            <FloatingCard
              key={i}
              symIndex={i}
              cardIndex={i}
              cardW={CARD_W}
              cardH={CARD_H}
              orbitR={ORBIT_R}
              enterAnim={cardEnters[i]}
              orbitAnim={orbitAnim}
            />
          ))}

        </View>{/* anchor */}
      </View>{/* stage */}

      {/* ── 4. Logo + tagline ──────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.logoWrap, {
          marginTop: -H * 0.10,
          opacity: logoOpacity,
          transform: [
            { translateY: logoTransY },
            { scale: logoScale },
          ],
        }]}
      >
        <DoundoLogo width={200} height={54} />
        <Text style={s.tagline}>MATCH ROWS OF SYMBOLS</Text>
        <Text style={s.taglineSub}>As Minds Race & Tactics Turn</Text>
      </Animated.View>

      {/* ── 5. Loading bar ─────────────────────────────────── */}
      <View style={s.loadWrap} pointerEvents="none">
        <View style={[s.loadTrack, { width: W * 0.72 }]}>
          <Animated.View style={[s.loadFill, { width: loadBarW }]} />
          {/* Glowing tip */}
          <Animated.View style={[
            s.loadTip,
            { left: Animated.add(loadBarW, new Animated.Value(-10)) },
          ]} />
        </View>
      </View>

    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02020a',
    flexDirection: 'column',
  },

  // Flex-centred container — vortex/grid/cards always centred on any screen
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Zero-size anchor point — all children use absolute offsets from here
  anchor: {
    width: 0, height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo section
  logoWrap: {
    alignItems: 'center',
    paddingBottom: 16,
    gap: 4,
  },
  tagline: {
    color: 'rgba(220,192,88,0.90)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  taglineSub: {
    color: 'rgba(195,163,72,0.52)',
    fontSize: 11,
    letterSpacing: 0.5,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Loading bar
  loadWrap: {
    alignItems: 'center',
    paddingBottom: 44,
  },
  loadTrack: {
    height: 2.5,
    backgroundColor: 'rgba(215,168,40,0.14)',
    borderRadius: 2,
    overflow: 'visible',
  },
  loadFill: {
    height: '100%',
    backgroundColor: '#D4A020',
    borderRadius: 2,
    shadowColor: '#F8C030',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  loadTip: {
    position: 'absolute',
    top: -5, width: 20, height: 14,
    backgroundColor: 'rgba(255,210,80,0.28)',
    borderRadius: 7,
    shadowColor: '#FFD060',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
