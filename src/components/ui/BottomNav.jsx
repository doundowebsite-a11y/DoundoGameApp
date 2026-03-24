/**
 * BottomNav.jsx — src/components/ui/BottomNav.jsx
 * Redesigned icons to match dark card-game aesthetic.
 * Using SVG-style symbols instead of emoji — cleaner, consistent weight.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const HomeIcon = ({ active }) => (
  <View style={[ico.wrap, active && { opacity: 1 }]}>
    <Text style={[ico.sym, { color: active ? colors.primary : '#475569' }]}>⌂</Text>
  </View>
);

const ProfileIcon = ({ active }) => (
  <View style={[ico.wrap, active && { opacity: 1 }]}>
    <Text style={[ico.sym, { color: active ? colors.primary : '#475569' }]}>◉</Text>
  </View>
);

const ico = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  sym:  { fontSize: 24, lineHeight: 28 },
});

const BottomNav = ({ navigation, activeRoute }) => {
  const insets = useSafeAreaInsets();
  const tabs = [
    { route: 'Home',    label: 'HOME',    Icon: HomeIcon },
    { route: 'Profile', label: 'PROFILE', Icon: ProfileIcon },
  ];

  return (
    <View style={[nav.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map(({ route, label, Icon }) => {
        const active = activeRoute === route;
        return (
          <TouchableOpacity
            key={route}
            style={nav.tab}
            onPress={() => navigation.navigate(route)}
            activeOpacity={0.7}
          >
            <Icon active={active} />
            <Text style={[nav.label, active && { color: colors.primary }]}>{label}</Text>
            {active && <View style={nav.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const nav = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#101622',
    paddingTop: 8,
    paddingHorizontal: 16,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }),
  },
  tab:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4, position: 'relative' },
  label: { color: '#475569', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  dot:   { position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
});

export default BottomNav;
