// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { Sidebar } from "@/components/Sidebar"; // ✅ Gunakan Sidebar seperti di home
import { useAuth } from "@/lib/auth-context";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const getCategoryFilter = (role: string) => {
  switch (role) {
    case "inspector-ga":
      return ["Toilet", "Fire Safety", "Lift Barang", "APD", "Evakuasi"];
    case "inspector":
    case "group-leader":
      return ["Final Assy", "Pre-Assy", "Pressure Jig"];
    default:
      return null;
  }
};

const parseChecksheetInfo = (area: string): string => {
  const lower = area.toLowerCase();
  if (lower.includes("toilet")) return "Toilet";
  if (lower.includes("hydrant") || lower.includes("apar")) return "Fire Safety";
  if (lower.includes("lift") && lower.includes("barang")) return "Lift Barang";
  if (lower.includes("apd")) return "APD";
  if (lower.includes("exit") || lower.includes("pintu darurat") || lower.includes("evakuasi")) return "Evakuasi";
  if (lower.includes("final assy")) return "Final Assy";
  if (lower.includes("pre-assy") || lower.includes("pre assy")) return "Pre-Assy";
  if (lower.includes("pressure jig")) return "Pressure Jig";
  return "Lainnya";
};

export default function ModernDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem("checksheet_history");
      const historyData = historyStr ? JSON.parse(historyStr) : [];
      setHistory(historyData);
    } catch (e) {
      console.error("Gagal memuat data dashboard", e);
      setHistory([]);
    }
  }, []);

  const filteredHistory = useMemo(() => {
    if (!user) return [];
    const allowedCategories = getCategoryFilter(user.role);
    if (!allowedCategories) return history;

    return history.filter(item => {
      const category = parseChecksheetInfo(item.area || item.machine || "");
      return allowedCategories.includes(category);
    });
  }, [history, user]);

  // === Statistik Tambahan ===
  const total = filteredHistory.length;
  const completed = filteredHistory.filter(h => h.status === "OK").length;
  const pending = filteredHistory.filter(h => h.status === "NG").length;
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
  
  const avgPerDay = useMemo(() => {
    if (filteredHistory.length === 0) return 0;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = filteredHistory.filter(item => 
      new Date(item.filledAt) >= weekAgo
    );
    return (lastWeek.length / 7).toFixed(1);
  }, [filteredHistory]);

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredHistory.forEach(item => {
      const cat = parseChecksheetInfo(item.area || item.machine || "");
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    return { labels, data };
  }, [filteredHistory]);

  const trendData = useMemo(() => {
    if (filteredHistory.length === 0) return { labels: [], datasets: [] };

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const dailyCounts = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      return filteredHistory.filter(item => 
        item.filledAt.startsWith(dayStr)
      ).length;
    });

    const labels = days.map(d => 
      d.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [{
        label: "Jumlah Checklist/Hari",
        data: dailyCounts,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#8B5CF6",
        pointRadius: 4,
      }],
    };
  }, [filteredHistory]);

  const ratioData = useMemo(() => {
    const map: Record<string, { ok: number; ng: number }> = {};
    filteredHistory.forEach(item => {
      const cat = parseChecksheetInfo(item.area || item.machine || "");
      if (!map[cat]) map[cat] = { ok: 0, ng: 0 };
      if (item.status === "OK") map[cat].ok++;
      else map[cat].ng++;
    });

    const categories = Object.keys(map);
    return {
      labels: categories,
      datasets: [
        {
          label: "OK",
          data: categories.map(cat => map[cat].ok),
          backgroundColor: "#10B981",
          borderRadius: 4,
        },
        {
          label: "NG",
          data: categories.map(cat => map[cat].ng),
          backgroundColor: "#F59E0B",
          borderRadius: 4,
        },
      ],
    };
  }, [filteredHistory]);

  const topUsers = useMemo(() => {
    const userCount: Record<string, number> = {};
    filteredHistory.forEach(item => {
      const name = item.filledBy || "Unknown";
      userCount[name] = (userCount[name] || 0) + 1;
    });

    return Object.entries(userCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredHistory]);

  const userName = user?.fullName || "User";

  return (
    <div className="dashboard-container">
      {/* ✅ Sidebar Vertikal */}
      <Sidebar />

      {/* Konten Utama */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1 className="page-title">📊 Dashboard Analitik</h1>
            <p className="page-subtitle">Wawasan berbasis data untuk peningkatan kualitas inspeksi</p>
          </div>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Checklist</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">Selesai (OK)</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Temuan (NG)</div>
          </div>
          <div className="stat-card info">
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Tingkat Kelengkapan</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-value">{avgPerDay}</div>
            <div className="stat-label">Rata-rata/Hari (7H)</div>
          </div>
        </div>

        {total > 0 && (
          <div className="insight-banner">
            <span className="insight-text">
              📌 Performa minggu ini: <strong>{completionRate}%</strong> checklist dalam kondisi OK. 
              Fokus pada area dengan temuan NG tertinggi!
            </span>
          </div>
        )}

        <div className="chart-box large">
          <h3 className="chart-title">📈 Aktivitas Checklist (7 Hari Terakhir)</h3>
          <div className="chart-container large">
            {trendData.labels.length > 0 ? (
              <Line 
                data={trendData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: "top" },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw} checklist`
                      }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }} 
              />
            ) : (
              <p className="empty-chart">Belum ada data checklist.</p>
            )}
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-box">
            <h3 className="chart-title">🔍 Distribusi Jenis Checklist</h3>
            <div className="chart-container small">
              {distributionData.labels.length > 0 ? (
                <Doughnut
                  data={{
                    labels: distributionData.labels,
                    datasets: [{
                      data: distributionData.data,
                      backgroundColor: [
                        "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6",
                        "#EF4444", "#06B6D4", "#84CC16"
                      ],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.raw} kali`
                        }
                      }
                    },
                  }}
                />
              ) : (
                <p className="empty-chart">Belum ada data.</p>
              )}
            </div>
          </div>

          <div className="chart-box">
            <h3 className="chart-title">⚖️ Rasio OK vs NG per Kategori</h3>
            <div className="chart-container">
              {ratioData.labels.length > 0 ? (
                <Bar
                  data={ratioData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: { stacked: true, beginAtZero: true },
                      y: { stacked: true },
                    },
                    plugins: {
                      legend: { position: "top" },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: ${context.raw}`
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="empty-chart">Belum ada data.</p>
              )}
            </div>
          </div>

          <div className="chart-box">
            <h3 className="chart-title">🏆 Top 5 Pengisi Checklist</h3>
            <div className="top-users">
              {topUsers.length > 0 ? (
                topUsers.map((user, i) => (
                  <div key={i} className="user-item">
                    <div className="user-info">
                      <span className="user-rank">#{i + 1}</span>
                      <span className="user-name">{user.name}</span>
                    </div>
                    <span className="user-count">{user.count}</span>
                  </div>
                ))
              ) : (
                <p className="empty-chart">Belum ada data.</p>
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">📜 Riwayat Checklist Lengkap</h2>
          {filteredHistory.length > 0 ? (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Tanggal & Waktu</th>
                    <th>Jenis / Area</th>
                    <th>Status</th>
                    <th>Pengisi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredHistory]
                    .sort((a, b) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime())
                    .map((item, i) => (
                      <tr key={i}>
                        <td>
                          {new Date(item.filledAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>{item.area || item.machine || "–"}</td>
                        <td>
                          <span className={`status-badge ${item.status === "OK" ? "ok" : "ng"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.filledBy || "–"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-activity">Belum ada riwayat checklist.</p>
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .main-content {
          flex: 1;
          padding: 24px;
          min-height: calc(100vh - 64px);
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 20px;
        }

        /* --- SISA STYLE TETAP SAMA --- */
        .header {
          margin-bottom: 28px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .page-subtitle {
          font-size: 16px;
          color: #64748b;
          margin-top: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
          border-left: 4px solid #cbd5e1;
        }

        .stat-card.primary { border-left-color: #8B5CF6; }
        .stat-card.success { border-left-color: #10B981; }
        .stat-card.warning { border-left-color: #F59E0B; }
        .stat-card.info { border-left-color: #3B82F6; }
        .stat-card.accent { border-left-color: #EC4899; }

        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          line-height: 1.4;
        }

        .insight-banner {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 28px;
          border-left: 4px solid #3B82F6;
        }

        .insight-text {
          color: #1e40af;
          font-size: 15px;
          font-weight: 600;
        }

        .charts-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .chart-box {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s ease;
        }

        .chart-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .chart-container {
          height: 280px;
          min-height: 280px;
          width: 100%;
        }

        .chart-container.large {
          height: 340px;
          min-height: 340px;
        }

        .chart-container.small {
          height: 220px;
          min-height: 220px;
        }

        .empty-chart {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          font-style: italic;
          font-size: 14px;
        }

        .top-users {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          background: #f8fafc;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .user-item:hover {
          background: #eef2ff;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-rank {
          font-weight: 700;
          color: #8B5CF6;
          background: #ede9fe;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 13px;
        }

        .user-name {
          color: #1e293b;
          font-weight: 600;
        }

        .user-count {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 32px 0 16px 0;
        }

        .history-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .history-table th,
        .history-table td {
          padding: 16px 18px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        .history-table th {
          background: #f8fafc;
          font-weight: 700;
          color: #334155;
          position: sticky;
          top: 0;
        }

        .history-table tbody tr:last-child td {
          border-bottom: none;
        }

        .history-table tbody tr:hover {
          background: #f8fafc;
        }

        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.ok {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.ng {
          background: #fef3c7;
          color: #92400e;
        }

        .empty-activity {
          padding: 24px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          background: white;
          border-radius: 16px;
          margin-top: 16px;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }
          .main-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}