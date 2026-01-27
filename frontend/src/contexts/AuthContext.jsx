import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async userId => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
      setError(null);
    } catch (err) {
      console.warn('Supabase direct profile fetch failed, trying /api/me', err);
      try {
        const res = await api.get('/me');
        setProfile(res.data);
        setError(null);
      } catch (apiErr) {
        console.error('Failed to fetch profile', apiErr);
        setError('Falha ao carregar perfil');
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      isAdmin: profile?.role === 'admin',
      isClient: profile?.role === 'client',
      signIn,
      signOut,
    }),
    [user, profile, loading, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
