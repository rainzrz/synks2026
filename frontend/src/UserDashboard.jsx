import React, { useState, useEffect } from 'react';
import './UserDashboard.css';

const API_BASE_URL = 'http://localhost:8000';

const UserDashboard = ({ token, currentUsername, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchDashboard();
    setTimeout(() => setIsInitialLoad(false), 100);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/dashboard/${currentUsername}`, {
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
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Clear cache first
    try {
      await fetch(`${API_BASE_URL}/api/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Cache clear failed:', err);
    }

    // Then refresh dashboard
    await fetchDashboard();
  };

  const filteredGroups = dashboardData ? dashboardData.groups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.product.toLowerCase().includes(searchLower) ||
      group.environment.toLowerCase().includes(searchLower) ||
      group.links.some(link =>
        link.text.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower)
      )
    );
  }) : [];

  return (
    <div className={`user-dashboard ${isInitialLoad ? 'animate-in' : ''}`}>
      {/* Header */}
      <header className="user-dashboard-header slide-down">
        <div className="header-left">
          <h1 className="dashboard-logo">synks <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>by Systemhaus</span></h1>
          <div className="user-welcome">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Welcome, <strong>{currentUsername}</strong></span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn refresh-btn" onClick={handleRefresh} title="Refresh Dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 03.51 15"/>
            </svg>
          </button>
          <button className="header-btn logout-btn" onClick={onLogout} title="Logout">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="user-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={handleRefresh}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="dashboard-controls fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="search-bar">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search your links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="stats-info">
                <span className="stat-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                  {filteredGroups.length} Groups
                </span>
                <span className="stat-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  {filteredGroups.reduce((total, group) => total + group.links.length, 0)} Links
                </span>
              </div>
            </div>

            {/* Dashboard Grid */}
            {filteredGroups.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <h2>No links found</h2>
                <p>Try adjusting your search term or clear the search to see all links.</p>
                {searchTerm && (
                  <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="dashboard-grid">
                {filteredGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="product-card stagger-fade"
                    style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}
                  >
                    <div className="card-header">
                      <h3 className="product-name">{group.product}</h3>
                      <span className="environment-badge">{group.environment}</span>
                    </div>
                    <div className="card-links">
                      {group.links.map((link, linkIdx) => (
                        <a
                          key={linkIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-item"
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
