import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/api';
import { FaHistory, FaClock } from 'react-icons/fa';
import './AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await getAuditLogs();
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('SUCCESS') || action.includes('ADDED') || action.includes('ACTIVATED')) {
      return 'success';
    }
    if (action.includes('FAIL') || action.includes('DEACTIVATED')) {
      return 'warning';
    }
    return 'info';
  };

  if (loading) {
    return (
      <div className="audit-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-container">
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Track all system activities and changes</p>
        </div>
      </div>

      <div className="logs-container">
        {logs.map((log) => (
          <div key={log.id} className="log-item">
            <div className={`log-indicator ${getActionColor(log.action)}`}></div>
            <div className="log-content">
              <div className="log-header">
                <span className="log-user">{log.username}</span>
                <span className={`log-action ${getActionColor(log.action)}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="log-time">
                <FaClock />
                <span>{log.readable_time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="empty-state">
          <FaHistory />
          <p>No audit logs found</p>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;