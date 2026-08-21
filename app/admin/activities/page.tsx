// app/admin/activities/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { UserActivityPanel } from '@/components/UserActivityPanel';
import { OnlineUsersPanel } from '@/components/OnlineUsersPanel';
import { useRouter } from 'next/navigation';

export default function AdminActivities() {
  const router = useRouter();
  const { user } = useAuth();
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/home');
      return;
    }

    const fetchAllActivities = async () => {
      try {
        const response = await fetch('/e-checksheet-ga/api/activities?limit=100');
        const data = await response.json();
        if (data.success) {
          setAllActivities(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllActivities();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header-banner">
          <h1 className="page-title">📊 Activity Dashboard</h1>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <OnlineUsersPanel />
          </div>
          <div className="dashboard-card">
            <UserActivityPanel userId={user.id} limit={10} />
          </div>
        </div>

        <div className="all-activities">
          <h2 className="section-title">📜 Semua Aktivitas System</h2>
          {loading ? (
            <div className="loading">Memuat...</div>
          ) : (
            <div className="activities-table">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Aktivitas</th>
                    <th>Deskripsi</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {allActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{new Date(activity.created_at).toLocaleString('id-ID')}</td>
                      <td>{activity.user_id}</td>
                      <td>
                        <span className="activity-type">{activity.activity_type}</span>
                      </td>
                      <td>{activity.description || '-'}</td>
                      <td>{activity.device_type} - {activity.browser_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-content {
          margin-left: 75px;
          padding: 24px;
          min-height: 100vh;
          background: #f7f9fc;
        }
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 20px 24px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .page-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .dashboard-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .all-activities {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .section-title {
          margin: 0 0 16px;
          font-size: 1.2rem;
          font-weight: 600;
          color: #1e293b;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
        .activities-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f8fafc;
          font-weight: 600;
          color: #1e293b;
        }
        .activity-type {
          padding: 3px 10px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .page-content {
            margin-left: 0;
            padding: 16px 12px;
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          table {
            font-size: 0.8rem;
          }
          th, td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}