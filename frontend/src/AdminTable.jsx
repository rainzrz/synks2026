import React, { useState, useEffect } from 'react';
import './AdminTable.css';

const AdminTable = ({ users = [], onDeleteUser, onViewDashboard, API_BASE_URL, token }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', wiki_url: '' });
  const [createError, setCreateError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    newToday: 0
  });

  useEffect(() => {
    // Calculate stats - ensure users is an array
    if (!Array.isArray(users)) {
      console.warn('[AdminTable] users prop is not an array', users);
      return;
    }

    const total = users.length;
    const admins = users.filter(u => u.is_admin).length;
    const active = users.length; // You can add logic to determine active users
    const newToday = 0; // You can add logic to count users created today

    setStats({ total, active, admins, newToday });
  }, [users]);

  // Ensure users is an array before filtering
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' ||
                        (roleFilter === 'ADMIN' && user.is_admin) ||
                        (roleFilter === 'USER' && !user.is_admin);
    return matchesSearch && matchesRole;
  }) : [];

  const getInitials = (username) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (username) => {
    const colors = [
      'linear-gradient(135deg, #E31E24, #B91C1C)',
      'linear-gradient(135deg, #0066CC, #003DA5)',
      'linear-gradient(135deg, #E31E24, #0066CC)',
      'linear-gradient(135deg, #003DA5, #E31E24)',
      'linear-gradient(135deg, #B91C1C, #0066CC)',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newUser.username || !newUser.password || !newUser.wiki_url) {
      setCreateError('All fields are required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      // Success - close modal and reset form
      setShowNewUserModal(false);
      setNewUser({ username: '', password: '', wiki_url: '' });

      // Trigger parent to refresh users list
      if (window.location.reload) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Create user error:', err);
      setCreateError(err.message);
    }
  };

  return (
    <div className="admin-table-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <span className="admin-logo">Admin Panel</span>
          <div className="system-status">
            <span className="status-dot"></span>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">TOTAL USERS</div>
          <div className="stat-value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ACTIVE</div>
          <div className="stat-value">{stats.active.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ADMINS</div>
          <div className="stat-value">{stats.admins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">NEW TODAY</div>
          <div className="stat-value">+{stats.newToday}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="table-controls">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${roleFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            ALL
          </button>
          <button
            className={`filter-tab ${roleFilter === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ADMIN')}
          >
            ADMIN
          </button>
          <button
            className={`filter-tab ${roleFilter === 'USER' ? 'active' : ''}`}
            onClick={() => setRoleFilter('USER')}
          >
            USER
          </button>
        </div>

        <button className="btn-new-user" onClick={() => setShowNewUserModal(true)}>
          <span className="btn-icon">+</span>
          NEW USER
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>LAST LOGIN</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
                <tr key={user.username} className="table-row">
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar"
                        style={{ background: getAvatarColor(user.username) }}
                      >
                        {getInitials(user.username)}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.username}</div>
                      </div>
                    </div>
                  </td>
                <td>
                  <span className={`role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                    {user.is_admin ? 'ADMIN' : 'USER'}
                  </span>
                </td>
                <td>
                  <div className="status-cell">
                    <span className="status-dot active"></span>
                    <span>Active</span>
                  </div>
                </td>
                <td className="last-login">{formatDate(user.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDashboard(user.username);
                      }}
                      title="View Dashboard"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(user.username);
                      }}
                      title="Delete User"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                    <button className="action-btn more" title="More Options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="19" cy="12" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="modal-overlay" onClick={() => setShowNewUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button className="modal-close" onClick={() => setShowNewUserModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              {createError && (
                <div className="error-message">{createError}</div>
              )}
              <div className="form-group">
                <label>GitLab Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter GitLab username"
                  required
                />
              </div>
              <div className="form-group">
                <label>GitLab Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter GitLab password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Wiki URL</label>
                <input
                  type="url"
                  value={newUser.wiki_url}
                  onChange={(e) => setNewUser({ ...newUser, wiki_url: e.target.value })}
                  placeholder="https://your-gitlab.com/project/-/wikis/home"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
