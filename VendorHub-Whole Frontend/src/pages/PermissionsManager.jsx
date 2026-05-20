import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';

const PermissionsManager = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getVendorPermissions();
      setVendors(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor permissions.');
    } finally {
      setLoading(false);
    }
  };

  const updateVendorPermission = (vendorId, permKey, value) => {
    setVendors(current => current.map(vendor => (
      vendor.id === vendorId
        ? {
            ...vendor,
            permissions: {
              ...vendor.permissions,
              [permKey]: value
            }
          }
        : vendor
    )));
  };

  const togglePermission = async (vendorId, permKey) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const nextValue = !vendor.permissions[permKey];
    const updateKey = `${vendorId}-${permKey}`;

    setUpdating(current => ({ ...current, [updateKey]: true }));
    setError('');
    updateVendorPermission(vendorId, permKey, nextValue);

    try {
      if (nextValue) {
        await apiService.grantPermission(vendorId, permKey);
      } else {
        await apiService.revokePermission(vendorId, permKey);
      }
    } catch (err) {
      updateVendorPermission(vendorId, permKey, !nextValue);
      setError(err.response?.data?.message || 'Failed to update permission.');
    } finally {
      setUpdating(current => {
        const next = { ...current };
        delete next[updateKey];
        return next;
      });
    }
  };

  if (loading) return <div className="empty-state">Loading permissions...</div>;

  return (
    <div>
      <h1 className="mb-lg">Permissions Manager</h1>
      <p className="text-secondary mb-lg">Manage feature access for approved vendors.</p>
      {error && <div className="alert alert-error mb-md">{error}</div>}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Vendor</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Can Post Products</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Can View Analytics</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Can Manage Stock</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">No approved vendors found.</td>
              </tr>
            ) : (
              vendors.map(vendor => (
                <tr key={vendor.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{vendor.storeName || vendor.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{vendor.name} • {vendor.email}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Toggle 
                      checked={vendor.permissions.CanPostProducts} 
                      disabled={updating[`${vendor.id}-CanPostProducts`]}
                      onChange={() => togglePermission(vendor.id, 'CanPostProducts')} 
                    />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Toggle 
                      checked={vendor.permissions.CanViewAnalytics} 
                      disabled={updating[`${vendor.id}-CanViewAnalytics`]}
                      onChange={() => togglePermission(vendor.id, 'CanViewAnalytics')} 
                    />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Toggle 
                      checked={vendor.permissions.CanManageStock} 
                      disabled={updating[`${vendor.id}-CanManageStock`]}
                      onChange={() => togglePermission(vendor.id, 'CanManageStock')} 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Simple pure CSS Toggle Switch component
const Toggle = ({ checked, disabled, onChange }) => (
  <label style={{ 
    display: 'inline-flex', 
    alignItems: 'center', 
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    width: '44px',
    height: '24px',
    opacity: disabled ? 0.65 : 1
  }}>
    <input 
      type="checkbox" 
      checked={checked} 
      disabled={disabled}
      onChange={onChange} 
      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
    />
    <span style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: checked ? 'var(--primary)' : 'var(--secondary)',
      borderRadius: '24px',
      transition: '0.4s',
      opacity: checked ? 1 : 0.5
    }}></span>
    <span style={{
      position: 'absolute',
      height: '18px',
      width: '18px',
      left: checked ? '22px' : '3px',
      bottom: '3px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transition: '0.4s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }}></span>
  </label>
);

export default PermissionsManager;
