import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndWallet = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const [userRes, walletRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/wallet')
      ]);

      if (userRes.status === 'fulfilled' && userRes.value.data?.success) {
        setUser(userRes.value.data.data);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }

      if (walletRes.status === 'fulfilled' && walletRes.value.data?.success) {
        setWallet(walletRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndWallet();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        await refreshWallet();
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: userData };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        await refreshWallet();
        toast.success('Account created successfully!');
        return { success: true, user: userData };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setWallet(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshWallet = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data?.success) {
        setWallet(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching wallet:', e);
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.patch('/auth/profile', data);
      if (res.data?.success) {
        setUser((prev) => ({ ...prev, ...res.data.data }));
        toast.success('Profile updated');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        loading,
        login,
        register,
        logout,
        refreshWallet,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
