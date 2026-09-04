import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => {
    const cachedToken = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');
    return !cachedToken || !cachedUser;
  });

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch((err) => {
          // Only log out if explicitly 401 Unauthorized
          if (err?.status === 401) {
            logout();
          } else {
            console.warn('Background auth check:', err?.message || err);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const _saveSession = (data) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    _saveSession(data);
    return data;
  };

  const register = async (email, password, fullName) => {
    await api.register(email, password, fullName);
    return login(email, password);
  };

  const loginWithGoogle = async (credential) => {
    const data = await api.loginWithGoogle(credential);
    _saveSession(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
