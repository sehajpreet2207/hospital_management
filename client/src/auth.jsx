import { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { user, doctor, patient }
  const [loading, setLoading] = useState(!!getToken());

  const loadMe = async () => {
    try {
      setSession(await api.get('/auth/me'));
    } catch {
      setToken(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) loadMe();
  }, []);

  const login = async (email, password) => {
    const { token } = await api.post('/auth/login', { email, password });
    setToken(token);
    await loadMe();
  };

  const register = async (form) => {
    const { token } = await api.post('/auth/register', form);
    setToken(token);
    await loadMe();
  };

  const logout = () => {
    setToken(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ ...session, session, loading, login, register, logout, reload: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
