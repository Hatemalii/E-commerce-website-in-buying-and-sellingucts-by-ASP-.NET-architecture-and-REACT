import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { IconUser, IconLogOut } from './icons';

const Navbar = () => {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ 
      height: 'var(--header-height)', 
      backgroundColor: 'var(--surface-color)', 
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container flex justify-between items-center" style={{ height: '100%' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
          VendorHub
        </Link>

        <nav className="flex items-center gap-md">
          {/* Public / Customer Links */}
          {(!isAdmin && !isVendor) && (
            <>
              <Link to="/" style={{ fontWeight: 500 }}>Shop</Link>
              {user && <Link to="/favorites" style={{ fontWeight: 500 }}>Favorites</Link>}
              {user && <Link to="/orders" style={{ fontWeight: 500 }}>My Orders</Link>}
            </>
          )}

          {/* Vendor Links */}
          {isVendor && (
            <>
              <Link to="/vendor" style={{ fontWeight: 500 }}>Dashboard</Link>
              <Link to="/vendor/properties" style={{ fontWeight: 500 }}>My Products</Link>
              <Link to="/vendor/sales" style={{ fontWeight: 500 }}>Sales History</Link>
              <Link to="/vendor/analytics" style={{ fontWeight: 500 }}>Analytics</Link>
            </>
          )}

          {/* Admin Links */}
          {isAdmin && (
            <>
              <Link to="/admin" style={{ fontWeight: 500 }}>Dashboard</Link>
              <Link to="/admin/permissions" style={{ fontWeight: 500 }}>Permissions</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-md">
          {user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-sm" style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconUser className="text-secondary" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.fullName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem', marginLeft: '0.5rem' }} title="Logout">
                  <IconLogOut />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
