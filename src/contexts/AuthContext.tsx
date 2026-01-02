import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/school';

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: 'settings' | 'delete' | 'add_student' | 'receive_payment' | 'view_reports') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['settings', 'delete', 'add_student', 'receive_payment', 'view_reports'],
  bursar: ['add_student', 'receive_payment', 'view_reports'],
  staff: ['add_student', 'receive_payment', 'view_reports'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      return (data?.role as UserRole) || 'staff';
    } catch {
      return 'staff';
    }
  }, []);

  // Update auth user state
  const updateAuthUser = useCallback(async (supabaseUser: User | null, currentSession: Session | null) => {
    if (!supabaseUser) {
      setUser(null);
      setSession(null);
      return;
    }

    setSession(currentSession);
    
    // Defer Supabase call to prevent deadlock
    setTimeout(async () => {
      const role = await fetchUserRole(supabaseUser.id);
      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'user',
        role,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email,
      });
    }, 0);
  }, [fetchUserRole]);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer to prevent deadlock
          setTimeout(async () => {
            const role = await fetchUserRole(currentSession.user.id);
            setUser({
              id: currentSession.user.id,
              username: currentSession.user.email?.split('@')[0] || 'user',
              role,
              name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
              email: currentSession.user.email,
            });
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        updateAuthUser(existingSession.user, existingSession);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole, updateAuthUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      return !!data.session;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please login instead.' };
        }
        return { success: false, error: error.message };
      }

      return { success: !!data.session || !!data.user };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user,
        isLoading,
        login,
        signup,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}