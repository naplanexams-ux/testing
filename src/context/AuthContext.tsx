import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const role = authUser.email === 'naplanexams@gmail.com' ? 'admin' : 'user';
          const newUser = {
            id: authUser.id,
            username: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'Anonymous',
            email: authUser.email || '',
            avatar: authUser.user_metadata.avatar_url || '',
            role: role,
            cash_balance: 1000,
          };
          
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();
            
          if (!createError) {
            setUser(mapSupabaseUser(createdUser));
          }
        }
      } else if (data) {
        // Auto-promote admin
        if (data.email === 'naplanexams@gmail.com' && data.role !== 'admin') {
          await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
          data.role = 'admin';
        }
        setUser(mapSupabaseUser(data));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapSupabaseUser = (data: any): User => ({
    id: data.id,
    username: data.username,
    email: data.email,
    avatar: data.avatar,
    role: data.role,
    cashBalance: data.cash_balance,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });

  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
