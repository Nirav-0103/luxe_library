import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getWishlistAPI, toggleWishlistAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lib_token'));
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      fetchWishlist();
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await getWishlistAPI();
      setWishlist(res.data.data);
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

  const toggleWishlistItem = async (bookId) => {
    try {
      const res = await toggleWishlistAPI({ bookId });
      if (res.data.success) {
        setWishlist(res.data.data);
        return { success: true, isAdded: res.data.isAdded, message: res.data.message };
      }
      return { success: false };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error toggling wishlist' };
    }
  };

  const login = (userData, tok) => {
    localStorage.setItem('lib_token', tok);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('lib_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setWishlist([]);
  };

  const updateUser = (userData) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, wishlist, toggleWishlistItem, isAdmin: user?.role === 'admin', isStaff: ['admin', 'librarian'].includes(user?.role) }}>
      {children}
    </AuthContext.Provider>
  );
};
