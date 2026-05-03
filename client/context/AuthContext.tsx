'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateProfile: (data: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<User>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data.user as User;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  const updateProfile = async (data: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/profile`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to update profile');
    }

    const updatedUser = responseData.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    return updatedUser as User;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!token && !!user,
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
