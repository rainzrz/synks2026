import React, { useState, useEffect } from 'react';
import './StatusMonitoring.css';

const API_BASE_URL = 'http://localhost:8000';

const StatusMonitoring = ({ token, currentUsername, isAdmin }) => {
  const [linkStatuses, setLinkStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter, setFilter] = useState('all'); // all, online, offline, warning

  // Safety check for props
  if (!token || !currentUsername) {
    return (
      <div className="status-monitoring">
        <div className="empty-status">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Authentication Error</h3>
          <p>Missing authentication data. Please log in again.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchStatuses();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStatuses();
      }, 60000); // Refresh every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, currentUsername, isAdmin]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin
        ? '/api/status/links'
        : `/api/status/links/${currentUsername}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLinkStatuses(data.links || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pingLink = async (linkId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status/ping/${linkId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the specific link status
        setLinkStatuses(prev => prev.map(link =>
          link.id === linkId ? { ...link, ...data } : link
        ));
      }
    } catch (err) {
      console.error('Ping error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#00ff88';
      case 'offline': return '#E31E24';
      case 'warning': return '#FFA500';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'offline':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  const filteredLinks = linkStatuses.filter(link => {
    if (filter === 'all') return true;
    return link.status === filter;
  });

  // Group links by product and environment
  const groupedLinks = filteredLinks.reduce((groups, link) => {
    const productKey = link.product || 'Uncategorized';
    const envKey = link.environment || 'Default';

    if (!groups[productKey]) {
      groups[productKey] = {};
    }
    if (!groups[productKey][envKey]) {
      groups[productKey][envKey] = [];
    }
    groups[productKey][envKey].push(link);

    return groups;
  }, {});

  const statusCounts = {
    online: linkStatuses.filter(l => l.status === 'online').length,
    offline: linkStatuses.filter(l => l.status === 'offline').length,
    warning: linkStatuses.filter(l => l.status === 'warning').length,
    total: linkStatuses.length
  };

  const uptime = linkStatuses.length > 0
    ? ((statusCounts.online / linkStatuses.length) * 100).toFixed(1)
    : 0;

  if (loading && linkStatuses.length === 0) {
    return (
      <div className="status-loading">
        <div className="spinner-large"></div>
        <p>Checking link statuses...</p>
      </div>
    );
  }

  return (
    <div className="status-monitoring">
      {/* Header */}
      <div className="status-header">
        <div className="header-content">
          <h1 className="status-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Link Status Monitoring
          </h1>
          <p className="status-subtitle">Real-time health checks and uptime tracking</p>
        </div>

        <div className="status-controls">
          <div className="auto-refresh-toggle">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label htmlFor="auto-refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 0 3.51 15"/>
              </svg>
              Auto-refresh
            </label>
          </div>

          <button className="refresh-all-btn" onClick={fetchStatuses} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 0 3.51 15"/>
            </svg>
            Refresh All
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="status-stats-grid">
        <div className="status-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Online</p>
            <h2 className="stat-value">{statusCounts.online}</h2>
          </div>
        </div>

        <div className="status-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #E31E24, #b01118)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Offline</p>
            <h2 className="stat-value">{statusCounts.offline}</h2>
          </div>
        </div>

        <div className="status-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #FFA500, #cc8400)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Warning</p>
            <h2 className="stat-value">{statusCounts.warning}</h2>
          </div>
        </div>

        <div className="status-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #0066CC, #004c99)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Uptime</p>
            <h2 className="stat-value">{uptime}%</h2>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="status-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Links ({statusCounts.total})
        </button>
        <button
          className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
          onClick={() => setFilter('online')}
        >
          Online ({statusCounts.online})
        </button>
        <button
          className={`filter-btn ${filter === 'offline' ? 'active' : ''}`}
          onClick={() => setFilter('offline')}
        >
          Offline ({statusCounts.offline})
        </button>
        <button
          className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
          onClick={() => setFilter('warning')}
        >
          Warning ({statusCounts.warning})
        </button>
      </div>

      {/* Links Status List - Grouped by Product/Environment */}
      <div className="status-list">
        {Object.keys(groupedLinks).length === 0 ? (
          <div className="empty-status">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <h3>No links found</h3>
            <p>No links matching the selected filter</p>
          </div>
        ) : (
          Object.entries(groupedLinks).map(([product, environments]) => (
            <div key={product} className="status-group">
              <div className="group-header">
                <h2 className="group-title">{product}</h2>
              </div>

              {Object.entries(environments).map(([environment, links]) => (
                <div key={`${product}-${environment}`} className="environment-section">
                  <h3 className="environment-title">{environment}</h3>

                  {links.map((link, idx) => (
                    <div key={`${link.id}-${idx}`} className="status-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="status-indicator" style={{ background: getStatusColor(link.status) }}>
                        <div className="status-pulse" style={{ background: getStatusColor(link.status) }}></div>
                      </div>

                      <div className="status-info">
                        <div className="status-main">
                          <h3 className="link-name">{link.name || link.url}</h3>
                          <span className="status-badge" style={{ color: getStatusColor(link.status) }}>
                            {getStatusIcon(link.status)}
                            {link.status}
                          </span>
                        </div>

                        <div className="status-details">
                          <span className="status-url">{link.url}</span>
                          <div className="status-metrics">
                            <span className="metric">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                              {link.responseTime || '--'}ms
                            </span>
                            <span className="metric">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                                <polyline points="17 6 23 6 23 12"/>
                              </svg>
                              {link.uptime || '--'}% uptime
                            </span>
                            <span className="metric">
                              Last checked: {link.lastChecked ? new Date(link.lastChecked).toLocaleTimeString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button className="ping-btn" onClick={() => pingLink(link.id)} title="Ping now">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="2"/>
                          <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default StatusMonitoring;
