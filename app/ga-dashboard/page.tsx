'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { getFormConfig, buildAnalyticsParams, FORM_TYPES } from '../../lib/dashboard-config';
import {
  fetchAnalytics,
  fetchHistory,
  fetchTopUsers,
  mapAnalyticsToDashboard,
  type DashboardData,
  type AnalyticsResponse,
} from '../../lib/analytics-mapper';
import { onDashboardRefresh, shouldRefreshForForm } from '@/lib/dashboard-events';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

type FormType = typeof FORM_TYPES[number];

function findForm(value: string): FormType {
  return FORM_TYPES.find(f => f.value === value) ?? FORM_TYPES[0];
}

// ─────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// Mendengarkan CustomEvent "sidebarToggle" dari Sidebar.tsx
// Sidebar mengirim: { detail: { expanded: boolean, width: number } }
// ─────────────────────────────────────────────────────────────
function useSidebarWidth() {
  const COLLAPSED_W = 70;  // sama dengan SIDEBAR_COLLAPSED_W di Sidebar.tsx
  const EXPANDED_W  = 240; // sama dengan SIDEBAR_EXPANDED_W  di Sidebar.tsx

  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    // Baca CSS variable yang di-set Sidebar saat mount
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-w').trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    // Dengarkan event toggle dari Sidebar
    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener('sidebarToggle', onToggle);
    return () => window.removeEventListener('sidebarToggle', onToggle);
  }, []);

  return sidebarW;
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  repaired: number;
  unrepaired: number;
  completionRate: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function GADashboard() {
  const { user } = useAuth();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ✅ Reactive sidebar width
  const sidebarW = useSidebarWidth();

  const [selectedForm, setSelectedForm] = useState<string>('All Category');
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeYear, setActiveYear]   = useState<number>(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading]     = useState<boolean>(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages]   = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const itemsPerPage = 10;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<'total' | 'ok' | 'ng' | 'repaired' | 'unrepaired'>('total');
  const [detailData, setDetailData] = useState<DashboardData['historyData']>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const form = findForm(selectedForm);
      const firstDay = new Date(activeYear, activeMonth, 1);
      const lastDay  = new Date(activeYear, activeMonth + 1, 0);
      const dateFrom = firstDay.toISOString().split('T')[0];
      const dateTo   = lastDay.toISOString().split('T')[0];

      const analyticsParams = { slug: form.slug, dateFrom, dateTo, period: 'daily' };
      const formConfig = getFormConfig(selectedForm) ?? {
        slug: form.slug, label: form.label, analyticsEndpoint: '/api/analytics',
      };

      const [analyticsResult, topUsersResult, historyResult] = await Promise.allSettled([
        fetchAnalytics(formConfig.analyticsEndpoint ?? '/analytics', analyticsParams),
        fetchTopUsers('/analytics/top-users', analyticsParams),
        fetchHistory('/analytics/history', form.slug, undefined, itemsPerPage, dateFrom, dateTo, currentPage),
      ]);

      let analytics: AnalyticsResponse | null = null;
      if (analyticsResult.status === 'fulfilled') analytics = analyticsResult.value;

      let topUsers: DashboardData['topUsers'] = [];
      if (topUsersResult.status === 'fulfilled') topUsers = topUsersResult.value;

      let historyData: DashboardData['historyData'] = [];
      if (historyResult.status === 'fulfilled') {
        historyData = historyResult.value.data || [];
        setTotalRecords(historyResult.value.total || 0);
        setTotalPages(historyResult.value.totalPages || 1);
      }

      const mappedData = mapAnalyticsToDashboard(
        analytics?.data?.length ? analytics.data : null,
        formConfig.label, topUsers, historyData
      );
      setDashboardData(mappedData);
      setLastRefresh(new Date());
    } catch {
      setError('Gagal memuat data. Silakan refresh halaman.');
      setDashboardData({
        stats: { total: 0, completed: 0, pending: 0, repaired: 0, unrepaired: 0, completionRate: '0.0' },
        trendData: [], distributionData: [], topUsers: [], historyData: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedForm, activeMonth, activeYear, currentPage]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  useEffect(() => {
    const id = setInterval(loadDashboardData, 3_600_000);
    return () => clearInterval(id);
  }, [loadDashboardData]);

  useEffect(() => {
    const cleanup = onDashboardRefresh((formType?: string) => {
      if (shouldRefreshForForm(selectedForm, formType)) loadDashboardData();
    }, { debounceMs: 500 });
    return cleanup;
  }, [selectedForm, loadDashboardData]);

  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'visible') loadDashboardData(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [loadDashboardData]);

  useEffect(() => {
    if (scrollPosition > 0 && tableContainerRef.current) {
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      setScrollPosition(0);
    }
  }, [currentPage, scrollPosition]);

  // ── Pagination helpers ─────────────────────────────────────
  const scrollToTable = () => {
    if (tableContainerRef.current) setScrollPosition(tableContainerRef.current.offsetTop - 100);
  };
  const handlePreviousPage = () => { if (currentPage > 1)         { scrollToTable(); setCurrentPage(p => p - 1); } };
  const handleNextPage     = () => { if (currentPage < totalPages) { scrollToTable(); setCurrentPage(p => p + 1); } };
  const handlePageChange   = (p: number) => { scrollToTable(); setCurrentPage(p); };

  const getPageNumbers = () => {
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end   = Math.min(totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ── Memos ──────────────────────────────────────────────────
  const stats = useMemo<DashboardStats>(
    () => dashboardData?.stats || { total: 0, completed: 0, pending: 0, repaired: 0, unrepaired: 0, completionRate: '0.0' },
    [dashboardData]
  );

  const trendChartData = useMemo(() => {
    if (!dashboardData?.trendData?.length) return { labels: [], datasets: [] };
    const labels = dashboardData.trendData.map(item => {
      if (item.date.includes('-')) {
        const [year, month, day] = item.date.split('-');
        return day && day !== '01' ? `${day}/${month}` : `${month}/${year?.slice(2)}`;
      }
      return item.date;
    });
    return {
      labels,
      datasets: [{
        label: 'Total Inspeksi',
        data: dashboardData.trendData.map(item => item.count),
        borderColor: '#1976d2', backgroundColor: 'rgba(25,118,210,0.1)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#1976d2', pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
      }],
    };
  }, [dashboardData]);

  const distributionChartData = useMemo(() => {
    if (!dashboardData?.distributionData?.length) return { labels: [], datasets: [] };
    const areaMap = new Map<string, { ok: number; ng: number }>();
    dashboardData.distributionData.forEach(item => {
      const area = item.category || 'Unknown';
      if (!areaMap.has(area)) areaMap.set(area, { ok: 0, ng: 0 });
      const cur = areaMap.get(area)!;
      if (item.status === 'OK') cur.ok += item.count;
      else if (item.status === 'NG') cur.ng += item.count;
    });
    const labels = Array.from(areaMap.keys());
    return {
      labels,
      datasets: [
        { label: 'OK', data: labels.map(a => areaMap.get(a)!.ok), backgroundColor: '#10B981', barPercentage: 0.8, barThickness: 20 },
        { label: 'NG', data: labels.map(a => areaMap.get(a)!.ng), backgroundColor: '#F59E0B', barPercentage: 0.8, barThickness: 20 },
      ],
    };
  }, [dashboardData]);

  const topUsers    = useMemo(() => dashboardData?.topUsers    || [], [dashboardData]);
  const historyData = useMemo(() => dashboardData?.historyData || [], [dashboardData]);

  // ── Helpers ────────────────────────────────────────────────
  const formatDateTime = (s: string) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
      });
    } catch { return s; }
  };

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];

  const changeMonth = (dir: number) => {
    let m = activeMonth + dir, y = activeYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setActiveMonth(m); setActiveYear(y); setCurrentPage(1);
  };

  const openDetailModal = async (type: 'total' | 'ok' | 'ng' | 'repaired' | 'unrepaired') => {
    setDetailModalType(type);
    setDetailModalOpen(true);
    setIsDetailLoading(true);
    
    try {
      const form = findForm(selectedForm);
      const firstDay = new Date(activeYear, activeMonth, 1);
      const lastDay  = new Date(activeYear, activeMonth + 1, 0);
      const dateFrom = firstDay.toISOString().split('T')[0];
      const dateTo   = lastDay.toISOString().split('T')[0];

      const res = await fetchHistory(
        '/analytics/history', 
        form.slug, 
        undefined, 
        9999,
        dateFrom, 
        dateTo, 
        1
      );
      
      let filtered = res.data || [];
      if (type === 'ok') filtered = filtered.filter(item => item.status === 'OK' && item.ngCount === 0);
      if (type === 'ng') filtered = filtered.filter(item => item.ngCount > 0 || item.status === 'NG');
      if (type === 'repaired') filtered = filtered.filter(item => (item.repairedCount ?? 0) > 0);
      if (type === 'unrepaired') filtered = filtered.filter(item => (item.unrepairedCount ?? (item.ngCount > 0 ? item.ngCount : 0)) > 0);
      
      setDetailData(filtered);
    } catch (err) {
      console.error(err);
      setDetailData([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getDetailModalTitle = () => {
    switch (detailModalType) {
      case 'total': return 'Total Inspeksi';
      case 'ok': return 'Item OK';
      case 'ng': return 'Item NG (Ketidaksesuaian)';
      case 'repaired': return 'Item NG yang Sudah Diperbaiki';
      case 'unrepaired': return 'Item NG Menunggu Perbaikan';
      default: return 'Detail Inspeksi';
    }
  };

  const downloadDetailPDF = () => {
    const doc = new jsPDF();
    const formName = findForm(selectedForm).label.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const title = `Detail ${getDetailModalTitle()} - ${formName}`;
    
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${MONTHS[activeMonth]} ${activeYear}`, 14, 22);

    const tableColumn = ["No", "Waktu", "Area", "Status", "Item NG", "Status Perbaikan", "PIC"];
    const tableRows = detailData.map((item, i) => {
      const repInfo = item.ngCount > 0 
        ? `${item.repairedCount || 0} Diperbaiki / ${item.unrepairedCount ?? item.ngCount} Pending` 
        : 'Normal';
      return [
        i + 1,
        formatDateTime(item.filledAt),
        item.area,
        item.status,
        item.ngCount,
        repInfo,
        item.filledBy || '-'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 101, 192] }
    });

    doc.save(`${title.replace(/\s+/g, '_')}_${activeMonth+1}_${activeYear}.pdf`);
  };

  const currentFormLabel = findForm(selectedForm).label;

  if (!user) return null;
  const userName = user.fullName || 'User';

  const legacyForms = FORM_TYPES.filter(f => f.group === 'legacy');
  const gaForms     = FORM_TYPES.filter(f => f.group === 'ga');

  // ✅ Inline style reaktif — margin-left ikut sidebarW
  const mainStyle: React.CSSProperties = {
    marginLeft: sidebarW,
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --db-blue: #1565c0;
          --db-blue-light: #1e88e5;
          --db-radius: 12px;
          --db-shadow: 0 2px 8px rgba(0,0,0,0.08);
          --db-border: #e5e7eb;
          --db-bg: #f5f7fa;
        }

        .db-wrap { display: flex; min-height: 100vh; background: var(--db-bg); }

        /* ✅ db-main tidak pakai margin-left di CSS — dikontrol via inline style */
        .db-main {
          flex: 1;
          padding: 24px 20px 48px;
          max-width: 1440px;
          min-width: 0;
          box-sizing: border-box;
        }

        /* ── HEADER ── */
        .db-header {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          color: #fff; padding: 20px 24px; border-radius: var(--db-radius);
          margin-bottom: 20px; box-shadow: 0 4px 14px rgba(21,101,192,0.25);
        }
        .db-header-inner {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 16px; flex-wrap: wrap;
        }
        .db-header h1     { margin: 0 0 4px; font-size: clamp(18px,4vw,26px); font-weight: 700; }
        .db-header-sub    { margin: 0; opacity: .88; font-size: clamp(12px,2.5vw,15px); }
        .db-refresh-info  { margin: 6px 0 0; font-size: 11px; opacity: .75; font-style: italic; }

        .db-filter-wrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.15); padding: 10px 16px;
          border-radius: 10px; flex-shrink: 0;
        }
        .db-filter-label { font-weight: 600; font-size: 13px; white-space: nowrap; }
        .db-filter-select {
          padding: 7px 12px; border: none; border-radius: 7px;
          background: #fff; color: #1e293b; font-weight: 500;
          font-size: 13px; cursor: pointer; min-width: 200px; min-height: 36px;
        }
        .db-filter-select:focus { outline: 2px solid #64b5f6; }
        .db-filter-select optgroup { font-weight: 700; color: #1565c0; }

        /* ── MONTH NAV ── */
        .db-month-nav {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; background: #fff; border-radius: var(--db-radius);
          padding: 12px 16px; margin-bottom: 20px;
          box-shadow: var(--db-shadow); flex-wrap: wrap;
        }
        .db-month-btn {
          padding: 8px 18px; background: var(--db-blue); color: #fff;
          border: none; border-radius: 7px; font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all .2s; min-height: 38px; white-space: nowrap;
        }
        .db-month-btn:hover { background: #0d47a1; transform: translateY(-1px); }
        .db-month-label {
          font-size: clamp(15px,3vw,20px); font-weight: 700;
          color: var(--db-blue); min-width: 160px; text-align: center;
        }

        /* ── LOADING / ERROR ── */
        .db-loading {
          text-align: center; padding: 60px 20px; background: #fff;
          border-radius: var(--db-radius); box-shadow: var(--db-shadow);
        }
        .db-spinner {
          display: inline-block; width: 44px; height: 44px;
          border: 4px solid #e0e0e0; border-top-color: var(--db-blue);
          border-radius: 50%; animation: db-spin .8s linear infinite; margin-bottom: 14px;
        }
        @keyframes db-spin { to { transform: rotate(360deg); } }
        .db-loading p { color: #555; margin: 6px 0; font-size: 14px; }
        .db-error {
          background: #fef2f2; color: #dc2626; padding: 14px 18px;
          border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px;
        }
        .db-retry-btn {
          margin-left: auto; padding: 7px 14px; background: #dc2626;
          color: #fff; border: none; border-radius: 6px;
          cursor: pointer; font-weight: 600; font-size: 13px;
        }
        .db-retry-btn:hover { background: #b91c1c; }

        /* ── STATS GRID ── */
        .db-stats {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 14px; margin-bottom: 20px;
        }
        .db-stat {
          background: #fff; border-radius: var(--db-radius); padding: 18px 14px;
          text-align: center; box-shadow: var(--db-shadow);
          transition: transform .2s, box-shadow .2s;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .db-stat:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
        .db-stat--blue     { background: linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; }
        .db-stat--green    { background: linear-gradient(135deg,#10b981,#059669); color:#fff; }
        .db-stat--amber    { background: linear-gradient(135deg,#f59e0b,#d97706); color:#fff; }
        .db-stat--repaired { background: linear-gradient(135deg,#059669,#047857); color:#fff; }
        .db-stat--pending  { background: linear-gradient(135deg,#ef4444,#dc2626); color:#fff; }
        .db-stat--violet   { background: linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; }
        .db-stat-icon { font-size: 1.8rem; margin-bottom: 6px; }
        .db-stat-val  { font-size: clamp(20px,4vw,28px); font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .db-stat-lbl  { font-size: 12px; font-weight: 500; opacity: .92; }

        /* ── ACTION BUTTONS & NG DETAIL ACCORDION ── */
        .db-action-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 6px; font-weight: 600; font-size: 11px;
          text-decoration: none; cursor: pointer; transition: all .2s;
          border: none; white-space: nowrap;
        }
        .db-action-edit {
          background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
        }
        .db-action-edit:hover {
          background: #dbeafe; color: #1e40af; transform: translateY(-1px);
        }
        .db-action-repaired {
          background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
        }

        .db-ng-card {
          border: 1px solid #fee2e2; background: #fff; border-radius: 10px;
          padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(220,38,38,0.06);
        }
        .db-ng-card-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 10px; margin-bottom: 10px; border-bottom: 1px dashed #fecaca; padding-bottom: 8px;
        }
        .db-ng-item-badge {
          display: inline-block; background: #fef2f2; color: #991b1b;
          font-weight: 700; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca;
        }
        .db-repair-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 700;
        }
        .db-repair-pill--ok { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .db-repair-pill--pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

        .db-modal-ng-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px;
          margin-top: 8px; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px;
        }
        .db-modal-ng-box {
          border-left: 4px solid #ef4444; background: #fff; padding: 10px 12px; border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 4px;
        }
        .db-modal-ng-box.is-fixed {
          border-left-color: #10b981;
        }
        .db-ng-idx-badge {
          background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 10.5px;
          padding: 2px 6px; border-radius: 4px; border: 1px solid #fecaca;
        }
        .db-modal-ng-box.is-fixed .db-ng-idx-badge {
          background: #dcfce7; color: #15803d; border-color: #bbf7d0;
        }
        .db-ng-desc-row {
          display: flex; gap: 6px; align-items: flex-start; font-size: 12px; line-height: 1.4;
        }
        .db-ng-desc-tag {
          font-weight: 700; flex-shrink: 0; min-width: 58px; font-size: 11.5px;
        }
        .db-ng-desc-finding { color: #dc2626; }
        .db-ng-desc-finding .db-ng-desc-tag { color: #b91c1c; }
        .db-ng-desc-action { color: #15803d; }
        .db-ng-desc-action .db-ng-desc-tag { color: #166534; }
        .db-ng-desc-empty { color: #94a3b8; font-style: italic; }
        .db-ng-desc-empty .db-ng-desc-tag { color: #64748b; font-style: normal; }

        /* ── NG PHOTO THUMBNAIL & LIGHTBOX ── */
        .db-ng-foto-wrap {
          display: flex; align-items: center; gap: 10px; margin: 4px 0 6px;
          padding: 6px 8px; background: #f1f5f9; border-radius: 6px; border: 1px solid #e2e8f0;
        }
        .db-ng-foto-thumb {
          position: relative; width: 64px; height: 64px; border-radius: 6px; overflow: hidden;
          cursor: pointer; border: 1.5px solid #cbd5e1; background: #000; flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: transform .2s, box-shadow .2s;
        }
        .db-ng-foto-thumb:hover {
          transform: scale(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.15); border-color: #3b82f6;
        }
        .db-ng-foto-thumb img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .db-ng-foto-zoom-hint {
          position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65);
          color: #fff; font-size: 9px; text-align: center; padding: 1px 0; font-weight: 600;
        }
        .db-ng-foto-lbl {
          font-size: 11px; font-weight: 600; color: #475569;
        }

        /* ── LIGHTBOX MODAL ── */
        .db-lightbox-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; backdrop-filter: blur(4px);
        }
        .db-lightbox-content {
          position: relative; max-width: 90vw; max-height: 90vh;
          display: flex; flex-direction: column; align-items: center;
        }
        .db-lightbox-img {
          max-width: 100%; max-height: 80vh; object-fit: contain;
          border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border: 2px solid rgba(255,255,255,0.2);
        }
        .db-lightbox-close {
          position: absolute; top: -14px; right: -14px; width: 34px; height: 34px;
          background: #ef4444; color: #fff; border: 2px solid #fff; border-radius: 50%;
          font-size: 18px; font-weight: 700; cursor: pointer; display: flex;
          align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform .2s;
        }
        .db-lightbox-close:hover { transform: scale(1.1); background: #dc2626; }

        /* ── CHART BOXES ── */
        .db-chart-box {
          background: #fff; border-radius: var(--db-radius);
          padding: 20px; box-shadow: var(--db-shadow); margin-bottom: 20px;
        }
        .db-chart-title { margin: 0 0 16px; font-size: clamp(13px,2.5vw,16px); font-weight: 700; color: #1e293b; }
        .db-chart-area     { height: 340px; }
        .db-chart-area--sm { height: 260px; }
        .db-charts-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; margin-bottom: 20px;
        }
        .db-empty { text-align: center; color: #94a3b8; padding: 40px 20px; font-size: 14px; }

        /* ── TOP USERS ── */
        .db-top-users { display: flex; flex-direction: column; gap: 10px; }
        .db-user-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: #f8fafc; border-radius: 8px; transition: background .2s;
        }
        .db-user-item:hover { background: #f1f5f9; }
        .db-user-rank {
          width: 32px; height: 32px; background: var(--db-blue); color: #fff;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; flex-shrink: 0;
        }
        .db-user-body  { flex: 1; min-width: 0; }
        .db-user-row   { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px; }
        .db-user-name  { font-weight: 600; color: #1e293b; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-user-count {
          background: var(--db-blue); color: #fff; padding: 3px 12px;
          border-radius: 12px; font-weight: 700; font-size: 12px; flex-shrink: 0;
        }
        .db-progress { height: 7px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .db-progress-fill { height: 100%; background: linear-gradient(90deg,#10b981,#059669); border-radius: 4px; transition: width .4s; }

        /* ── HISTORY SECTION ── */
        .db-section { background: #fff; border-radius: var(--db-radius); padding: 20px; box-shadow: var(--db-shadow); }
        .db-section-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid var(--db-border);
          flex-wrap: wrap; gap: 10px;
        }
        .db-section-title  { margin: 0; font-size: clamp(14px,3vw,18px); font-weight: 700; color: #1e293b; }
        .db-section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .db-record-badge {
          color: #6b7280; font-size: 12px; background: #f3f4f6;
          padding: 5px 10px; border-radius: 20px; white-space: nowrap;
        }
        .db-refresh-btn {
          padding: 6px 12px; background: var(--db-blue); color: #fff; border: none;
          border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;
          transition: background .2s; min-height: 32px;
        }
        .db-refresh-btn:hover { background: #0d47a1; }

        /* ── HISTORY TABLE ── */
        .db-table-scroll {
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          max-height: 420px; overflow-y: auto;
          border-radius: 8px; border: 1px solid var(--db-border);
        }
        .db-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 520px; }
        .db-table thead th {
          background: #f9fafb; padding: 12px 14px; text-align: left; font-weight: 700;
          color: #1e293b; border-bottom: 2px solid var(--db-border);
          position: sticky; top: 0; z-index: 1;
          font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap;
        }
        .db-table tbody td { padding: 11px 14px; border-bottom: 1px solid #f0f4f8; color: #334155; vertical-align: middle; }
        .db-table tbody tr:last-child td { border-bottom: none; }
        .db-table tbody tr:hover { background: #f8fafc; }
        .db-table tbody tr.db-row-warn { background: #fffbeb; }
        .db-table tbody tr.db-row-warn:hover { background: #fef3c7; }
        .db-td-no { text-align: center; font-weight: 600; color: #94a3b8; background: #f9fafb; width: 48px; font-size: 12px; }
        .db-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; }
        .db-badge--ok { background: #d1fae5; color: #065f46; }
        .db-badge--ng { background: #fef3c7; color: #92400e; }
        .db-ng-count { color: #d97706; font-weight: 700; }
        .db-ok-count { color: #059669; font-weight: 700; }
        .db-empty-row { text-align: center; color: #9ca3af; padding: 48px; font-size: 15px; }

        /* ── PAGINATION ── */
        .db-pagination {
          display: flex; justify-content: center; align-items: center;
          gap: 8px; margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--db-border); flex-wrap: wrap;
        }
        .db-page-btn {
          padding: 7px 14px; background: var(--db-blue); color: #fff; border: none;
          border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;
          transition: all .2s; min-height: 34px; white-space: nowrap;
        }
        .db-page-btn:hover:not(:disabled) { background: #0d47a1; transform: translateY(-1px); }
        .db-page-btn:disabled { background: #9ca3af; cursor: not-allowed; opacity: .6; transform: none; }
        .db-page-nums { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
        .db-page-num {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          background: #fff; border: 1px solid var(--db-border); border-radius: 6px;
          cursor: pointer; font-weight: 600; font-size: 12px; color: #374151; transition: all .2s;
        }
        .db-page-num:hover { background: #f3f4f6; border-color: var(--db-blue); }
        .db-page-num.active { background: var(--db-blue); color: #fff; border-color: var(--db-blue); }

        /* ── MOBILE HISTORY CARDS ── */
        .db-history-cards { display: none; }
        .db-hcard {
          border: 1px solid var(--db-border); border-radius: 8px; padding: 12px 14px;
          margin-bottom: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.05);
        }
        .db-hcard.warn { background: #fffbeb; border-color: #fde68a; }
        .db-hcard-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
        .db-hcard-no {
          width: 24px; height: 24px; background: #e5e7eb; color: #64748b;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .db-hcard-area { flex: 1; font-weight: 600; font-size: 13px; color: #1e293b; }
        .db-hcard-body { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
        .db-hcard-field { font-size: 11px; }
        .db-hcard-key { color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: .3px; }
        .db-hcard-val { color: #334155; font-weight: 500; }

        /* ── MODAL ── */
        .db-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .db-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 900px;
          max-height: 90vh; display: flex; flex-direction: column;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .db-modal-header {
          padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
          display: flex; justify-content: space-between; align-items: center;
        }
        .db-modal-title { font-size: 18px; font-weight: 700; margin: 0; color: #1e293b; }
        .db-modal-close {
          background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; line-height: 1;
        }
        .db-modal-body {
          padding: 20px; overflow-y: auto; flex: 1;
        }
        .db-modal-footer {
          padding: 16px 20px; border-top: 1px solid #e5e7eb;
          display: flex; justify-content: flex-end;
        }
        .db-btn {
          padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;
          border: none; font-size: 14px;
        }
        .db-btn-primary {
          background: #1565c0; color: #fff; transition: background .2s;
        }
        .db-btn-primary:hover:not(:disabled) { background: #0d47a1; }
        .db-btn-primary:disabled { background: #9ca3af; cursor: not-allowed; opacity: .7; }

        .db-detail-btn {
          margin-top: 12px; padding: 6px 10px; background: rgba(255,255,255,0.2);
          color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 6px;
          font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%;
        }
        .db-detail-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-1px); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .db-main { padding: 20px 16px 48px; }
          .db-stats { grid-template-columns: repeat(3,1fr); gap: 12px; }
        }
        @media (max-width: 1024px) {
          .db-charts-grid { grid-template-columns: 1fr; }
          .db-chart-area--sm { height: 280px; }
        }

        /* ✅ Mobile: override inline margin-left agar kembali ke 0 */
        @media (max-width: 768px) {
          .db-main { margin-left: 0 !important; padding: 12px 10px 60px; }
          .db-header { padding: 14px 16px; margin-bottom: 14px; }
          .db-header-inner { flex-direction: column; gap: 10px; }
          .db-filter-wrap { width: 100%; box-sizing: border-box; }
          .db-filter-select { flex: 1; min-width: 0; }
          .db-month-nav { padding: 10px 12px; gap: 10px; }
          .db-month-btn { padding: 8px 14px; font-size: 12px; flex: 1; text-align: center; }
          .db-month-label { min-width: 0; font-size: 15px; }
          .db-stats { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .db-stat { padding: 14px 10px; }
          .db-stat-icon { font-size: 1.6rem; }
          .db-chart-box { padding: 14px; }
          .db-chart-area { height: 260px; }
          .db-chart-area--sm { height: 220px; }
          .db-section { padding: 14px; }
          .db-section-head { flex-direction: column; align-items: flex-start; }
          .db-table-scroll { display: none; }
          .db-history-cards { display: block; }
          .db-pagination { gap: 6px; }
          .db-page-btn { padding: 8px 12px; font-size: 12px; flex: 1; text-align: center; justify-content: center; max-width: 120px; }
          .db-page-num { width: 30px; height: 30px; font-size: 11px; }
        }
        @media (max-width: 480px) {
          .db-main { padding: 10px 8px 60px; }
          .db-stats { gap: 8px; }
          .db-stat-val { font-size: 20px; }
          .db-stat-lbl { font-size: 11px; }
          .db-stat-icon { font-size: 1.4rem; margin-bottom: 4px; }
          .db-stat { padding: 12px 8px; }
          .db-chart-area { height: 220px; }
          .db-chart-area--sm { height: 200px; }
          .db-month-btn { font-size: 11px; padding: 7px 10px; }
          .db-month-label { font-size: 14px; }
          .db-record-badge { display: none; }
          .db-page-btn { max-width: 100px; font-size: 11px; }
          .db-page-nums { gap: 3px; }
          .db-page-num { width: 28px; height: 28px; font-size: 11px; }
        }
        @media (hover: none) and (pointer: coarse) {
          .db-filter-select { font-size: 16px; min-height: 44px; }
          .db-month-btn, .db-page-btn, .db-refresh-btn { min-height: 44px; }
          .db-page-num { min-height: 44px; width: 44px; }
        }
      `}</style>

      <Sidebar userName={userName} />

      <div className="db-wrap">
        {/* ✅ inline style untuk margin-left reaktif */}
        <main className="db-main" style={mainStyle}>

          {/* ── Header ── */}
          <div className="db-header">
            <div className="db-header-inner">
              <div>
                <h1>📊 GA Dashboard</h1>
                <p className="db-header-sub">Wawasan berbasis data untuk peningkatan kualitas inspeksi</p>
                <p className="db-refresh-info">
                  Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')} · Auto-refresh: 1 jam
                </p>
              </div>
              <div className="db-filter-wrap">
                <span className="db-filter-label">Form:</span>
                <select
                  value={selectedForm}
                  onChange={(e) => { setSelectedForm(e.target.value); setCurrentPage(1); }}
                  className="db-filter-select"
                >
                  <option value="All Category">📋 All Category</option>
                  <optgroup label="── Legacy Forms ──">
                    {legacyForms.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── GA Checksheet ──">
                    {gaForms.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* ── Month Navigation ── */}
          <div className="db-month-nav">
            <button className="db-month-btn" onClick={() => changeMonth(-1)}>← Bulan Lalu</button>
            <span className="db-month-label">{MONTHS[activeMonth]} {activeYear}</span>
            <button className="db-month-btn" onClick={() => changeMonth(1)}>Bulan Depan →</button>
          </div>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="db-loading">
              <div className="db-spinner" />
              <p>Memuat data {currentFormLabel}...</p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Auto-refresh setiap 1 jam</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="db-error">
              <strong>⚠️</strong> {error}
              <button className="db-retry-btn" onClick={loadDashboardData}>Coba Lagi</button>
            </div>
          )}

          {/* ── Dashboard Content ── */}
          {!isLoading && !error && dashboardData && (
            <>
              {/* Stats */}
              <div className="db-stats">
                <div className="db-stat db-stat--blue">
                  <div className="db-stat-icon">📋</div>
                  <div className="db-stat-val">{stats.total}</div>
                  <div className="db-stat-lbl">Total Inspeksi</div>
                  <button className="db-detail-btn" onClick={() => openDetailModal('total')}>Lihat Detail</button>
                </div>
                <div className="db-stat db-stat--green">
                  <div className="db-stat-icon">✓</div>
                  <div className="db-stat-val">{stats.completed}</div>
                  <div className="db-stat-lbl">Item OK</div>
                  <button className="db-detail-btn" onClick={() => openDetailModal('ok')}>Lihat Detail</button>
                </div>
                <div className="db-stat db-stat--amber">
                  <div className="db-stat-icon">✗</div>
                  <div className="db-stat-val">{stats.pending}</div>
                  <div className="db-stat-lbl">Item NG (Temuan)</div>
                  <button className="db-detail-btn" onClick={() => openDetailModal('ng')}>Lihat Detail</button>
                </div>
                <div className="db-stat db-stat--repaired">
                  <div className="db-stat-icon">🛠️</div>
                  <div className="db-stat-val">{stats.repaired}</div>
                  <div className="db-stat-lbl">Sudah Diperbaiki</div>
                  <button className="db-detail-btn" onClick={() => openDetailModal('repaired')}>Lihat Detail</button>
                </div>
                <div className="db-stat db-stat--pending">
                  <div className="db-stat-icon">⏳</div>
                  <div className="db-stat-val">{stats.unrepaired}</div>
                  <div className="db-stat-lbl">Menunggu Perbaikan</div>
                  <button className="db-detail-btn" onClick={() => openDetailModal('unrepaired')}>Lihat Detail</button>
                </div>
                <div className="db-stat db-stat--violet">
                  <div className="db-stat-icon">📊</div>
                  <div className="db-stat-val">{stats.completionRate}%</div>
                  <div className="db-stat-lbl">Compliance Rate</div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="db-chart-box">
                <h3 className="db-chart-title">
                  📈 Aktivitas {currentFormLabel.replace(/^[^\s]+\s/, '')} — {MONTHS[activeMonth]} {activeYear}
                </h3>
                <div className="db-chart-area">
                  {trendChartData.labels.length > 0 ? (
                    <Line
                      data={trendChartData}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' as const },
                          tooltip: { callbacks: { label: (ctx) => `Total: ${ctx.parsed.y} inspeksi` } },
                        },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                      }}
                    />
                  ) : (
                    <div className="db-empty">
                      <p>📭 Belum ada data untuk periode ini</p>
                      <p style={{ fontSize: 12, marginTop: 6 }}>Data akan auto-refresh setiap 1 jam</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="db-charts-grid">
                <div className="db-chart-box" style={{ marginBottom: 0 }}>
                  <h3 className="db-chart-title">📊 Distribusi OK/NG per Area</h3>
                  <div className="db-chart-area--sm">
                    {distributionChartData.labels.length > 0 ? (
                      <Bar
                        data={distributionChartData}
                        options={{
                          responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
                          plugins: { legend: { position: 'top' as const } },
                          scales: { x: { beginAtZero: true, stacked: true }, y: { stacked: true } },
                        }}
                      />
                    ) : (
                      <div className="db-empty">Belum ada data distribusi.</div>
                    )}
                  </div>
                </div>

                <div className="db-chart-box" style={{ marginBottom: 0 }}>
                  <h3 className="db-chart-title">🏆 Top Inspector</h3>
                  <div className="db-top-users">
                    {topUsers.length > 0 ? topUsers.map((u, i) => {
                      const progress = Math.min((u.count / (topUsers[0]?.count || 1)) * 100, 100);
                      return (
                        <div key={i} className="db-user-item">
                          <div className="db-user-rank">{i + 1}</div>
                          <div className="db-user-body">
                            <div className="db-user-row">
                              <span className="db-user-name">{u.name}</span>
                              <span className="db-user-count">{u.count}</span>
                            </div>
                            <div className="db-progress">
                              <div className="db-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="db-empty">Belum ada data inspector.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* History Section */}
              <div className="db-section">
                <div className="db-section-head">
                  <h2 className="db-section-title">📜 Riwayat Terbaru</h2>
                  <div className="db-section-actions">
                    {totalRecords > 0 && (
                      <span className="db-record-badge">
                        {totalRecords} records · Hal {currentPage}/{totalPages}
                      </span>
                    )}
                    <button className="db-refresh-btn" onClick={loadDashboardData}>🔄 Refresh</button>
                  </div>
                </div>

                {historyData.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="db-table-scroll" ref={tableContainerRef}>
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th style={{ width: 48, textAlign: 'center' }}>No</th>
                            <th>Waktu</th>
                            <th>Kategori / Form</th>
                            <th>Area</th>
                            <th>Status</th>
                            <th>Item NG</th>
                            <th>Status Perbaikan</th>
                            <th>PIC</th>
                            <th style={{ textAlign: 'center' }}>Aksi / Perbaikan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.map((item, i) => {
                            const hasNG = item.ngCount > 0 || item.status === 'NG';
                            const isRepaired = item.repairedCount !== undefined && item.repairedCount > 0 && (item.unrepairedCount === 0);
                            const isPending = hasNG && !isRepaired;

                            return (
                              <tr key={i} className={hasNG ? 'db-row-warn' : ''}>
                                <td className="db-td-no">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.filledAt)}</td>
                                <td>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {item.category || currentFormLabel.replace(/^[^\s]+\s/, '')}
                                  </span>
                                </td>
                                <td>{item.area}</td>
                                <td>
                                  <span className={`db-badge ${item.status === 'OK' ? 'db-badge--ok' : 'db-badge--ng'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td>
                                  {item.ngCount > 0
                                    ? <span className="db-ng-count">{item.ngCount} ⚠️</span>
                                    : <span className="db-ok-count">0</span>}
                                </td>
                                <td>
                                  {!hasNG ? (
                                    <span style={{ color: '#059669', fontSize: 12 }}>–</span>
                                  ) : isRepaired ? (
                                    <span className="db-repair-pill db-repair-pill--ok">
                                      ✓ Sudah Diperbaiki ({item.repairedCount})
                                    </span>
                                  ) : (
                                    <span className="db-repair-pill db-repair-pill--pending">
                                      ⏳ Belum Diperbaiki {item.repairedCount ? `(${item.repairedCount}/${item.ngCount})` : ''}
                                    </span>
                                  )}
                                </td>
                                <td>{item.filledBy || '–'}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {item.editUrl ? (
                                    <Link
                                      href={item.editUrl}
                                      className="db-action-btn db-action-edit"
                                      title="Buka form untuk perbaikan atau edit data"
                                    >
                                      ✏️ Perbaiki
                                    </Link>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>–</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="db-history-cards">
                      {historyData.map((item, i) => {
                        const hasNG = item.ngCount > 0 || item.status === 'NG';
                        const isRepaired = item.repairedCount !== undefined && item.repairedCount > 0 && (item.unrepairedCount === 0);

                        return (
                          <div key={i} className={`db-hcard ${hasNG ? 'warn' : ''}`}>
                            <div className="db-hcard-top">
                              <div className="db-hcard-no">{(currentPage - 1) * itemsPerPage + i + 1}</div>
                              <div className="db-hcard-area">
                                <div>{item.area}</div>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                  {item.category || currentFormLabel}
                                </div>
                              </div>
                              <span className={`db-badge ${item.status === 'OK' ? 'db-badge--ok' : 'db-badge--ng'}`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="db-hcard-body">
                              <div className="db-hcard-field">
                                <div className="db-hcard-key">Waktu</div>
                                <div className="db-hcard-val">{formatDateTime(item.filledAt)}</div>
                              </div>
                              <div className="db-hcard-field">
                                <div className="db-hcard-key">PIC</div>
                                <div className="db-hcard-val">{item.filledBy || '–'}</div>
                              </div>
                              <div className="db-hcard-field">
                                <div className="db-hcard-key">Item NG</div>
                                <div className="db-hcard-val">
                                  {item.ngCount > 0
                                    ? <span className="db-ng-count">{item.ngCount} ⚠️</span>
                                    : <span className="db-ok-count">0</span>}
                                </div>
                              </div>
                              <div className="db-hcard-field">
                                <div className="db-hcard-key">Perbaikan</div>
                                <div className="db-hcard-val">
                                  {!hasNG ? (
                                    <span style={{ color: '#059669', fontSize: 11 }}>Normal</span>
                                  ) : isRepaired ? (
                                    <span style={{ color: '#166534', fontWeight: 600, fontSize: 11 }}>✓ Diperbaiki</span>
                                  ) : (
                                    <span style={{ color: '#b45309', fontWeight: 600, fontSize: 11 }}>⏳ Pending</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {item.editUrl && (
                              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                                <Link href={item.editUrl} className="db-action-btn db-action-edit">
                                  ✏️ Buka Form Perbaikan
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="db-pagination">
                        <button className="db-page-btn" onClick={handlePreviousPage} disabled={currentPage === 1}>
                          ← Prev
                        </button>
                        <div className="db-page-nums">
                          {getPageNumbers().map(p => (
                            <button
                              key={p}
                              className={`db-page-num ${currentPage === p ? 'active' : ''}`}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button className="db-page-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="db-empty-row">Belum ada riwayat untuk form ini.</p>
                )}
              </div>
            </>
          )}

          {/* ── DETAIL MODAL ── */}
          {detailModalOpen && (
            <div className="db-modal-overlay" onClick={() => setDetailModalOpen(false)}>
              <div className="db-modal" onClick={e => e.stopPropagation()}>
                <div className="db-modal-header">
                  <div>
                    <h3 className="db-modal-title">
                      Detail {getDetailModalTitle()}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                      {currentFormLabel} · {MONTHS[activeMonth]} {activeYear} ({detailData.length} records)
                    </p>
                  </div>
                  <button className="db-modal-close" onClick={() => setDetailModalOpen(false)}>&times;</button>
                </div>
                <div className="db-modal-body">
                  {isDetailLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="db-spinner" />
                      <p>Memuat detail...</p>
                    </div>
                  ) : detailData.length > 0 ? (
                    (detailModalType === 'ng' || detailModalType === 'repaired' || detailModalType === 'unrepaired') ? (
                      /* TAMPILAN KHUSUS DETAIL NG DENGAN TEMUAN & PERBAIKAN */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {detailData.map((item, i) => (
                          <div key={i} className="db-ng-card">
                            <div className="db-ng-card-header">
                              <div>
                                <span className="db-ng-item-badge">
                                  #{i + 1} {item.category || currentFormLabel}
                                </span>
                                <span style={{ marginLeft: 8, fontWeight: 700, color: '#1e293b', fontSize: 13 }}>
                                  {item.area}
                                </span>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                                  🗓️ {formatDateTime(item.filledAt)} · 👤 PIC: {item.filledBy || '–'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="db-badge db-badge--ng">
                                  {item.ngCount} Temuan NG
                                </span>
                                {item.editUrl && (
                                  <Link href={item.editUrl} className="db-action-btn db-action-edit">
                                    ✏️ Perbaiki di Form
                                  </Link>
                                )}
                              </div>
                            </div>

                            {/* Daftar Item NG & Tindakan Perbaikan */}
                            {item.ngDetails && item.ngDetails.length > 0 ? (
                              <div className="db-modal-ng-grid">
                                {item.ngDetails.map((ng, ngIdx) => (
                                  <div key={ngIdx} className={`db-modal-ng-box ${ng.isRepaired ? 'is-fixed' : ''}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span className="db-ng-idx-badge">NG #{ngIdx + 1}</span>
                                        <strong style={{ color: '#0f172a', fontSize: 12.5 }}>{ng.item}</strong>
                                      </div>
                                      <span className={`db-repair-pill ${ng.isRepaired ? 'db-repair-pill--ok' : 'db-repair-pill--pending'}`}>
                                        {ng.isRepaired ? '✓ Diperbaiki' : '⏳ Belum Diperbaiki'}
                                      </span>
                                    </div>

                                    {/* Thumbnail Foto Bukti Jika Ada */}
                                    {ng.foto && (
                                      <div className="db-ng-foto-wrap">
                                        <div 
                                          className="db-ng-foto-thumb" 
                                          onClick={() => setPreviewImage(ng.foto || null)}
                                          title="Klik untuk memperbesar gambar"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={ng.foto} alt="Foto Temuan NG" />
                                          <div className="db-ng-foto-zoom-hint">🔍 Zoom</div>
                                        </div>
                                        <span className="db-ng-foto-lbl">📷 Bukti Kerusakan / Temuan</span>
                                      </div>
                                    )}

                                    <div className="db-ng-desc-row db-ng-desc-finding">
                                      <span className="db-ng-desc-tag">Temuan:</span>
                                      <span>{ng.finding || 'Kerusakan komponen terdeteksi (NG)'}</span>
                                    </div>

                                    <div className={`db-ng-desc-row ${ng.correctiveAction ? 'db-ng-desc-action' : 'db-ng-desc-empty'}`}>
                                      <span className="db-ng-desc-tag">Tindakan:</span>
                                      <span>{ng.correctiveAction || 'Belum ada tindakan perbaikan yang diinput'}</span>
                                    </div>

                                    {ng.pic && (
                                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span>👤 PIC:</span> <strong>{ng.pic}</strong>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                                Inspeksi berstatus NG ({item.ngCount} item). Klik &quot;Perbaiki di Form&quot; untuk melihat seluruh detail pemeriksaan dan input tindakan perbaikan.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* TAMPILAN TABEL STANDAR UNTUK TOTAL / OK */
                      <div className="db-table-scroll" style={{ maxHeight: '60vh', display: 'block' }}>
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th style={{ width: 48, textAlign: 'center' }}>No</th>
                              <th>Waktu</th>
                              <th>Kategori</th>
                              <th>Area</th>
                              <th>Status</th>
                              <th>Item NG</th>
                              <th>PIC</th>
                              <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.map((item, i) => (
                              <tr key={i} className={item.ngCount > 0 ? 'db-row-warn' : ''}>
                                <td className="db-td-no">{i + 1}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.filledAt)}</td>
                                <td>{item.category || currentFormLabel}</td>
                                <td>{item.area}</td>
                                <td>
                                  <span className={`db-badge ${item.status === 'OK' ? 'db-badge--ok' : 'db-badge--ng'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td>
                                  {item.ngCount > 0
                                    ? <span className="db-ng-count">{item.ngCount} ⚠️</span>
                                    : <span className="db-ok-count">0</span>}
                                </td>
                                <td>{item.filledBy || '–'}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {item.editUrl ? (
                                    <Link href={item.editUrl} className="db-action-btn db-action-edit">
                                      ✏️ Buka
                                    </Link>
                                  ) : '–'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="db-empty">Tidak ada data untuk ditampilkan.</div>
                  )}
                </div>
                <div className="db-modal-footer">
                  <button 
                    className="db-btn db-btn-primary" 
                    onClick={downloadDetailPDF}
                    disabled={isDetailLoading || detailData.length === 0}
                  >
                    📥 Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Lightbox Preview Gambar NG ── */}
          {previewImage && (
            <div className="db-lightbox-overlay" onClick={() => setPreviewImage(null)}>
              <div className="db-lightbox-content" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="db-lightbox-close" 
                  onClick={() => setPreviewImage(null)}
                  title="Tutup Preview"
                >
                  ✕
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewImage} 
                  alt="Preview Bukti Temuan NG" 
                  className="db-lightbox-img" 
                />
                <div style={{ color: '#fff', marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                  📷 Bukti Temuan / Kerusakan NG dari Lapangan
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}