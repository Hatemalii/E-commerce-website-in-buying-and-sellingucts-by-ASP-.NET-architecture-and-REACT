import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSignalR } from '../hooks/useSignalR';
import apiService from '../api/apiService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { connection } = useSignalR(token);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from DB on login
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const response = await apiService.getNotifications();
          const mapped = response.data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            time: new Date(n.createdAt).toLocaleString(),
            read: n.isRead,
            relatedEntityId: n.relatedEntityId
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.filter(n => !n.read).length);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
  }, [user]);

  // Listen for real-time notifications via SignalR
  useEffect(() => {
    if (connection) {
      connection.on('ReceiveNotification', (notification) => {
        const newNotif = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          time: "Just now",
          read: false,
          relatedEntityId: notification.relatedEntityId
        };
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Listen for product approval broadcast (for Home page refresh)
      connection.on('ProductApproved', (product) => {
        // Dispatch custom event so any page can listen
        window.dispatchEvent(new CustomEvent('productApproved', { detail: product }));
      });
    }
    return () => {
      if (connection) {
        connection.off('ReceiveNotification');
        connection.off('ProductApproved');
      }
    };
  }, [connection]);

  // Mark all as read when bell is opened — simple approach
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await apiService.markAllAsRead();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [unreadCount]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
