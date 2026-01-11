import React from 'react';

const StatusStats = ({ statusCounts, uptime }) => {
  return (
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
  );
};

export default StatusStats;
