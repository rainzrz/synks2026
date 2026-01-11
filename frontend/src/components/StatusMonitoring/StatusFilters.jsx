import React from 'react';

const StatusFilters = ({ filter, onFilterChange, statusCounts }) => {
  return (
    <div className="status-filters">
      <button
        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
        onClick={() => onFilterChange('all')}
      >
        All Links ({statusCounts.total})
      </button>
      <button
        className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
        onClick={() => onFilterChange('online')}
      >
        Online ({statusCounts.online})
      </button>
      <button
        className={`filter-btn ${filter === 'offline' ? 'active' : ''}`}
        onClick={() => onFilterChange('offline')}
      >
        Offline ({statusCounts.offline})
      </button>
      <button
        className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
        onClick={() => onFilterChange('warning')}
      >
        Warning ({statusCounts.warning})
      </button>
    </div>
  );
};

export default StatusFilters;
