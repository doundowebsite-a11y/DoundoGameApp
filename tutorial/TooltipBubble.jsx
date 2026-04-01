/**
 * TooltipBubble.jsx — src/tutorial/TooltipBubble.jsx
 *
 * Floats at top, middle, or bottom of screen — never covering the spotlight.
 * anchor: 'top'|'middle'|'bottom'
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { height: SH } = Dimensions.get('window');

export default function TooltipBubble({ title, body, step, total, onNext, anchor = 'bottom', shake }) {
  const slideY  = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shakeX  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideY.setValue(anchor === 'top' ? -20 : 20);
    Animated.parallel([
      Animated.spring(slideY,  { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [title, anchor]);

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:-8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:-5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  // Position based on anchor
  const posStyle =
    anchor === 'top'    ? { top: 100 }
  : anchor === 'middle' ? { top: SH * 0.36 }
  : { bottom: 110 };   // 'bottom' — above action bar

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.bubble,
        posStyle,
        { opacity, transform: [{ translateY: slideY }, { translateX: shakeX }] },
      ]}
    >
      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step-1 && styles.dotOn]} />
        ))}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {onNext ? (
        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextTxt}>{step >= total ? 'PLAY NOW 🚀' : 'NEXT →'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.hint}>
          <Text style={styles.hintTxt}>👆 Do it to continue</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position:        'absolute',
    left:             16,
    right:            16,
    zIndex:           100,
    backgroundColor: 'rgba(10,16,30,0.97)',
    borderRadius:     16,
    borderWidth:      1.5,
    borderColor:     'rgba(37,106,244,0.55)',
    padding:          18,
    shadowColor:     '#256af4',
    shadowOpacity:    0.35,
    shadowRadius:     18,
    shadowOffset:    { width: 0, height: 6 },
    elevation:        22,
  },
  dots: { flexDirection:'row', gap:4, marginBottom:10, flexWrap:'wrap' },
  dot:  { width:5, height:5, borderRadius:3, backgroundColor:'#334155' },
  dotOn:{ width:14, borderRadius:3, backgroundColor:'#256af4' },
  title:{ color:'#FFF', fontSize:17, fontWeight:'900', marginBottom:7, lineHeight:23 },
  body: { color:'#94A3B8', fontSize:13, lineHeight:21, marginBottom:14 },
  nextBtn: { backgroundColor:'#256af4', paddingVertical:11, borderRadius:12, alignItems:'center' },
  nextTxt: { color:'#FFF', fontWeight:'900', fontSize:14, letterSpacing:1 },
  hint:    { alignItems:'center', paddingVertical:6, borderTopWidth:1, borderTopColor:'rgba(37,106,244,0.2)' },
  hintTxt: { color:'#256af4', fontSize:12, fontWeight:'700', letterSpacing:1 },
});
