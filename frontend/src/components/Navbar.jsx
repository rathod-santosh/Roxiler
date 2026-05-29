import React from 'react';

export default function Navbar({ user, onLogout }) {
  if (!user) return null;

  // Format role label
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'store_owner':
        return 'Store Owner';
      default:
        return 'Normal User';
    }
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <span>★</span> StoreRating
      </div>
      <div className="nav-user">
        <div className="user-profile">
          <span className="profile-name">{user.name}</span>
          <span className={`profile-role ${user.role}`}>
            {getRoleLabel(user.role)}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}
