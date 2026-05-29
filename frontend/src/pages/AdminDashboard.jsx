import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import StarRating from '../components/StarRating';
import SortableTable from '../components/SortableTable';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  // Statistics State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
    totalAdmins: 0
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'users'

  // Listings States
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);

  // Sorting States
  const [storeSort, setStoreSort] = useState({ field: 'name', order: 'asc' });
  const [userSort, setUserSort] = useState({ field: 'name', order: 'asc' });

  // Filtering States (Stores)
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  // Filtering States (Users)
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '' });

  // Modal States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'user' // 'user', 'admin', 'store_owner'
  });
  const [formErrors, setFormErrors] = useState({});
  const [formServerError, setFormServerError] = useState('');

  // User Details Modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // General States
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Fetch Dashboard Statistics
  const fetchStats = async () => {
    try {
      const res = await api.admin.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // Fetch Stores list
  const fetchStores = async () => {
    try {
      const params = {
        name: storeFilters.name,
        email: storeFilters.email,
        address: storeFilters.address,
        sortField: storeSort.field,
        sortOrder: storeSort.order
      };
      const res = await api.admin.getStores(params);
      setStores(res.data);
    } catch (err) {
      console.error('Stores fetch error:', err);
      showAlert('error', 'Failed to fetch stores directory.');
    }
  };

  // Fetch Users list
  const fetchUsers = async () => {
    try {
      const params = {
        name: userFilters.name,
        email: userFilters.email,
        address: userFilters.address,
        role: userFilters.role,
        sortField: userSort.field,
        sortOrder: userSort.order
      };
      const res = await api.admin.getUsers(params);
      setUsers(res.data);
    } catch (err) {
      console.error('Users fetch error:', err);
      showAlert('error', 'Failed to fetch users directory.');
    }
  };

  // Trigger data loading
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    } else {
      fetchUsers();
    }
  }, [activeTab, storeFilters, userFilters, storeSort, userSort]);

  // Alert Utility
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  // Handle Sort
  const handleStoreSort = (field) => {
    setStoreSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUserSort = (field) => {
    setUserSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle Input Filters
  const handleStoreFilterChange = (e) => {
    const { name, value } = e.target;
    setStoreFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleUserFilterChange = (e) => {
    const { name, value } = e.target;
    setUserFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle Add User Form Input Change
  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setFormServerError('');
  };

  // Validate form details
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
    const uppercaseRegex = /[A-Z]/;

    if (!addUserForm.name.trim()) {
      errors.name = 'Name is required.';
    } else {
      const len = addUserForm.name.trim().length;
      if (len < 20 || len > 60) {
        errors.name = `Name must be 20 to 60 characters long (currently: ${len}).`;
      }
    }

    if (!addUserForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(addUserForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!addUserForm.address.trim()) {
      errors.address = 'Address is required.';
    } else if (addUserForm.address.trim().length > 400) {
      errors.address = 'Address cannot exceed 400 characters.';
    }

    if (!addUserForm.password) {
      errors.password = 'Password is required.';
    } else {
      const len = addUserForm.password.length;
      if (len < 8 || len > 16) {
        errors.password = 'Password must be between 8 and 16 characters.';
      } else if (!uppercaseRegex.test(addUserForm.password)) {
        errors.password = 'Password must contain at least one uppercase letter.';
      } else if (!specialCharRegex.test(addUserForm.password)) {
        errors.password = 'Password must contain at least one special character.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add User Form
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormServerError('');

    if (!validateForm()) return;

    try {
      await api.admin.addUser(addUserForm);
      showAlert('success', `${addUserForm.role === 'store_owner' ? 'Store' : 'User'} created successfully!`);
      setIsAddUserOpen(false);
      // Reset form
      setAddUserForm({
        name: '',
        email: '',
        address: '',
        password: '',
        role: 'user'
      });
      // Refresh statistics and active list
      fetchStats();
      if (addUserForm.role === 'store_owner') {
        fetchStores();
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      if (err.errors) {
        const backendErrors = {};
        err.errors.forEach(e => {
          backendErrors[e.field] = e.message;
        });
        setFormErrors(backendErrors);
      } else {
        setFormServerError(err.message || 'Failed to create account.');
      }
    }
  };

  // Open Details Modal
  const handleViewDetails = async (userId) => {
    setSelectedUserId(userId);
    setUserDetails(null);
    setLoadingDetails(true);
    try {
      const res = await api.admin.getUserDetails(userId);
      setUserDetails(res.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      showAlert('error', 'Failed to retrieve profile details.');
      setSelectedUserId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Table structures
  const storeHeaders = [
    { key: 'name', label: 'Store Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'rating', label: 'Average Rating', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const userHeaders = [
    { key: 'name', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
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

      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>System Overview</h1>
          <p>Manage users, registered store businesses, and explore feedback ratings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddUserOpen(true)}>
          + Add Account / Store
        </button>
      </div>

      {/* Metrics Widgets */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel users">
          <div className="metric-icon">👤</div>
          <div className="metric-details">
            <span className="metric-label">Normal Users</span>
            <span className="metric-value">{stats.totalUsers}</span>
          </div>
        </div>
        <div className="metric-card glass-panel stores">
          <div className="metric-icon">🏪</div>
          <div className="metric-details">
            <span className="metric-label">Registered Stores</span>
            <span className="metric-value">{stats.totalStores}</span>
          </div>
        </div>
        <div className="metric-card glass-panel ratings">
          <div className="metric-icon">⭐</div>
          <div className="metric-details">
            <span className="metric-label">Submitted Ratings</span>
            <span className="metric-value">{stats.totalRatings}</span>
          </div>
        </div>
        <div className="metric-card glass-panel admins" style={{ borderLeft: '4px solid #a5b4fc' }}>
          <div className="metric-icon">🛡️</div>
          <div className="metric-details">
            <span className="metric-label">Administrators</span>
            <span className="metric-value">{stats.totalAdmins}</span>
          </div>
        </div>
      </div>

      {/* Directory Tab Navigation */}
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab-item ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          Stores Directory
        </div>
        <div 
          className={`dashboard-tab-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Admins Directory
        </div>
      </div>

      {/* Directories Data Section */}
      <div className="glass-panel section-card">
        {activeTab === 'stores' ? (
          <>
            {/* Filter Bar (Stores) */}
            <div className="filters-bar">
              <div className="filter-input-group">
                <input
                  type="text"
                  name="name"
                  value={storeFilters.name}
                  onChange={handleStoreFilterChange}
                  placeholder="Filter by Store Name..."
                  className="filter-input"
                />
              </div>
              <div className="filter-input-group">
                <input
                  type="text"
                  name="email"
                  value={storeFilters.email}
                  onChange={handleStoreFilterChange}
                  placeholder="Filter by Email..."
                  className="filter-input"
                />
              </div>
              <div className="filter-input-group">
                <input
                  type="text"
                  name="address"
                  value={storeFilters.address}
                  onChange={handleStoreFilterChange}
                  placeholder="Filter by Address..."
                  className="filter-input"
                />
              </div>
            </div>

            {/* Sortable Stores Table */}
            <SortableTable
              headers={storeHeaders}
              data={stores}
              sortField={storeSort.field}
              sortOrder={storeSort.order}
              onSort={handleStoreSort}
              noDataMessage="No stores found matching your filters."
              renderRow={(store) => (
                <>
                  <td style={{ fontWeight: 600 }}>{store.name}</td>
                  <td>{store.email}</td>
                  <td>{store.address}</td>
                  <td>
                    <StarRating value={store.rating} ratingCount={store.rating_count} />
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleViewDetails(store.id)}
                    >
                      View Details
                    </button>
                  </td>
                </>
              )}
            />
          </>
        ) : (
          <>
            {/* Filter Bar (Users) */}
            <div className="filters-bar">
              <div className="filter-input-group">
                <input
                  type="text"
                  name="name"
                  value={userFilters.name}
                  onChange={handleUserFilterChange}
                  placeholder="Filter by Name..."
                  className="filter-input"
                />
              </div>
              <div className="filter-input-group">
                <input
                  type="text"
                  name="email"
                  value={userFilters.email}
                  onChange={handleUserFilterChange}
                  placeholder="Filter by Email..."
                  className="filter-input"
                />
              </div>
              <div className="filter-input-group">
                <input
                  type="text"
                  name="address"
                  value={userFilters.address}
                  onChange={handleUserFilterChange}
                  placeholder="Filter by Address..."
                  className="filter-input"
                />
              </div>
              <div className="filter-input-group" style={{ maxWidth: '160px' }}>
                <select
                  name="role"
                  value={userFilters.role}
                  onChange={handleUserFilterChange}
                  className="filter-input"
                >
                  <option value="">All Roles</option>
                  <option value="user">Normal User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Sortable Users Table */}
            <SortableTable
              headers={userHeaders}
              data={users}
              sortField={userSort.field}
              sortOrder={userSort.order}
              onSort={handleUserSort}
              noDataMessage="No users found matching your filters."
              renderRow={(usr) => (
                <>
                  <td style={{ fontWeight: 600 }}>{usr.name}</td>
                  <td>{usr.email}</td>
                  <td>{usr.address}</td>
                  <td>
                    <span className={`profile-role ${usr.role}`}>
                      {usr.role === 'admin' ? 'Administrator' : 'Normal User'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleViewDetails(usr.id)}
                    >
                      View Details
                    </button>
                  </td>
                </>
              )}
            />
          </>
        )}
      </div>

      {/* Modal 1: Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        title="Add New Account"
        onClose={() => setIsAddUserOpen(false)}
      >
        {formServerError && (
          <div className="alert-banner alert-error">
            <span>⚠️</span> {formServerError}
          </div>
        )}

        <form onSubmit={handleAddUserSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="role">Account Role</label>
            <select
              id="role"
              name="role"
              value={addUserForm.role}
              onChange={handleFormInputChange}
              className="form-input"
            >
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner / Business</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              {addUserForm.role === 'store_owner' ? 'Store / Business Name' : 'Full Name'}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Requires 20 to 60 characters"
              value={addUserForm.name}
              onChange={handleFormInputChange}
              className="form-input"
            />
            <span className="form-helper">Must be between 20 and 60 characters</span>
            {formErrors.name && <div className="form-error-msg">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="text"
              placeholder="e.g. business@store.com"
              value={addUserForm.email}
              onChange={handleFormInputChange}
              className="form-input"
            />
            {formErrors.email && <div className="form-error-msg">{formErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              placeholder="Complete address (max 400 characters)"
              value={addUserForm.address}
              onChange={handleFormInputChange}
              className="form-input"
              style={{ resize: 'vertical', minHeight: '70px' }}
            />
            {formErrors.address && <div className="form-error-msg">{formErrors.address}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Temporary Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Choose a temporary password"
              value={addUserForm.password}
              onChange={handleFormInputChange}
              className="form-input"
            />
            <span className="form-helper">8-16 chars, 1 uppercase, 1 special character</span>
            {formErrors.password && <div className="form-error-msg">{formErrors.password}</div>}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsAddUserOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: User/Store Profile Details Modal */}
      <Modal
        isOpen={selectedUserId !== null}
        title={loadingDetails ? 'Loading Profile...' : `Account Profile details`}
        onClose={() => setSelectedUserId(null)}
      >
        {loadingDetails && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-secondary)' }}>
            Retrieving account records from database...
          </div>
        )}

        {!loadingDetails && userDetails && (
          <div style={{ fontSize: '0.92rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem 1rem', marginBottom: '1.5rem' }}>
              <strong style={{ color: 'var(--color-secondary)' }}>Name:</strong>
              <span>{userDetails.name}</span>
              
              <strong style={{ color: 'var(--color-secondary)' }}>Email:</strong>
              <span>{userDetails.email}</span>

              <strong style={{ color: 'var(--color-secondary)' }}>Address:</strong>
              <span>{userDetails.address}</span>

              <strong style={{ color: 'var(--color-secondary)' }}>Role:</strong>
              <div>
                <span className={`profile-role ${userDetails.role}`}>
                  {userDetails.role === 'admin' 
                    ? 'System Administrator' 
                    : userDetails.role === 'store_owner' 
                      ? 'Store Owner' 
                      : 'Normal User'}
                </span>
              </div>

              <strong style={{ color: 'var(--color-secondary)' }}>Created:</strong>
              <span>{new Date(userDetails.created_at).toLocaleDateString()}</span>
            </div>

            {/* Store Owner specific stats (ratings listing) */}
            {userDetails.role === 'store_owner' && userDetails.storeStats && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Customer Ratings Log</span>
                  <StarRating 
                    value={userDetails.storeStats.averageRating} 
                    ratingCount={userDetails.storeStats.totalRatings} 
                  />
                </h3>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                  <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>User</th>
                        <th style={{ padding: '6px 10px' }}>Rating</th>
                        <th style={{ padding: '6px 10px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.storeStats.ratings.length > 0 ? (
                        userDetails.storeStats.ratings.map((r, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px' }}>
                              <div>{r.user_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-secondary)' }}>{r.user_email}</div>
                            </td>
                            <td style={{ padding: '6px 10px' }}>⭐ {r.rating}/5</td>
                            <td style={{ padding: '6px 10px' }}>{new Date(r.updated_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-secondary)' }}>
                            No feedback ratings submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Normal User specific stats (submitted ratings) */}
            {userDetails.role === 'user' && userDetails.userStats && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
                  Ratings Submitted ({userDetails.userStats.totalRatingsSubmitted})
                </h3>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                  <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Store Name</th>
                        <th style={{ padding: '6px 10px' }}>Rating Given</th>
                        <th style={{ padding: '6px 10px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.userStats.ratings.length > 0 ? (
                        userDetails.userStats.ratings.map((r, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 10px' }}>
                              <div>{r.store_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-secondary)' }}>{r.store_email}</div>
                            </td>
                            <td style={{ padding: '6px 10px' }}>⭐ {r.rating}/5</td>
                            <td style={{ padding: '6px 10px' }}>{new Date(r.updated_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-secondary)' }}>
                            No store ratings submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedUserId(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
