import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../api/apiService';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (productId) => {
    if (!user) return false;
    
    const isFav = favorites.some(f => f.productId === productId);
    try {
      if (isFav) {
        await apiService.removeFavorite(productId);
        setFavorites(prev => prev.filter(f => f.productId !== productId));
      } else {
        const response = await apiService.addFavorite(productId);
        setFavorites(prev => [...prev, response.data]);
      }
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  const isProductFavorite = (productId) => {
    return favorites.some(f => f.productId === productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isProductFavorite, fetchFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};
