import React, { useState, useEffect } from 'react';
import AdminTable from './AdminTable';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function AppWithNewUI() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [wikiUrl, setWikiUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedIsAdmin = localStorage.getItem('is_admin') === 'true';
    const savedUsername = localStorage.getItem('current_username');

    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      setIsAdmin(savedIsAdmin);
      setCurrentUsername(savedUsername);

      if (savedIsAdmin) {
        fetchUsers(savedToken);
      } else {
        fetchDashboard(savedToken, savedUsername);
      }
    }
  }, []);

  const fetchUsers = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchDashboard = async (authToken, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/${user}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
      setSelectedUser(user);
      setError('');
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(`Error: ${err.message}`);
      setDashboardData(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      setToken(data.token);
      setIsLoggedIn(true);
      setIsAdmin(data.is_admin);
      setCurrentUsername(data.username);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('is_admin', data.is_admin);
      localStorage.setItem('current_username', data.username);

      if (data.is_admin) {
        await fetchUsers(data.token);
      } else {
        await fetchDashboard(data.token, data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('current_username');
    setIsLoggedIn(false);
    setToken(null);
    setUsername('');
    setPassword('');
    setDashboardData(null);
    setIsAdmin(false);
    setUsers([]);
    setSelectedUser(null);
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

      await fetchUsers(token);

      if (selectedUser === usernameToDelete) {
        setDashboardData(null);
        setSelectedUser(null);
      }
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleViewDashboard = async (user) => {
    await fetchDashboard(token, user);
  };

  // Login/Register UI
  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="app-title">Synks</h1>
          <form onSubmit={isRegistering ? () => {} : handleLogin}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">GitLab Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your GitLab username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">GitLab Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your GitLab password"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard with new AdminTable
  if (isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-sidebar">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="admin-content">
          <AdminTable
            users={users}
            onDeleteUser={handleDeleteUser}
            onViewDashboard={handleViewDashboard}
            API_BASE_URL={API_BASE_URL}
            token={token}
          />

          {dashboardData && (
            <div className="dashboard-preview">
              <h3>Dashboard: {selectedUser}</h3>
              <Dashboard data={dashboardData} searchTerm={searchTerm} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // User Dashboard
  return (
    <div className="container">
      <header className="header">
        <h1>Synks</h1>
        <div className="header-actions">
          <span className="username-display">Welcome, {currentUsername}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {dashboardData ? (
        <Dashboard data={dashboardData} searchTerm={searchTerm} />
      ) : (
        <div className="loading">Loading your dashboard...</div>
      )}
    </div>
  );
}

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
    return <div className="no-results">No links found matching "{searchTerm}"</div>;
  }

  return (
    <div className="dashboard">
      {filteredGroups.map((group, idx) => (
        <div key={idx} className="product-group">
          <div className="group-header">
            <h2 className="product-name">{group.product}</h2>
            <span className="environment-badge">{group.environment}</span>
          </div>
          <div className="links-container">
            {group.links.map((link, linkIdx) => (
              <a
                key={linkIdx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-card"
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

export default AppWithNewUI;
