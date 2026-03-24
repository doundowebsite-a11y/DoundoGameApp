import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    // Set null if no row exists — navigator will show TermsScreen
    setProfile(error || !data ? null : data);
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    // 1. Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Listen for sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // State cleared by onAuthStateChange listener
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
