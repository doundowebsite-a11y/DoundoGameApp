import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { IconArrowBack } from '../../assets/icons/icons';
import BottomNav from '../../components/ui/BottomNav';
import { getLevelTitle } from '../../utils/scoring';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const AVATARS = {
  1: require('../../assets/avatars/preset_1.jpg'),
  2: require('../../assets/avatars/preset_2.jpg'),
  3: require('../../assets/avatars/preset_3.jpg'),
  4: require('../../assets/avatars/preset_4.jpg'),
  5: require('../../assets/avatars/avatar_main.jpg'),
};

const getRankStyle = (index) => {
  if (index === 0) return { color: '#EAB308', icon: '👑' };
  if (index === 1) return { color: '#94A3B8', icon: '🥈' };
  if (index === 2) return { color: '#B45309', icon: '🥉' };
  return { color: colors.text.muted, icon: `${index + 1}` };
};

const LeaderboardLayout = ({ navigation, insets, containerW, leaders, loading, userId }) => (
  <View style={[styles.container, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <IconArrowBack size={scale(24)} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>GLOBAL LEADERBOARD</Text>
      <View style={{ width: scale(24) }} />
    </View>

    <View style={styles.subheader}>
      <Text style={styles.subheaderText}>TOP 50 PLAYERS WORLDWIDE</Text>
    </View>

    {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {leaders.map((player, index) => {
          const rankInfo = getRankStyle(index);
          const isMe = userId === player.id;
          return (
            <View key={player.id} style={[styles.playerRow, isMe && styles.myPlayerRow]}>
              <View style={styles.rankContainer}>
                <Text style={[styles.rankIcon, { color: rankInfo.color }]}>{rankInfo.icon}</Text>
              </View>
              <Image source={AVATARS[player.avatar_preset || 1]} style={[styles.avatar, isMe && { borderColor: colors.primary, borderWidth: 2 }]} />
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, isMe && { color: colors.primary }]} numberOfLines={1}>
                  {player.username || 'Anonymous'} {isMe && '(You)'}
                </Text>
                <Text style={styles.playerTitle}>{getLevelTitle(player.score).toUpperCase()}</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{player.score?.toLocaleString() || 0}</Text>
                <Text style={styles.scoreLabel}>PTS</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    )}
    <BottomNav navigation={navigation} activeRoute="Home" />
  </View>
);

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(14) },
  headerTitle:      { color: colors.text.primary, fontSize: scaleFont(15), fontWeight: '700', letterSpacing: 1.5 },
  subheader:        { alignItems: 'center', paddingVertical: verticalScale(8), borderBottomWidth: 1, borderBottomColor: colors.border.subtle, marginBottom: verticalScale(8) },
  subheaderText:    { color: colors.primary, fontSize: scaleFont(11), fontWeight: '700', letterSpacing: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent:    { paddingHorizontal: scale(14), paddingBottom: verticalScale(24), gap: scale(8) },
  playerRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate[900], borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(12), padding: scale(12) },
  myPlayerRow:      { backgroundColor: 'rgba(37,106,244,0.1)', borderColor: 'rgba(37,106,244,0.4)' },
  rankContainer:    { width: scale(32), alignItems: 'center', justifyContent: 'center' },
  rankIcon:         { fontSize: scaleFont(18), fontWeight: '900' },
  avatar:           { width: scale(40), height: scale(40), borderRadius: scale(20), marginLeft: scale(8), marginRight: scale(12), backgroundColor: colors.slate[800] },
  playerInfo:       { flex: 1, justifyContent: 'center' },
  playerName:       { color: colors.text.primary, fontSize: scaleFont(14), fontWeight: '700' },
  playerTitle:      { color: colors.text.muted, fontSize: scaleFont(10), marginTop: scale(2) },
  scoreContainer:   { alignItems: 'flex-end', justifyContent: 'center' },
  scoreText:        { color: colors.text.primary, fontSize: scaleFont(17), fontWeight: '900' },
  scoreLabel:       { color: colors.text.muted, fontSize: scaleFont(9), fontWeight: '700', letterSpacing: 1 },
});

export default LeaderboardLayout;