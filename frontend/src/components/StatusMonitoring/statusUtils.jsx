import React from 'react';

/**
 * Get color for status
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'online': return '#00ff88';
    case 'offline': return '#E31E24';
    case 'warning': return '#FFA500';
    default: return 'rgba(255, 255, 255, 0.3)';
  }
};

/**
 * Get icon for status
 */
export const getStatusIcon = (status) => {
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

/**
 * Group links by product and environment
 */
export const groupLinksByProductAndEnv = (links) => {
  return links.reduce((groups, link) => {
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
};

/**
 * Calculate status counts
 */
export const calculateStatusCounts = (links) => {
  return {
    online: links.filter(l => l.status === 'online').length,
    offline: links.filter(l => l.status === 'offline').length,
    warning: links.filter(l => l.status === 'warning').length,
    total: links.length
  };
};

/**
 * Calculate uptime percentage
 */
export const calculateUptime = (links) => {
  if (links.length === 0) return 0;
  const onlineCount = links.filter(l => l.status === 'online').length;
  return ((onlineCount / links.length) * 100).toFixed(1);
};
