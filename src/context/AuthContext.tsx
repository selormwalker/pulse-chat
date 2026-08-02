import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/chat';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  login: (credential: string, pass: string) => { success: boolean; error?: string };
  register: (data: { username: string; email: string; phone: string; name: string; password: string }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'user-selorm',
    username: 'selormwalker',
    email: 'juniorkwamewalker@gmail.com',
    phone: '+233 50 123 4567',
    name: 'David Selorm Walker',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    bio: 'Quantitative Systems Developer & AI Engineer'
  },
  {
    id: 'user-alexa',
    username: 'alexa_tech',
    email: 'alexa@pulse.chat',
    phone: '+1 415 889 1204',
    name: 'Alexa Vance',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    bio: 'Senior Full-Stack Architect @ Vercel'
  },
  {
    id: 'user-marcus',
    username: 'marcus_quant',
    email: 'marcus@trading.io',
    phone: '+44 20 7946 0912',
    name: 'Marcus Sterling',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    bio: 'HFT Trader & Low-latency C++ builder'
  },
  {
    id: 'user-elena',
    username: 'elena_design',
    email: 'elena@studio.design',
    phone: '+49 30 1234 5678',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    status: 'away',
    bio: 'UI/UX Glassmorphism Enthusiast'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('pulse_chat_users');
    if (stored) {
      try { return JSON.parse(stored); } catch { return INITIAL_DEMO_USERS; }
    }
    return INITIAL_DEMO_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedSession = localStorage.getItem('pulse_chat_session');
    if (storedSession) {
      try { return JSON.parse(storedSession); } catch { return INITIAL_DEMO_USERS[0]; }
    }
    return INITIAL_DEMO_USERS[0]; // Default to Selorm
  });

  useEffect(() => {
    localStorage.setItem('pulse_chat_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pulse_chat_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pulse_chat_session');
    }
  }, [currentUser]);

  // Login via Username, Email, or Phone
  const login = (credential: string, pass: string) => {
    if (!pass) return { success: false, error: 'Password is required' };
    const query = credential.toLowerCase().trim();

    const matched = allUsers.find(
      u =>
        u.username.toLowerCase() === query ||
        u.email.toLowerCase() === query ||
        u.phone.replace(/\s+/g, '') === query.replace(/\s+/g, '')
    );

    if (!matched) {
      return { success: false, error: 'User account not found with provided credentials' };
    }

    setCurrentUser({ ...matched, status: 'online' });
    return { success: true };
  };

  // Register with Username, Email, Phone Number, Name & Password
  const register = (data: { username: string; email: string; phone: string; name: string; password: string }) => {
    const { username, email, phone, name, password } = data;

    if (!username.trim()) return { success: false, error: 'Username is required' };
    if (!email.trim() || !email.includes('@')) return { success: false, error: 'Valid email address is required' };
    if (!phone.trim()) return { success: false, error: 'Phone number is required' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

    // Check duplicates
    if (allUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username is already taken' };
    }
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email address is already registered' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      name: name.trim() || username.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'online',
      bio: 'Hey there! I am using PulseChat.'
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedData };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  return (
    <AuthContext.Provider value={{ currentUser, allUsers, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
