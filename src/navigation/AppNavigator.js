/**
 * AppNavigator.js — src/navigation/AppNavigator.js
 *
 * Updated to include SplashScreen as Stage 2 of the loading pipeline.
 * All existing screen registration logic preserved exactly as uploaded.
 *
 * 3-STAGE PIPELINE:
 *   Stage 1 — Native splash (app.json)         ← OS-level, instant
 *   Stage 2 — SplashScreen.jsx                 ← animated logo + card shuffle
 *   Stage 3 — Real screen stack (this file)    ← based on auth state
 *
 * SplashScreen shows until BOTH conditions are true:
 *   1. Animation complete (splashDone)
 *   2. Auth state resolved (authReady)
 * This means auth loads in parallel — no extra wait time.
 */
import React, { useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

import SplashScreen          from '../screens/SplashScreen';
import HomeScreen            from '../screens/HomeScreen';
import LoginScreen           from '../screens/LoginScreen';
import ForgotPasswordScreen  from '../screens/ForgotPasswordScreen';
import SignupScreen          from '../screens/SignupScreen';
import ProfileSetupScreen    from '../screens/ProfileSetupScreen';
import LevelSelectScreen     from '../screens/LevelSelectScreen';
import GameScreen            from '../screens/GameScreen';
import MultiplayerGameScreen from '../screens/MultiplayerGameScreen';
import FaceOffScreen         from '../screens/FaceOffScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import LevelProgressScreen   from '../screens/LevelProgressScreen';
import EditProfileScreen     from '../screens/EditProfileScreen';
import TermsScreen           from '../screens/TermsScreen';
import TutorialScreen        from '../screens/TutorialScreen';
import SettingsScreen        from '../screens/SettingsScreen';
import AchievementsScreen    from '../screens/AchievementsScreen';
import LeaderboardScreen     from '../screens/LeaderboardScreen';
import DailyChallengeScreen  from '../screens/DailyChallengeScreen';
import { WinScreen, LoseScreen, DrawScreen } from '../screens/ResultScreens';

import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background.dark },
};

const AppNavigator = () => {
  const { user, profile, loading } = useAuth();

  // splashDone: true once SplashScreen animation finishes
  const [splashDone, setSplashDone] = useState(false);

  // authReady: true once Supabase session + profile are both resolved
  const authReady = !loading && !(user && profile === undefined);

  // Show SplashScreen until BOTH animation done AND auth resolved
  const showSplash = !splashDone || !authReady;

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // ── Stage 2: Animated splash screen ───────────────────────────
  if (showSplash) {
    return (
      <Stack.Navigator screenOptions={{ ...screenOptions, animation: 'none' }}>
        <Stack.Screen name="Splash">
          {() => <SplashScreen onFinish={handleSplashFinish} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // ── Stage 3: Route based on auth state ────────────────────────

  // Not logged in — auth stack only
  if (!user) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="LoginScreen"    component={LoginScreen} />
        <Stack.Screen name="SignupScreen"   component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    );
  }

  // Terms not accepted
  if (!profile?.terms_accepted) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="TermsScreen" component={TermsScreen} />
      </Stack.Navigator>
    );
  }

  // No username yet — profile setup
  if (!profile?.username) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    );
  }

  // Fully onboarded — ALL screens registered.
  // initialRouteName drives where the user lands.
  // Because ALL screens are always registered:
  //   navigation.replace('Home'), navigate('Tutorial') etc. always work.
  const initialRoute = profile.tutorial_completed === false ? 'Tutorial' : 'Home';

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Home"                  component={HomeScreen} />
      <Stack.Screen name="Tutorial"              component={TutorialScreen} />
      <Stack.Screen name="LevelSelect"           component={LevelSelectScreen} />
      <Stack.Screen name="GameScreen"            component={GameScreen} />
      <Stack.Screen name="MultiplayerGameScreen" component={MultiplayerGameScreen} />
      <Stack.Screen name="FaceOff"               component={FaceOffScreen} />
      <Stack.Screen name="WinScreen"             component={WinScreen} />
      <Stack.Screen name="LoseScreen"            component={LoseScreen} />
      <Stack.Screen name="DrawScreen"            component={DrawScreen} />
      <Stack.Screen name="Profile"               component={ProfileScreen} />
      <Stack.Screen name="LevelProgress"         component={LevelProgressScreen} />
      <Stack.Screen name="EditProfile"           component={EditProfileScreen} />
      <Stack.Screen name="SettingsScreen"        component={SettingsScreen} />
      <Stack.Screen name="Achievements"          component={AchievementsScreen} />
      <Stack.Screen name="Leaderboard"           component={LeaderboardScreen} />
      <Stack.Screen name="DailyChallenge"        component={DailyChallengeScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
