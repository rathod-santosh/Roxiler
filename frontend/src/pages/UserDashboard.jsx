import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import StarRating from '../components/StarRating';
import Modal from '../components/Modal';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'settings'
  const [stores, setStores] = useState([]);
  
  // Search & Filter State
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', order: 'asc' });

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordServerError, setPasswordServerError] = useState('');

  // Rating Modal State
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    storeId: null,
    storeName: '',
    rating: 0
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const fetchStores = async () => {
    try {
      const params = {
        name: filters.name,
        address: filters.address,
        sortField: sort.field,
        sortOrder: sort.order
      };
      const res = await api.user.getStores(params);
      setStores(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
      showAlert('error', 'Failed to retrieve registered stores.');
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchStores();
    }
  }, [activeTab, filters, sort]);

  // Alert Utility
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Open Rating Form Modal
  const openRatingModal = (store) => {
    setRatingModal({
      isOpen: true,
      storeId: store.id,
      storeName: store.name,
      rating: store.userRating || 5 // Default to 5 stars or their past rating
    });
  };

  // Submit Rating to API
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.user.rateStore(ratingModal.storeId, ratingModal.rating);
      showAlert('success', `Feedback submitted for ${ratingModal.storeName}!`);
      setRatingModal({ isOpen: false, storeId: null, storeName: '', rating: 0 });
      fetchStores();
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Failed to submit rating.');
    }
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
          className={`dashboard-tab-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          Explore Registered Stores
        </div>
        <div 
          className={`dashboard-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </div>
      </div>

      {activeTab === 'explore' && (
        <>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="filter-input-group" style={{ flex: 2 }}>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Search store name..."
                className="filter-input"
              />
            </div>
            <div className="filter-input-group" style={{ flex: 2 }}>
              <input
                type="text"
                name="address"
                value={filters.address}
                onChange={handleFilterChange}
                placeholder="Search address..."
                className="filter-input"
              />
            </div>
            <div className="filter-input-group" style={{ flex: 1, minWidth: '150px' }}>
              <button 
                className={`btn btn-secondary ${sort.field === 'overallRating' ? 'btn-primary' : ''}`} 
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => handleSortChange('overallRating')}
              >
                Sort by Rating {sort.field === 'overallRating' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
              </button>
            </div>
            <div className="filter-input-group" style={{ flex: 1, minWidth: '150px' }}>
              <button 
                className={`btn btn-secondary ${sort.field === 'name' ? 'btn-primary' : ''}`} 
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => handleSortChange('name')}
              >
                Sort by Name {sort.field === 'name' ? (sort.order === 'asc' ? '↑' : '↓') : '↕'}
              </button>
            </div>
          </div>

          {/* Stores Listing Grid */}
          {stores.length > 0 ? (
            <div className="stores-grid">
              {stores.map((store) => (
                <div key={store.id} className="store-card glass-panel">
                  <div className="store-card-header">
                    <h3 className="store-name">{store.name}</h3>
                    <p className="store-address">{store.address}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary)' }}>Overall:</span>
                      <StarRating value={store.overallRating} ratingCount={store.ratingCount} />
                    </div>
                  </div>
                  
                  <div className="store-card-footer">
                    <div>
                      {store.userRating ? (
                        <span className="user-rating-badge" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#99f6e4' }}>
                          My Rating: ⭐ {store.userRating}
                        </span>
                      ) : (
                        <span className="user-rating-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-secondary)' }}>
                          Not rated yet
                        </span>
                      )}
                    </div>
                    
                    <button 
                      className={`btn ${store.userRating ? 'btn-teal' : 'btn-primary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => openRatingModal(store)}
                    >
                      {store.userRating ? 'Modify Rating' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel no-data">
              No stores found matching your search. Try adjusting your search query parameters.
            </div>
          )}
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

      {/* Rating Entry Modal */}
      <Modal
        isOpen={ratingModal.isOpen}
        title={`Submit Feedback Rating`}
        onClose={() => setRatingModal({ isOpen: false, storeId: null, storeName: '', rating: 0 })}
      >
        <form onSubmit={handleRatingSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Store business name:</p>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>{ratingModal.storeName}</h4>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-secondary)' }}>
              How would you rate your experience?
            </p>
            
            <StarRating
              interactive={true}
              value={ratingModal.rating}
              onChange={(newRating) => setRatingModal(prev => ({ ...prev, rating: newRating }))}
            />
            
            <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
              {ratingModal.rating} Star{ratingModal.rating > 1 ? 's' : ''} Selected
            </p>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setRatingModal({ isOpen: false, storeId: null, storeName: '', rating: 0 })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
