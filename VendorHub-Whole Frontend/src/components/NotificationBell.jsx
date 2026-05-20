import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { IconBell } from './icons';

const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="btn btn-outline" 
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              fontSize: '0.7rem',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="card" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: '0.5rem', 
            width: '320px', 
            zIndex: 50,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <div className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
          </div>
          <div style={{ padding: '0.5rem' }}>
            {notifications.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem 1rem' }}>No notifications</p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.05)',
                    borderRadius: 'var(--border-radius-sm)',
                    marginBottom: '0.25rem'
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{notif.message}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{notif.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
