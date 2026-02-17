import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tempToken, setTempToken] = useState(localStorage.getItem('tempToken'));
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(
    localStorage.getItem('requiresPasswordChange') === 'true'
  );
  const [loading, setLoading] = useState(true);

  // Helper function to update user state and persist to localStorage
  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

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
      updateUserState(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentNumber, password) => {
    try {
      const response = await authService.login(studentNumber, password);

      if (response.data.requiresPasswordChange) {
        // First login - require password change but still authenticate
        setToken(response.data.token);
        setTempToken(response.data.tempToken || response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tempToken', response.data.tempToken || response.data.token);
        localStorage.setItem('requiresPasswordChange', 'true');
        updateUserState(response.data.user);
        setRequiresPasswordChange(true);
        return { success: true, requiresPasswordChange: true };
      } else {
        // Normal login
        setToken(response.data.token);
        updateUserState(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('requiresPasswordChange', 'false');
        setRequiresPasswordChange(false);
        return { success: true, requiresPasswordChange: false };
      }
    } catch (error) {
      // Handle 403 error with requiresPasswordChange (first login)
      if (error.response?.status === 403 && error.response?.data?.requiresPasswordChange) {
        setToken(error.response?.data?.tempToken);
        setTempToken(error.response?.data?.tempToken);
        localStorage.setItem('token', error.response?.data?.tempToken);
        localStorage.setItem('tempToken', error.response?.data?.tempToken);
        localStorage.setItem('requiresPasswordChange', 'true');
        updateUserState(error.response?.data?.user);
        setRequiresPasswordChange(true);
        return { success: true, requiresPasswordChange: true };
      }
      throw error;
    }
  };

  const changePassword = async (newPassword, confirmPassword) => {
    try {
      const response = await authService.changePassword(newPassword, confirmPassword);
      setToken(response.data.token);
      updateUserState(response.data.user);
      localStorage.setItem('token', response.data.token);
      localStorage.removeItem('tempToken');
      localStorage.removeItem('requiresPasswordChange');
      setTempToken(null);
      setRequiresPasswordChange(false);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    updateUserState(null);
    setToken(null);
    setTempToken(null);
    setRequiresPasswordChange(false);
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('requiresPasswordChange');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    setUser: updateUserState,
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
