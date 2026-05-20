import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Customer',
    storeName: '',
    storeDescription: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All core fields are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.role === 'Vendor' && (!formData.storeName || !formData.storeDescription)) {
      setError('Store Name and Description are required for Vendors.');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'Vendor' && { storeName: formData.storeName, storeDescription: formData.storeDescription })
      });
      
      // Redirect based on role
      if (formData.role === 'Vendor') navigate('/vendor');
      else navigate('/');
    } catch (err) {
      setError(err || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }} className="card">
      <div style={{ padding: '2rem' }}>
        <h2 className="text-center mb-md">Create an Account</h2>
        {error && <div className="mb-md p-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">I want to register as a:</label>
            <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>

          {formData.role === 'Vendor' && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input type="text" name="storeName" className="form-control" value={formData.storeName} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Store Description</label>
                <textarea name="storeDescription" className="form-control" rows="2" value={formData.storeDescription} onChange={handleChange}></textarea>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-sm" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center mt-md" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
