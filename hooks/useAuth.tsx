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
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
        if (profileData) {
           if (profileData.is_banned) {
            toast.error(`Your account has been banned. Reason: ${profileData.ban_reason || 'No reason provided.'}`, { duration: 8000 });
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setIsDev(false);
            setLoading(false);
            return;
          }
          setProfile(profileData);
          setIsDev(profileData.username === 'devadmin' || currentUser.email === 'ryansh818@gmail.com');
        } else {
          setIsDev(currentUser.email === 'ryansh818@gmail.com');
        }
      }
      setLoading(false);
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        setLoading(true);
        const { data: profileData } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
        if (profileData) {
          if (profileData.is_banned) {
            toast.error(`Your account has been banned. Reason: ${profileData.ban_reason || 'No reason provided.'}`, { duration: 8000 });
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setIsDev(false);
            setLoading(false);
            return;
          }
          setProfile(profileData);
          setIsDev(profileData.username === 'devadmin' || currentUser.email === 'ryansh818@gmail.com');
        } else {
          setProfile(null);
          setIsDev(currentUser.email === 'ryansh818@gmail.com');
        }
      } else {
        setProfile(null);
        setIsDev(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsDev(false);
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