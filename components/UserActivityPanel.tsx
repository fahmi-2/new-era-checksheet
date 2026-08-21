// components/UserActivityPanel.tsx
"use client";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Activity {
  id: string;
  activity_type: string;
  activity_category: string;
  description: string;
  page_url: string;
  form_slug: string;
  created_at: string;
  device_type: string;
  browser_name: string;
}

interface UserActivityPanelProps {
  userId: string;
  limit?: number;
}

export function UserActivityPanel({ userId, limit = 20 }: UserActivityPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/e-checksheet-ga/e-checksheet-ga/api/activities/user/${userId}?limit=${limit}`);
        const data = await response.json();
        if (data.success) {
          setActivities(data.data.activities);
          setSummary(data.data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchActivities();
    }
  }, [userId, limit]);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      login: '🔐',
      logout: '🚪',
      view_page: '👁️',
      form_submitted: '✅',
      form_edited: '✏️',
      form_deleted: '🗑️',
      file_uploaded: '📤',
      heartbeat: '💓',
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-100 text-blue-800',
      form: 'bg-green-100 text-green-800',
      navigation: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      data: 'bg-amber-100 text-amber-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="activity-panel-loading">
        <div className="spinner"></div>
        <p>Memuat aktivitas...</p>
      </div>
    );
  }

  return (
    <div className="user-activity-panel">
      <div className="activity-summary">
        <h3 className="panel-title">📊 Ringkasan Aktivitas</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-value">{summary.total_activities || 0}</div>
            <div className="summary-label">Total</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.today_activities || 0}</div>
            <div className="summary-label">Hari Ini</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.week_activities || 0}</div>
            <div className="summary-label">Minggu Ini</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.month_activities || 0}</div>
            <div className="summary-label">Bulan Ini</div>
          </div>
        </div>
      </div>

      <div className="activity-list">
        <h3 className="panel-title">📜 Aktivitas Terbaru</h3>
        {activities.length === 0 ? (
          <div className="empty-state">Belum ada aktivitas</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.activity_type)}</div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className={`activity-badge ${getActivityColor(activity.activity_category)}`}>
                    {activity.activity_type}
                  </span>
                  <span className="activity-time">
                    {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </span>
                </div>
                {activity.description && (
                  <div className="activity-description">{activity.description}</div>
                )}
                <div className="activity-meta">
                  {activity.page_url && (
                    <span className="meta-item">📍 {activity.page_url}</span>
                  )}
                  {activity.form_slug && (
                    <span className="meta-item">📋 {activity.form_slug}</span>
                  )}
                  {activity.device_type && (
                    <span className="meta-item">📱 {activity.device_type}</span>
                  )}
                  {activity.browser_name && (
                    <span className="meta-item">🌐 {activity.browser_name}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .user-activity-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 20px;
        }
        .activity-panel-loading {
          text-align: center;
          padding: 40px 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #1976d2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .panel-title {
          margin: 0 0 16px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .activity-summary {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .summary-card {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1976d2;
          margin-bottom: 4px;
        }
        .summary-label {
          font-size: 0.8rem;
          color: #64748b;
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .activity-item:hover {
          background: #f1f5f9;
        }
        .activity-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .activity-content {
          flex: 1;
          min-width: 0;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .activity-badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .activity-time {
          font-size: 0.8rem;
          color: #64748b;
        }
        .activity-description {
          font-size: 0.9rem;
          color: #334155;
          margin-bottom: 6px;
        }
        .activity-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .empty-state {
          text-align: center;
          padding: 32px 20px;
          color: #94a3b8;
          font-size: 0.95rem;
        }
        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .activity-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .activity-meta {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}