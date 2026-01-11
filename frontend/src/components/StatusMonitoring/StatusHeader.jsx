import React from 'react';

const StatusHeader = ({ autoRefresh, onAutoRefreshChange, onRefresh, loading }) => {
  return (
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
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
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

        <button className="refresh-all-btn" onClick={onRefresh} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/>
            <polyline points="23 20 23 14 17 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 0 3.51 15"/>
          </svg>
          Refresh All
        </button>
      </div>
    </div>
  );
};

export default StatusHeader;
