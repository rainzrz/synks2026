import React, { useState, useEffect } from 'react';
import './StatusMonitoring.css';
import StatusHeader from './StatusHeader';
import StatusStats from './StatusStats';
import StatusFilters from './StatusFilters';
import StatusItem from './StatusItem';
import { groupLinksByProductAndEnv, calculateStatusCounts, calculateUptime } from './statusUtils.jsx';
import { api } from '../../utils/api';

const StatusMonitoring = ({ token, currentUsername, isAdmin }) => {
  const [linkStatuses, setLinkStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

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
      const data = isAdmin
        ? await api.getAllLinkStatuses(token)
        : await api.getUserLinkStatuses(token, currentUsername);

      setLinkStatuses(data.links || []);
      setLastUpdate(new Date());
    } catch (err) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const pingLink = async (linkId) => {
    try {
      const data = await api.pingLink(token, linkId);
      // Update the specific link status
      setLinkStatuses(prev => prev.map(link =>
        link.id === linkId ? { ...link, ...data } : link
      ));
    } catch (err) {
      // Error handled silently
    }
  };

  // Toggle group expansion
  const toggleGroup = (productKey, envKey) => {
    const key = `${productKey}-${envKey}`;
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate status counts for an environment
  const getEnvStatusCounts = (links) => calculateStatusCounts(links);

  // Filter links
  const filteredLinks = linkStatuses.filter(link => {
    if (filter === 'all') return true;
    return link.status === filter;
  });

  // Group links
  const groupedLinks = groupLinksByProductAndEnv(filteredLinks);
  const statusCounts = calculateStatusCounts(linkStatuses);
  const uptime = calculateUptime(linkStatuses);

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
      <StatusHeader
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={fetchStatuses}
        loading={loading}
      />

      <StatusStats statusCounts={statusCounts} uptime={uptime} />

      <StatusFilters
        filter={filter}
        onFilterChange={setFilter}
        statusCounts={statusCounts}
      />

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

              {Object.entries(environments).map(([environment, links]) => {
                const groupKey = `${product}-${environment}`;
                const isExpanded = expandedGroups[groupKey];
                const envCounts = getEnvStatusCounts(links);

                return (
                  <div key={groupKey} className="environment-section">
                    <div
                      className="environment-header"
                      onClick={() => toggleGroup(product, environment)}
                    >
                      <div className="env-title-wrapper">
                        <svg
                          className="collapse-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <h3 className="environment-title">{environment}</h3>
                      </div>

                      <div className="env-status-indicators">
                        {envCounts.online > 0 && (
                          <span className="env-badge online">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {envCounts.online}
                          </span>
                        )}
                        {envCounts.offline > 0 && (
                          <span className="env-badge offline">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            {envCounts.offline}
                          </span>
                        )}
                        {envCounts.warning > 0 && (
                          <span className="env-badge warning">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            </svg>
                            {envCounts.warning}
                          </span>
                        )}
                        <span className="env-total">{envCounts.total} links</span>
                      </div>
                    </div>

                    {isExpanded && links.map((link, idx) => (
                      <StatusItem
                        key={`${link.id}-${idx}`}
                        link={link}
                        idx={idx}
                        onPing={pingLink}
                      />
                    ))}
                  </div>
                );
              })}
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
