import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Validate the cached token against the server — catches deleted
        // users, revoked tokens, and expired sessions that localStorage
        // still considers valid.
        const { data: { user: verified }, error } = await supabase.auth.getUser();

        if (error || !verified) {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(verified);

        // Save the user's local timezone if not already set
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', verified.id)
            .maybeSingle();

          if (!profile?.timezone || profile.timezone === 'UTC') {
            await supabase
              .from('profiles')
              .update({ timezone: tz })
              .eq('id', verified.id);
          }
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
