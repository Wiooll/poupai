/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Mock User type since we removed firebase
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Hardcoded local user
  const value: AuthContextType = {
    user: {
      uid: 'local-user',
      displayName: 'Usuário Local',
      email: 'local@findash.app',
      photoURL: null,
    },
    loading: false,
    signInWithGoogle: async () => {},
    logout: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
