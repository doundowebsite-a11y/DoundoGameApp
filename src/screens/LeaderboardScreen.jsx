/**
 * LeaderboardScreen.jsx — src/screens/LeaderboardScreen.jsx
 * Logic-only component for the Global Leaderboard Screen.
 */
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import LeaderboardLayout from './layouts/LeaderboardLayout';

const LeaderboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { user } = useAuth();
  
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, score, avatar_preset')
          .order('score', { ascending: false })
          .limit(50);
          
        if (!error && data) setLeaders(data);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  return (
    <LeaderboardLayout
      {...{
        navigation, insets, containerW, leaders, loading,
        userId: user?.id
      }}
    />
  );
};

export default LeaderboardScreen;
