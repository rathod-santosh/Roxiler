import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import StarRating from '../components/StarRating';
import SortableTable from '../components/SortableTable';

export default function StoreDashboard() {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' or 'settings'
  const [dashboardData, setDashboardData] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratings: []
  });

  // Table Sort State
  const [sort, setSort] = useState({ field: 'date', order: 'desc' });

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordServerError, setPasswordServerError] = useState('');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const fetchDashboardData = async () => {
    try {
      const params = {
        sortField: sort.field,
        sortOrder: sort.order
      };
      const res = await api.store.getDashboard(params);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching store dashboard data:', err);
      showAlert('error', 'Failed to retrieve your feedback log.');
    }
  };

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchDashboardData();
    }
  }, [activeTab, sort]);

  // Alert Utility
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const handleSortChange = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPasswordServerError('');
    setPasswordSuccess('');
  };

  // Validate Password Update
  const validatePasswordForm = () => {
    const errors = {};
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
    const uppercaseRegex = /[A-Z]/;

    if (!passwordForm.oldPassword) {
      errors.oldPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required.';
    } else {
      const len = passwordForm.newPassword.length;
      if (len < 8 || len > 16) {
        errors.newPassword = 'New password must be between 8 and 16 characters.';
      } else if (!uppercaseRegex.test(passwordForm.newPassword)) {
        errors.newPassword = 'New password must contain at least one uppercase letter.';
      } else if (!specialCharRegex.test(passwordForm.newPassword)) {
        errors.newPassword = 'New password must contain at least one special character.';
      } else if (passwordForm.newPassword === passwordForm.oldPassword) {
        errors.newPassword = 'New password cannot be the same as your old password.';
      }
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Password Update Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordServerError('');
    setPasswordSuccess('');

    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      await api.updatePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Password change error:', err);
      if (err.errors) {
        const backendErrors = {};
        err.errors.forEach(e => {
          backendErrors[e.field] = e.message;
        });
        setPasswordErrors(backendErrors);
      } else {
        setPasswordServerError(err.message || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ratingsHeaders = [
    { key: 'name', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'address', label: 'User Address', sortable: false },
    { key: 'rating', label: 'Rating Submitted', sortable: true },
    { key: 'date', label: 'Submission Date', sortable: true }
  ];

  return (
    <div className="dashboard-content">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`alert-banner alert-${alert.type}`}>
          <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
          {alert.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab-item ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          My Store Feedback
        </div>
        <div 
          className={`dashboard-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Store Settings
        </div>
      </div>

      {activeTab === 'feedback' && (
        <>
          {/* Average Rating Block */}
          <div className="metrics-grid">
            <div className="metric-card glass-panel stores" style={{ gridColumn: 'span 2', padding: '2rem' }}>
              <div className="metric-icon" style={{ fontSize: '2.5rem' }}>⭐</div>
              <div className="metric-details">
                <span className="metric-label" style={{ fontSize: '0.9rem' }}>Overall Store Rating</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <span className="metric-value" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {Number(dashboardData.averageRating).toFixed(1)}
                  </span>
                  <div>
                    <StarRating value={dashboardData.averageRating} />
                    <p style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                      Based on {dashboardData.totalRatings} user reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback log listing */}
          <div className="glass-panel section-card">
            <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>
              Detailed Reviews Log
            </h2>

            <SortableTable
              headers={ratingsHeaders}
              data={dashboardData.ratings}
              sortField={sort.field}
              sortOrder={sort.order}
              onSort={handleSortChange}
              noDataMessage="No customer feedback reviews submitted for your store yet."
              renderRow={(row) => (
                <>
                  <td style={{ fontWeight: 600 }}>{row.userName}</td>
                  <td>{row.userEmail}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-secondary)' }}>{row.userAddress}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--accent-amber)', marginRight: '6px' }}>★ {row.rating}</span>
                    <span style={{ color: 'var(--color-secondary)', fontSize: '0.8rem' }}>/5</span>
                  </td>
                  <td>{new Date(row.date).toLocaleString()}</td>
                </>
              )}
            />
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="glass-panel settings-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Update Security Password
          </h2>

          {passwordSuccess && (
            <div className="alert-banner alert-success">
              <span>✅</span> {passwordSuccess}
            </div>
          )}

          {passwordServerError && (
            <div className="alert-banner alert-error">
              <span>⚠️</span> {passwordServerError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="oldPassword">Current Password</label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={loading}
              />
              {passwordErrors.oldPassword && <div className="form-error-msg">{passwordErrors.oldPassword}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={loading}
              />
              <span className="form-helper">8-16 chars, 1 uppercase, 1 special character</span>
              {passwordErrors.newPassword && <div className="form-error-msg">{passwordErrors.newPassword}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={loading}
              />
              {passwordErrors.confirmPassword && <div className="form-error-msg">{passwordErrors.confirmPassword}</div>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
