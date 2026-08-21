// components/OnlineUsersPanel.tsx
"use client";
import { useState, useEffect } from 'react';

interface OnlineUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  last_seen_at: string;
  seconds_ago: number;
}

export function OnlineUsersPanel() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/e-checksheet-ga/api/users/online');
        const data = await response.json();
        if (data.success) {
          setOnlineUsers(data.data.users);
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (seconds: number) => {
    if (seconds < 30) return 'bg-green-500';
    if (seconds < 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatLastSeen = (seconds: number) => {
    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
    return `${Math.floor(seconds / 3600)} jam yang lalu`;
  };

  return (
    <div className="online-users-panel">
      <div className="panel-header">
        <h3 className="panel-title">🟢 User Online</h3>
        <span className="online-count">{onlineUsers.length}</span>
      </div>
      
      {loading ? (
        <div className="loading-state">Memuat...</div>
      ) : onlineUsers.length === 0 ? (
        <div className="empty-state">Tidak ada user online</div>
      ) : (
        <div className="users-list">
          {onlineUsers.map((user) => (
            <div key={user.id} className="user-item">
              <div className={`status-dot ${getStatusColor(user.seconds_ago)}`}></div>
              <div className="user-info">
                <div className="user-name">{user.full_name}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <div className="user-last-seen">
                {formatLastSeen(user.seconds_ago)}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .online-users-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 16px;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .online-count {
          background: #10b981;
          color: white;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .loading-state,
        .empty-state {
          text-align: center;
          padding: 24px;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .user-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .user-item:hover {
          background: #f1f5f9;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: capitalize;
        }
        .user-last-seen {
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}