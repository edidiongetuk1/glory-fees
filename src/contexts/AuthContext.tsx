import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/school';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: 'settings' | 'delete' | 'add_student' | 'receive_payment' | 'view_reports') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      role: 'super_admin',
      name: 'Principal Adebayo',
    },
  },
  bursar: {
    password: 'bursar123',
    user: {
      id: '2',
      username: 'bursar',
      role: 'bursar',
      name: 'Mrs. Okonkwo',
    },
  },
  staff: {
    password: 'staff123',
    user: {
      id: '3',
      username: 'staff',
      role: 'staff',
      name: 'Mr. Ibrahim',
    },
  },
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['settings', 'delete', 'add_student', 'receive_payment', 'view_reports'],
  bursar: ['add_student', 'receive_payment', 'view_reports'],
  staff: ['add_student', 'receive_payment', 'view_reports'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[username.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
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
