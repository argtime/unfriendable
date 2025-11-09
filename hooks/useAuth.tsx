import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthContextType, UserProfile } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // onAuthStateChange fires an INITIAL_SESSION event on load, which handles
    // the initial check. This removes the need for a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        try {
          const { data: profileData, error } = await supabase.from('users').select('*').eq('id', currentUser.id).single();

          if (error) throw error;
          
          if (profileData) {
            if (profileData.is_banned) {
              toast.error(`Your account has been banned. Reason: ${profileData.ban_reason || 'No reason provided.'}`, { duration: 8000 });
              await supabase.auth.signOut();
              // No need to set state; signOut will trigger another auth event.
              return; 
            }
            setProfile(profileData);
            setIsDev(profileData.username === 'devadmin' || currentUser.email === 'ryansh818@gmail.com');
          } else {
            setProfile(null);
            setIsDev(currentUser.email === 'ryansh818@gmail.com');
          }
        } catch (e: any) {
          toast.error(`Session error: ${e.message}. Please sign in again.`);
          console.error("Auth state change error:", e);
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      } else {
        // User is null (logged out)
        setProfile(null);
        setIsDev(false);
        setLoading(false); // We are done loading.
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    await supabase.auth.signOut();
    // State clearing is handled by the onAuthStateChange listener.
  };


  const value = {
    user,
    profile,
    loading,
    isDev,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};