import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tempToken, setTempToken] = useState(localStorage.getItem('tempToken'));
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.data.requiresPasswordChange) {
        // First login - require password change
        setTempToken(response.data.tempToken);
        localStorage.setItem('tempToken', response.data.tempToken);
        setUser(response.data.user);
        setRequiresPasswordChange(true);
        return { success: true, requiresPasswordChange: true };
      } else {
        // Normal login
        setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        setRequiresPasswordChange(false);
        return { success: true, requiresPasswordChange: false };
      }
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (newPassword, confirmPassword) => {
    try {
      const response = await authService.changePassword(newPassword, confirmPassword);
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      localStorage.removeItem('tempToken');
      setTempToken(null);
      setRequiresPasswordChange(false);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTempToken(null);
    setRequiresPasswordChange(false);
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
  };

  const value = {
    user,
    token,
    tempToken,
    requiresPasswordChange,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
