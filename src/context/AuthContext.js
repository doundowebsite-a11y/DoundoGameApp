import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useMemo, useRef
} from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  // Ref so callbacks can read latest user without being re-created on every user change
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(error || !data ? null : data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userRef.current?.id) await fetchProfile(userRef.current.id);
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes — SKIP token refreshes
    // TOKEN_REFRESHED fires every ~1 hour and on every app resume.
    // It does NOT mean the user changed. Reacting to it calls setUser +
    // setProfile which re-renders AuthContext → AppNavigator rebuilds the
    // navigation stack → ProfileSetupScreen unmounts → TextInput loses focus.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

        const u = session?.user ?? null;
        setUser(u);
        userRef.current = u;
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      // Always clear local state even if supabase call fails
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Memoize value — prevents re-rendering all consumers when AuthProvider
  // re-renders for any reason unrelated to these values changing
  const value = useMemo(() => ({
    user, profile, loading, refreshProfile, signOut
  }), [user, profile, loading, refreshProfile, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
