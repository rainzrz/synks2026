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
  const [mintUrl, setMintUrl] = useState('http://mint.systemhaus.com.br:9070');

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchDashboard(savedToken);
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
          mint_url: mintUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();
      setToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem('auth_token', data.token);
      
      // Fetch dashboard after login
      await fetchDashboard(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (authToken) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
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
    localStorage.removeItem('auth_token');
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
        console.log('Cache clear failed:', err);
      }
      
      // Then fetch dashboard
      fetchDashboard(token);
    }
  };

  const openLink = (url) => {
    window.open(url, '_blank');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>🔐 Customer Portal</h1>
            <p>Access your systems dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="mintUrl">Mint URL</label>
              <input
                type="text"
                id="mintUrl"
                value={mintUrl}
                onChange={(e) => setMintUrl(e.target.value)}
                placeholder="http://mint.systemhaus.com.br:9070"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 Customer Dashboard</h1>
          <div className="header-actions">
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
        {loading && <div className="loading">Loading...</div>}

        {error && <div className="error-message">{error}</div>}

        {dashboardData && (
          <div className="dashboard-content">
            <div className="dashboard-info">
              <p>Last updated: {new Date(dashboardData.last_updated).toLocaleString()}</p>
            </div>

            {dashboardData.groups.map((group, groupIndex) => (
              <div key={groupIndex} className="product-group">
                <div className="group-header">
                  <h2>{group.product}</h2>
                  {group.environment && (
                    <span className="environment-badge">{group.environment}</span>
                  )}
                </div>

                <div className="links-grid">
                  {group.links.map((link, linkIndex) => (
                    <button
                      key={linkIndex}
                      className="link-card"
                      onClick={() => openLink(link.url)}
                    >
                      <span className="link-icon">🔗</span>
                      <span className="link-name">{link.name}</span>
                      <span className="link-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {dashboardData.groups.length === 0 && (
              <div className="empty-state">
                <p>No links found. Please check your wiki configuration.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;