import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../api/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore auth state on refresh
    const storedToken = localStorage.getItem('jwtToken');
    const storedUser = localStorage.getItem('userData');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.login({ email, password });
      const { token, user } = response.data;
      handleAuthSuccess(user, token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data?.message || 'Invalid email or password';
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      // Registration in this backend doesn't return a token immediately for Vendors (need approval)
      // but for Customers/Admins we might want to log in or just show success.
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const handleAuthSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userData');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'Admin',
    isVendor: user?.role === 'Vendor',
    isCustomer: user?.role === 'Customer' || !user // Treat unauthenticated as customer for browsing?
  };

  // Wait for initial load to avoid flashing protected routes
  if (isLoading) {
    return <div className="flex items-center justify-center w-full" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
