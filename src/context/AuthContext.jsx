import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// OAuth configurations for fitness providers
const STRAVA_CONFIG = {
  clientId: import.meta.env.VITE_STRAVA_CLIENT_ID,
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/strava/callback` : '',
  scope: 'read,activity:read_all,profile:read_all'
};

const GARMIN_CONFIG = {
  clientId: import.meta.env.VITE_GARMIN_CLIENT_ID,
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/garmin/callback` : '',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState({
    strava: false,
    garmin: false
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Check for connected fitness providers
      if (session?.user) {
        checkConnectedProviders(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkConnectedProviders(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check which fitness providers are connected
  const checkConnectedProviders = async (userId) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (data?.data?.connectedProviders) {
        setConnectedProviders(data.data.connectedProviders);
      }
    } catch (err) {
      console.error('Error checking connected providers:', err);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return { error: { message: 'Authentication not configured. Please check your Supabase credentials.' } };
    }

    try {
      const redirectUrl = window.location.origin;
      console.log('OAuth redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err);
      return {
        data: null,
        error: {
          message: err.message || 'Failed to initiate Google sign-in. Please try again.'
        }
      };
    }
  };

  // Apple Sign In (native Supabase support)
  const signInWithApple = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured.' } };
    }

    try {
      const redirectUrl = window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        console.error('Apple OAuth error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error during Apple sign-in:', err);
      return {
        data: null,
        error: { message: err.message || 'Failed to initiate Apple sign-in.' }
      };
    }
  };

  // Strava OAuth (for fitness data - not primary auth)
  const connectStrava = async () => {
    if (!STRAVA_CONFIG.clientId) {
      return { error: { message: 'Strava not configured. Add VITE_STRAVA_CLIENT_ID to your environment.' } };
    }

    const state = crypto.randomUUID();
    localStorage.setItem('strava_oauth_state', state);

    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', STRAVA_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', STRAVA_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', STRAVA_CONFIG.scope);
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
    return { data: { redirecting: true }, error: null };
  };

  // Handle Strava callback
  const handleStravaCallback = async (code, state) => {
    const savedState = localStorage.getItem('strava_oauth_state');
    if (state !== savedState) {
      return { error: { message: 'Invalid state parameter. Please try again.' } };
    }
    localStorage.removeItem('strava_oauth_state');

    try {
      // Exchange code for token via our API
      const response = await fetch('/api/auth/strava/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange Strava token');
      }

      const data = await response.json();

      // Save Strava connection to profile
      if (user && isSupabaseConfigured()) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('data')
          .eq('user_id', user.id)
          .single();

        const updatedData = {
          ...profile?.data,
          connectedProviders: {
            ...profile?.data?.connectedProviders,
            strava: true
          },
          stravaAthleteId: data.athlete?.id
        };

        await supabase
          .from('profiles')
          .update({ data: updatedData })
          .eq('user_id', user.id);

        setConnectedProviders(prev => ({ ...prev, strava: true }));
      }

      return { data, error: null };
    } catch (err) {
      console.error('Strava callback error:', err);
      return { error: { message: err.message } };
    }
  };

  // Garmin OAuth (for fitness data)
  const connectGarmin = async () => {
    if (!GARMIN_CONFIG.clientId) {
      return { error: { message: 'Garmin not configured. Add VITE_GARMIN_CLIENT_ID to your environment.' } };
    }

    const state = crypto.randomUUID();
    localStorage.setItem('garmin_oauth_state', state);

    // Garmin uses OAuth 1.0a, which requires a server-side flow
    // Redirect to our API endpoint that handles the OAuth flow
    window.location.href = `/api/auth/garmin/authorize?state=${state}`;
    return { data: { redirecting: true }, error: null };
  };

  // Handle Garmin callback
  const handleGarminCallback = async (oauthToken, oauthVerifier, state) => {
    const savedState = localStorage.getItem('garmin_oauth_state');
    if (state !== savedState) {
      return { error: { message: 'Invalid state parameter. Please try again.' } };
    }
    localStorage.removeItem('garmin_oauth_state');

    try {
      const response = await fetch('/api/auth/garmin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oauthToken, oauthVerifier })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange Garmin token');
      }

      const data = await response.json();

      // Save Garmin connection to profile
      if (user && isSupabaseConfigured()) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('data')
          .eq('user_id', user.id)
          .single();

        const updatedData = {
          ...profile?.data,
          connectedProviders: {
            ...profile?.data?.connectedProviders,
            garmin: true
          }
        };

        await supabase
          .from('profiles')
          .update({ data: updatedData })
          .eq('user_id', user.id);

        setConnectedProviders(prev => ({ ...prev, garmin: true }));
      }

      return { data, error: null };
    } catch (err) {
      console.error('Garmin callback error:', err);
      return { error: { message: err.message } };
    }
  };

  // Disconnect a fitness provider
  const disconnectProvider = async (provider) => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('data')
        .eq('user_id', user.id)
        .single();

      const updatedData = {
        ...profile?.data,
        connectedProviders: {
          ...profile?.data?.connectedProviders,
          [provider]: false
        }
      };

      // Remove provider-specific data
      if (provider === 'strava') {
        delete updatedData.stravaAthleteId;
      }

      await supabase
        .from('profiles')
        .update({ data: updatedData })
        .eq('user_id', user.id);

      setConnectedProviders(prev => ({ ...prev, [provider]: false }));

      return { error: null };
    } catch (err) {
      console.error('Error disconnecting provider:', err);
      return { error: { message: err.message } };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setConnectedProviders({ strava: false, garmin: false });
    }
    return { error };
  };

  const value = {
    user,
    loading,
    // Primary auth methods
    signInWithGoogle,
    signInWithApple,
    signOut,
    // Fitness provider connections
    connectStrava,
    connectGarmin,
    handleStravaCallback,
    handleGarminCallback,
    disconnectProvider,
    connectedProviders,
    // Status
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
