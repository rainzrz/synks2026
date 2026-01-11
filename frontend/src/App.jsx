import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    // Check if token exists in localStorage
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

      // Fetch users list if admin
      if (data.is_admin) {
        await fetchUsers(data.token);
      } else {
        // Fetch dashboard after login for non-admin
        await fetchDashboard(data.token, data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          wiki_url: wikiUrl,
          is_admin: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed.');
      }

      const data = await response.json();
      setToken(data.token);
      setIsLoggedIn(true);
      setIsAdmin(false);
      setCurrentUsername(data.username);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('is_admin', 'false');
      localStorage.setItem('current_username', data.username);

      // Fetch dashboard after registration
      await fetchDashboard(data.token, data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      setUsers(data.users.filter(u => !u.is_admin)); // Only show client users
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDashboard = async (authToken, targetUsername) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/${targetUsername}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch dashboard (${response.status})`);
      }

      const data = await response.json();
      setDashboardData(data);
      setSelectedUser(targetUsername);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setDashboardData(null);
    setIsAdmin(false);
    setUsers([]);
    setSelectedUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('current_username');
  };

  const handleRefresh = async () => {
    if (token) {
      // Clear cache first
      try {
        await fetch(`${API_BASE_URL}/api/clear-cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
      }

      // Then fetch dashboard
      if (selectedUser) {
        fetchDashboard(token, selectedUser);
      }
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

      // Refresh users list
      await fetchUsers(token);

      // Clear dashboard if deleted user was selected
      if (selectedUser === usernameToDelete) {
        setDashboardData(null);
        setSelectedUser(null);
      }
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleUpdateUser = async (userToUpdate) => {
    const newPassword = prompt('Enter new password (leave empty to keep current):');
    const newWikiUrl = prompt('Enter new Wiki URL:', userToUpdate.wiki_url);

    if (!newWikiUrl) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userToUpdate.username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userToUpdate.username,
          new_password: newPassword || undefined,
          wiki_url: newWikiUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Refresh users list
      await fetchUsers(token);
      alert('User updated successfully!');
    } catch (err) {
      alert(`Error updating user: ${err.message}`);
    }
  };

  const openLink = (url) => {
    window.open(url, '_blank');
  };

  // Filter links based on search term
  const filterGroups = (groups) => {
    if (!searchTerm) return groups;

    return groups.map(group => ({
      ...group,
      links: group.links.filter(link =>
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.links.length > 0);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>🔐 Synks</h1>
            <p>{isRegistering ? 'Create your account' : 'Access your systems dashboard'}</p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">{isRegistering ? 'Username' : 'GitLab Username'}</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegistering ? "Choose a username" : "Your GitLab username"}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{isRegistering ? 'Password' : 'GitLab Password'}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? "Choose a password" : "Your GitLab password"}
                required
              />
            </div>

            {isRegistering && (
              <div className="form-group">
                <label htmlFor="wikiUrl">Wiki URL</label>
                <input
                  type="url"
                  id="wikiUrl"
                  value={wikiUrl}
                  onChange={(e) => setWikiUrl(e.target.value)}
                  placeholder="http://mint.systemhaus.com.br:9070/document-group/customer_yourcompany/-/wikis/Customer_Links"
                  required
                />
                <small>Enter your company's wiki URL from your administrator</small>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? (isRegistering ? 'Creating account...' : 'Logging in...') : (isRegistering ? 'Register' : 'Login')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="toggle-mode-button"
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin view - show users list
  if (isAdmin && !selectedUser) {
    const filteredUsers = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.wiki_url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>📊 Synks Admin Dashboard</h1>
            <div className="header-actions">
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="admin-panel">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="clients-list">
              <h2>Clients ({filteredUsers.length})</h2>
              {filteredUsers.map(user => (
                <div key={user.username} className="client-card">
                  <div className="client-info">
                    <h3>{user.username}</h3>
                    <p className="client-url">{user.wiki_url}</p>
                    <small>Created: {new Date(user.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="client-actions">
                    <button
                      onClick={() => fetchDashboard(token, user.username)}
                      className="view-button"
                    >
                      View Dashboard
                    </button>
                    <button
                      onClick={() => handleUpdateUser(user)}
                      className="edit-button"
                    >
                      ⚙️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.username)}
                      className="delete-button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard view (both admin viewing client and regular user)
  const filteredGroups = dashboardData ? filterGroups(dashboardData.groups) : [];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 Synks Dashboard {selectedUser && `- ${selectedUser}`}</h1>
          <div className="header-actions">
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setDashboardData(null);
                  setSearchTerm('');
                }}
                className="back-button"
              >
                ← Back to Clients
              </button>
            )}
            <button onClick={handleRefresh} className="refresh-button">
              🔄 Refresh
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading && <div className="loading">Loading...</div>}

        {error && <div className="error-message">{error}</div>}

        {dashboardData && (
          <div className="dashboard-content">
            <div className="dashboard-info">
              <p>Last updated: {new Date(dashboardData.last_updated).toLocaleString()}</p>
            </div>

            <div className="products-grid">
              {filteredGroups.map((group, index) => (
                <div key={index} className="product-card">
                  <div className="product-header">
                    <h2>{group.product}</h2>
                    {group.environment && <span className="environment-badge">{group.environment}</span>}
                  </div>
                  <div className="links-list">
                    {group.links.map((link, linkIndex) => (
                      <button
                        key={linkIndex}
                        onClick={() => openLink(link.url)}
                        className="link-button"
                      >
                        <span className="link-name">{link.name}</span>
                        <span className="link-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredGroups.length === 0 && !loading && (
              <div className="no-results">
                <p>No links found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
