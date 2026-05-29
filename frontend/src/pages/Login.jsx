import React, { useState } from 'react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
    const uppercaseRegex = /[A-Z]/;

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else {
      const len = formData.password.length;
      if (len < 8 || len > 16) {
        newErrors.password = 'Password must be between 8 and 16 characters.';
      } else if (!uppercaseRegex.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter.';
      } else if (!specialCharRegex.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character.';
      }
    }

    if (!isLoginTab) {
      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required.';
      } else {
        const len = formData.name.trim().length;
        if (len < 20 || len > 60) {
          newErrors.name = `Name must be between 20 and 60 characters (currently: ${len}).`;
        }
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required.';
      } else if (formData.address.trim().length > 400) {
        newErrors.address = 'Address cannot exceed 400 characters.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLoginTab) {
        // Sign In API call
        const response = await api.login(formData.email, formData.password);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        // Sign Up API call
        const response = await api.signup(
          formData.name,
          formData.email,
          formData.address,
          formData.password,
          formData.role
        );
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onLoginSuccess(response.user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.errors) {
        // Map backend express-validator errors back to input fields
        const backendErrors = {};
        err.errors.forEach(e => {
          backendErrors[e.field] = e.message;
        });
        setErrors(backendErrors);
      } else {
        setServerError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (isLogin) => {
    setIsLoginTab(isLogin);
    setErrors({});
    setServerError('');
    setFormData({
      name: '',
      email: '',
      address: '',
      password: '',
      role: 'user'
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1 className="auth-title">Welcome</h1>
          <p className="auth-subtitle">
            {isLoginTab 
              ? 'Sign in to access your dashboard' 
              : 'Create a new account on the platform'}
          </p>
        </div>

        <div className="auth-tabs">
          <div 
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabSwitch(true)}
          >
            Sign In
          </div>
          <div 
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabSwitch(false)}
          >
            Sign Up
          </div>
        </div>

        {serverError && (
          <div className="alert-banner alert-error">
            <span>⚠️</span> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginTab && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="role">Sign Up As</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="user">Normal User (Reviewer)</option>
                  <option value="store_owner">Store Owner (Business)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  {formData.role === 'store_owner' ? 'Store / Business Name' : 'Full Name'}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Must be 20 to 60 characters long"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
                <span className="form-helper">Requires min 20 characters</span>
                {errors.name && <div className="form-error-msg">{errors.name}</div>}
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="text"
              placeholder="e.g. name@domain.com"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
            {errors.email && <div className="form-error-msg">{errors.email}</div>}
          </div>

          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label" htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter your complete address (max 400 characters)"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                style={{ resize: 'vertical', minHeight: '80px' }}
                disabled={loading}
              />
              {errors.address && <div className="form-error-msg">{errors.address}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your secure password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
            <span className="form-helper">8-16 chars, 1 uppercase, 1 special character</span>
            {errors.password && <div className="form-error-msg">{errors.password}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading 
              ? 'Processing...' 
              : (isLoginTab ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
