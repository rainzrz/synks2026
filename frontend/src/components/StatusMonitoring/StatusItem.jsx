import React from 'react';
import { getStatusColor, getStatusIcon } from './statusUtils.jsx';

const StatusItem = ({ link, idx, onPing }) => {
  return (
    <div className="status-item" style={{ animationDelay: `${idx * 0.05}s` }}>
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

      <button className="ping-btn" onClick={() => onPing(link.id)} title="Ping now">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
        </svg>
      </button>
    </div>
  );
};

export default StatusItem;
