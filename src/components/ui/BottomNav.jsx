import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const TABS = [
  { route: 'Home',    label: 'HOME',    icon: '⌂' },
  { route: 'Profile', label: 'PROFILE', icon: '◉' },
];

const BottomNav = ({ navigation, activeRoute, onHomePress }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[nav.container, { paddingBottom: Math.max(insets.bottom, scale(6)) }]}>
      {TABS.map(({ route, label, icon }) => {
        const active = activeRoute === route;
        const isHomeTab = route === 'Home';
        return (
          <TouchableOpacity
            key={route}
            style={nav.tab}
            onPress={() => {
              if (isHomeTab && onHomePress) {
                onHomePress();
                return;
              }
              const params = (activeRoute === 'Game' && route === 'Home') ? { manualExit: true } : undefined;
              navigation.navigate(route, params);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={[nav.icon, { color: active ? colors.primary : '#475569' }]}>{icon}</Text>
            <Text style={[nav.label, active && { color: colors.primary }]}>{label}</Text>
            {active && <View style={nav.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const nav = StyleSheet.create({
  container: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#101622', paddingTop: verticalScale(6), paddingHorizontal: scale(16), ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }) },
  tab:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: scale(2), paddingVertical: verticalScale(4), position: 'relative' },
  icon:      { fontSize: scaleFont(20), lineHeight: scaleFont(24) },
  label:     { color: '#475569', fontSize: scaleFont(9), fontWeight: '800', letterSpacing: 1.5 },
  dot:       { position: 'absolute', bottom: 0, width: scale(4), height: scale(4), borderRadius: scale(2), backgroundColor: colors.primary },
});

export default BottomNav;