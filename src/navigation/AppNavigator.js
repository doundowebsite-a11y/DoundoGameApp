import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import LevelSelectScreen from '../screens/LevelSelectScreen';
import GameScreen from '../screens/GameScreen';
import FaceOffScreen from '../screens/FaceOffScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import TermsScreen from '../screens/TermsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { WinScreen, LoseScreen, DrawScreen } from '../screens/ResultScreens';

import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: {
    backgroundColor: colors.background.dark,
  },
};

const AppNavigator = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.dark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // --- Unauthenticated ---
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />
          </>
        ) : profile === null ? (
          // --- User exists but Profile does not (New user / trigger delay) ---
          <Stack.Screen name="TermsScreen" component={TermsScreen} />
        ) : !profile.terms_accepted ? (
          // --- Profile exists but Terms not accepted ---
          <Stack.Screen name="TermsScreen" component={TermsScreen} />
        ) : !profile.username ? (
          // --- Profile exists but Gamer Tag/Avatar not set ---
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          // --- Fully Authenticated and Setup ---
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
            <Stack.Screen name="GameScreen" component={GameScreen} />
            <Stack.Screen name="FaceOff" component={FaceOffScreen} />
            <Stack.Screen name="WinScreen" component={WinScreen} />
            <Stack.Screen name="LoseScreen" component={LoseScreen} />
            <Stack.Screen name="DrawScreen" component={DrawScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
