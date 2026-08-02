import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/chat';

const API_BASE = 'http://localhost:4000/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  allUsers: User[];
  login: (credential: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { username: string; email: string; phone: string; name: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
  fetchUsers: (query?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pulse_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Verify JWT session on initial load
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setCurrentUser(data);
        } else {
          logout();
        }
      })
      .catch(() => logout());
  }, [token]);

  // Search users from real DB
  const fetchUsers = async (query = '') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAllUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Real API Register
  const register = async (data: { username: string; email: string; phone: string; name: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error || 'Registration failed.' };
      }

      localStorage.setItem('pulse_token', result.token);
      setToken(result.token);
      setCurrentUser(result.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Could not connect to real backend server.' };
    }
  };

  // Real API Login
  const login = async (credential: string, pass: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, password: pass })
      });
      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error || 'Invalid credentials.' };
      }

      localStorage.setItem('pulse_token', result.token);
      setToken(result.token);
      setCurrentUser(result.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Could not connect to real backend server.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('pulse_token');
    setToken(null);
    setCurrentUser(null);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, ...updatedData });
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, allUsers, login, register, logout, updateProfile, fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
