import React, { useState, useEffect } from 'react';
import AdminTable from './AdminTable';
import './AdminDashboard.css';

const API_BASE_URL = 'http://localhost:8000';

const AdminDashboard = ({ token, currentUsername, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      // API returns {users: [...]} so extract the array
      if (data && data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        // Fallback: if API returns array directly
        setUsers(data);
      } else {
        console.error('[AdminDashboard] API returned invalid format:', data);
        setUsers([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (username) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/dashboard/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
      setSelectedUser(username);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(`Error loading ${username}'s dashboard: ${err.message}`);
      setDashboardData(null);
    }
  };

  const handleDeleteUser = async (usernameToDelete) => {
    if (!confirm(`Are you sure you want to delete user "${usernameToDelete}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${usernameToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await fetchUsers();

      if (selectedUser === usernameToDelete) {
        setDashboardData(null);
        setSelectedUser(null);
      }
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleViewDashboard = async (username) => {
    await fetchDashboard(username);
  };

  const handleClearCache = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (selectedUser) {
        await fetchDashboard(selectedUser);
      }
    } catch (err) {
      console.error('Cache clear failed:', err);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-logo">synks</h1>
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="header-right">
          <span className="user-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {currentUsername}
          </span>
          <button className="header-btn" onClick={handleClearCache} title="Clear Cache">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>
          <button className="header-btn logout" onClick={onLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="admin-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="admin-section">
              <AdminTable
                users={users}
                onDeleteUser={handleDeleteUser}
                onViewDashboard={handleViewDashboard}
                API_BASE_URL={API_BASE_URL}
                token={token}
              />
            </div>

            {/* Dashboard Preview */}
            {dashboardData && (
              <div className="dashboard-preview-section">
                <div className="preview-header">
                  <h2>Dashboard: {selectedUser}</h2>
                  <div className="preview-controls">
                    <input
                      type="text"
                      placeholder="Search in dashboard..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input-small"
                    />
                    <button className="close-preview" onClick={() => {
                      setDashboardData(null);
                      setSelectedUser(null);
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <Dashboard data={dashboardData} searchTerm={searchTerm} />
              </div>
            )}

            {error && (
              <div className="error-banner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Dashboard Component
function Dashboard({ data, searchTerm }) {
  const filteredGroups = data.groups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.product.toLowerCase().includes(searchLower) ||
      group.environment.toLowerCase().includes(searchLower) ||
      group.links.some(link =>
        link.text.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower)
      )
    );
  });

  if (filteredGroups.length === 0) {
    return (
      <div className="empty-dashboard">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <p>No links found matching "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {filteredGroups.map((group, idx) => (
        <div key={idx} className="dashboard-card">
          <div className="card-header">
            <h3 className="card-product">{group.product}</h3>
            <span className="card-env">{group.environment}</span>
          </div>
          <div className="card-links">
            {group.links.map((link, linkIdx) => (
              <a
                key={linkIdx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard-link"
              >
                <span className="link-text">{link.text}</span>
                <svg className="link-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
