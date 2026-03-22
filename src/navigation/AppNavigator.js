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
  contentStyle: { backgroundColor: colors.background.dark },
  animation: 'slide_from_right',
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

  // Determine which flow to render
  const getFlow = () => {
    if (!user) return 'auth';
    if (profile === null || !profile.terms_accepted) return 'terms';
    if (!profile.username) return 'setup';
    return 'main';
  };

  const flow = getFlow();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {flow === 'auth' && (
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />
          </>
        )}
        {flow === 'terms' && (
          <>
            <Stack.Screen name="TermsScreen" component={TermsScreen} />
          </>
        )}
        {flow === 'setup' && (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        )}
        {flow === 'main' && (
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
