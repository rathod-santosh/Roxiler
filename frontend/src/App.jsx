import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import StoreDashboard from './pages/StoreDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const validRoles = ['admin', 'user', 'store_owner'];
        if (parsedUser && validRoles.includes(parsedUser.role)) {
          setUser(parsedUser);
        } else {
          // Stale or invalid user role, clear session
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-gradient)',
        color: 'var(--color-primary)',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        Initializing StoreRating Platform...
      </div>
    );
  }

  // If not logged in, show Login screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in: Render role-appropriate dashboards
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'store_owner':
        return <StoreDashboard />;
      case 'user':
        return <UserDashboard />;
      default:
        return (
          <div className="dashboard-content">
            <div className="glass-panel alert-banner alert-error" style={{ margin: '2rem auto', maxWidth: '600px' }}>
              An error occurred: Unauthorized user role ({user.role}) detected. Please log out and sign in with a valid account.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderDashboard()}
      </main>
    </div>
  );
}
