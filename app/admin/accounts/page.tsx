"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AccountTable } from "@/components/admin/AccountTable";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { ShowPasswordModal } from "@/components/admin/ShowPasswordModal";

export interface User {
  id: string;
  username: string;
  fullName: string;
  nik: string;
  department: string;
  role: string;
  isActive: boolean;
  checksheets: string[];
  createdAt: string;
  lastLogin: string | null;
  totalLogins: number;
}

const VALID_ROLES = [
  { value: "group-leader-qa", label: "Group Leader QA" },
  { value: "inspector-qa", label: "Inspector QA" },
  { value: "inspector-ga", label: "Inspector GA" },
  { value: "inspector-ga-fire", label: "Inspector GA - Fire" },
  { value: "inspector-ga-equipment", label: "Inspector GA - Equipment" },
  { value: "inspector-ga-electrical", label: "Inspector GA - Electrical" },
  { value: "inspector-ga-personal", label: "Inspector GA - Personal" },
  { value: "inspector-ga-facility", label: "Inspector GA - Facility" },
  { value: "eso", label: "ESO" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

const VALID_DEPARTMENTS = [
  { value: "quality", label: "Quality" },
  { value: "qa", label: "QA" },
  { value: "general-affairs", label: "General Affairs" },
  { value: "ga", label: "GA" },
];

export const VALID_CHECKSHEETS = [
  { key: "hydrant", label: "Hydrant" },
  { key: "selang-hydrant", label: "Selang Hydrant" },
  { key: "fire-alarm", label: "Fire Alarm" },
  { key: "smoke-detector", label: "Smoke Detector" },
  { key: "apar", label: "APAR" },
  { key: "emergency-lamp", label: "Emergency Lamp" },
  { key: "exit-lamp-pintu-darurat", label: "Exit Lamp & Pintu Darurat" },
  { key: "lift-barang", label: "Lift Barang" },
  { key: "inspeksi-preventif-lift-barang", label: "Inspeksi Preventif Lift Barang" },
  { key: "tg-listrik", label: "Tangga Listrik" },
  { key: "panel", label: "Panel Listrik" },
  { key: "form-inspeksi-stop-kontak", label: "Stop Kontak" },
  { key: "power-house", label: "Power House" },
  { key: "e-checksheet-apd", label: "APD" },
  { key: "inf-jalan", label: "Infrastruktur Jalan" },
  { key: "inspeksi-apd", label: "Inspeksi APD" },
  { key: "checksheet-toilet", label: "Toilet" },
];

// ──────────────────────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// ──────────────────────────────────────────────────────────────────────────────
function useSidebarWidth() {
  const COLLAPSED_W = 70;
  const EXPANDED_W = 240;
  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener("sidebarToggle", onToggle);
    return () => window.removeEventListener("sidebarToggle", onToggle);
  }, []);

  return sidebarW;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminAccountsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const sidebarW = useSidebarWidth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordUser, setShowPasswordUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResetRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let role = "";
      if (userStr) {
        try { role = JSON.parse(userStr).role || ""; } catch { }
      }
      if (!role) role = localStorage.getItem("userRole") || "admin";

      const res = await fetch("/e-checksheet-ga/api/admin/reset-request", {
        headers: { "x-user-role": role },
      });
      const data = await res.json();
      if (data.success) {
        setResetRequests(data.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data reset requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const handleConfirmReset = async (requestId: string) => {
    try {
      let adminId = user?.id || "";
      let role = user?.role || "";

      if (!adminId || !role) {
        const userStr = localStorage.getItem("auth_current_user_v2");
        if (userStr) {
          try {
            const adminObj = JSON.parse(userStr);
            adminId = adminId || adminObj.id || "";
            role = role || adminObj.role || "";
          } catch { }
        }
      }
      if (!role) role = localStorage.getItem("userRole") || "admin";

      const res = await fetch(`/e-checksheet-ga/api/admin/reset-request/${requestId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": adminId,
          "x-user-role": role,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengkonfirmasi request.");
      }

      showToast(data.message || "Request berhasil dikonfirmasi!");
      fetchResetRequests();
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan.", "error");
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let role = "";
      if (userStr) {
        try { role = JSON.parse(userStr).role || ""; } catch { }
      }
      if (!role) role = localStorage.getItem("userRole") || "admin";

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterRole) params.set("role", filterRole);
      if (filterDepartment) params.set("department", filterDepartment);

      const res = await fetch(`/e-checksheet-ga/api/auth/users?${params.toString()}`, {
        headers: { "x-user-role": role },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Respon server tidak valid (${res.status})`);
      }

      if (data.success) {
        let filtered = data.data;
        if (filterStatus === "active") {
          filtered = filtered.filter((u: User) => u.isActive);
        } else if (filterStatus === "inactive") {
          filtered = filtered.filter((u: User) => !u.isActive);
        }
        setUsers(filtered);
      } else {
        showToast(data.error || "Gagal memuat data", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterDepartment, filterStatus]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      router.push("/e-checksheet-ga/login-page");
      return;
    }
    if (!["admin", "superadmin"].includes(user.role)) {
      router.push("/home");
    }
  }, [user, authLoading, isInitialized, router]);

  useEffect(() => {
    if (user && !authLoading && isInitialized) {
      fetchUsers();
      fetchResetRequests();
    }
  }, [fetchUsers, fetchResetRequests, user, authLoading, isInitialized]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let role = "";
      if (userStr) {
        try { role = JSON.parse(userStr).role || ""; } catch { }
      }
      if (!role) role = localStorage.getItem("userRole") || "admin";

      const res = await fetch(`/e-checksheet-ga/api/auth/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { "x-user-role": role },
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Akun "${selectedUser.fullName}" berhasil dinonaktifkan`);
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal menonaktifkan akun", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers();
    showToast("Data akun berhasil diperbarui!");
  };

  const handleUserCreated = () => {
    setShowAddModal(false);
    fetchUsers();
    showToast("Akun baru berhasil dibuat!");
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const pendingResets = resetRequests.filter((r) => r.status === "PENDING").length;
  const hasActiveFilters = search !== "" || filterRole !== "" || filterDepartment !== "" || filterStatus !== "all";

  if (authLoading || !isInitialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4f8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "#1e88e5", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Memuat...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return null;

  const mainStyle: React.CSSProperties = {
    marginLeft: sidebarW,
    padding: 24,
    minHeight: "100vh",
    background: "#f0f4f8",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <>
      <Sidebar userName={user.fullName || user.username} />
      <main className="wr-main" style={mainStyle}>

        {/* ── TOAST NOTIFICATION ── */}
        {toast && (
          <div className={`wr-toast ${toast.type === "success" ? "wr-toast-success" : "wr-toast-error"}`}>
            <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => setToast(null)}>✕</button>
          </div>
        )}

        {/* ── HEADER BANNER ── */}
        <div className="wr-header">
          <div className="wr-header-banner">
            <div className="wr-header-banner-bg" />
            <div className="wr-header-content">
              <div className="wr-header-left">
                <div className="wr-header-icon-wrap">
                  <span style={{ fontSize: 30, lineHeight: 1 }}>🛡️</span>
                </div>
                <div>
                  <h1 className="wr-title">Account Management</h1>
                  <p className="wr-subtitle">Kelola seluruh akun, role, dan permission sistem</p>
                </div>
              </div>
              <div className="wr-header-right">
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{totalUsers}</span>
                  <span className="wr-stat-label">Total</span>
                </div>
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{activeUsers}</span>
                  <span className="wr-stat-label">Active</span>
                </div>
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{inactiveUsers}</span>
                  <span className="wr-stat-label">Inactive</span>
                </div>
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{pendingResets}</span>
                  <span className="wr-stat-label">Req Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH CARD ── */}
        <div className="wr-card">
          <div className="wr-card-header">
            <h2>🔍 Filter & Pencarian</h2>
            <p className="wr-card-desc">Gunakan filter di bawah untuk mempersempit daftar user</p>
          </div>

          <div className="wr-form-grid">
            <div className="wr-form-group full-width">
              <label htmlFor="search">Pencarian</label>
              <div className="password-wrapper">
                <input
                  id="search"
                  type="text"
                  placeholder="Cari username, nama, atau NIK..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="wr-search-input"
                />
                {search && (
                  <button type="button" className="toggle-password" onClick={() => setSearch("")}>✕</button>
                )}
              </div>
            </div>

            <div className="wr-form-group">
              <label>Role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">Semua Role</option>
                {VALID_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="wr-form-group">
              <label>Departemen</label>
              <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="">Semua Departemen</option>
                {VALID_DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="wr-form-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                <option value="all">Semua Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="wr-form-actions">
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setFilterRole("");
                  setFilterDepartment("");
                  setFilterStatus("all");
                }}
              >
                ✕ Clear Filter
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                fetchUsers();
                fetchResetRequests();
              }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Memuat...</> : "🔄 Refresh Data"}
            </button>
          </div>
        </div>

        {/* ── PASSWORD RESET REQUESTS CARD ── */}
        {pendingResets > 0 && (
          <div className="wr-card" style={{ borderColor: "#fbbf24", background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
            <div className="wr-card-header" style={{ borderBottomColor: "#fde68a" }}>
              <h2 style={{ color: "#92400e" }}>🔔 Reset Requests</h2>
              <p className="wr-card-desc" style={{ color: "#a16207" }}>
                {pendingResets} permintaan menunggu konfirmasi admin
              </p>
            </div>

            <div className="reset-requests-grid">
              {resetRequests.filter((r) => r.status === "PENDING").map((req) => (
                <div key={req.id} className="reset-request-card">
                  <div className="reset-request-avatar">
                    {(req.fullName?.charAt(0) || "U").toUpperCase()}
                  </div>
                  <div className="reset-request-info">
                    <strong>{req.fullName}</strong>
                    <span className="reset-request-username">@{req.username}</span>
                    <span
                      className={`reset-request-type-badge ${req.requestType === "username" ? "badge-username" : "badge-password"
                        }`}
                    >
                      {req.requestType === "username" ? "🏷️ Reset Username" : "🔑 Reset Password"}
                    </span>
                    <span className="reset-request-time">⏳ {timeAgo(req.requestedAt)}</span>
                  </div>
                  <button
                    className="btn-primary btn-sm-approve"
                    onClick={() => handleConfirmReset(req.id)}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TABLE CARD ── */}
        <div className="wr-card">
          <div className="wr-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>📋 Daftar Akun User</h2>
              <p className="wr-card-desc">Menampilkan {users.length} akun dari total {totalUsers} user terdaftar</p>
            </div>
          </div>

          <div className="table-wrapper">
            <AccountTable
              users={users}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShowPassword={(user) => setShowPasswordUser(user)}
            />
          </div>
        </div>

        {/* ── MODALS ── */}
        {showPasswordUser && (
          <ShowPasswordModal targetUser={showPasswordUser} onClose={() => setShowPasswordUser(null)} />
        )}
        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
            onSuccess={handleUserUpdated}
          />
        )}
        {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSuccess={handleUserCreated} />}
        {showDeleteModal && selectedUser && (
          <DeleteConfirmModal
            user={selectedUser}
            onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </main>

      {/* ────────────────────────────────────────────────────────────────────────────── */}
      {/* STYLES (Diimpor dari halaman Registrasi + Penyesuaian Table & Toast)           */}
      {/* ────────────────────────────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* ════════════════════════════════════════════════════════════
           MAIN LAYOUT & HEADER
        ════════════════════════════════════════════════════════════ */
        .wr-main {
          padding: 24px;
          min-height: 100vh;
          background: #f0f4f8;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .wr-header { margin-bottom: 24px; }
        .wr-header-banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 55%, #1565c0 100%);
          border-radius: 16px;
          box-shadow: 0 6px 28px rgba(21, 101, 192, 0.28);
        }
        .wr-header-banner-bg {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 18% 60%, rgba(30, 136, 229, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.06) 0%, transparent 40%);
          pointer-events: none;
        }
        .wr-header-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .wr-header-left { display: flex; align-items: center; gap: 18px; }
        .wr-header-icon-wrap {
          width: 58px; height: 58px;
          background: rgba(255, 255, 255, 0.13);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wr-title { margin: 0 0 5px; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
        .wr-subtitle { margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.62); }
        .wr-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .wr-stat-badge {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px; padding: 10px 20px; min-width: 76px;
        }
        .wr-stat-number { font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1; letter-spacing: -1px; }
        .wr-stat-label { font-size: 10px; color: rgba(255, 255, 255, 0.58); font-weight: 500; margin-top: 3px; text-transform: uppercase; }

        /* ════════════════════════════════════════════════════════════
           TOAST NOTIFICATION
        ════════════════════════════════════════════════════════════ */
        .wr-toast {
          position: fixed; top: 24px; right: 24px; z-index: 9999;
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          font-size: 13px; font-weight: 600;
          animation: slideIn 0.3s ease;
          max-width: 360px;
        }
        .wr-toast-success { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-left: 4px solid #22c55e; color: #166534; }
        .wr-toast-error { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-left: 4px solid #ef4444; color: #991b1b; }
        .wr-toast button { background: none; border: none; font-size: 16px; cursor: pointer; opacity: 0.6; margin-left: 8px; color: inherit; }
        .wr-toast button:hover { opacity: 1; }

        /* ════════════════════════════════════════════════════════════
           CARDS & FORMS
        ════════════════════════════════════════════════════════════ */
        .wr-card {
          background: white; border-radius: 16px; padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          margin-bottom: 24px; border: 2px solid #f1f5f9;
        }
        .wr-card-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .wr-card-header h2 { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #1e293b; }
        .wr-card-desc { margin: 0; font-size: 13px; color: #64748b; }
        
        .wr-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .wr-form-group { display: flex; flex-direction: column; gap: 6px; }
        .wr-form-group.full-width { grid-column: 1 / -1; }
        .wr-form-group label { font-size: 13px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 4px; }
        
        .wr-form-group input, .wr-form-group select {
          padding: 12px 14px; border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .wr-form-group input:focus, .wr-form-group select:focus {
          border-color: #1e88e5; box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.15);
        }
        .wr-search-input { padding-right: 40px !important; }

        /* ════════════════════════════════════════════════════════════
           RESET REQUESTS
        ════════════════════════════════════════════════════════════ */
        .reset-requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .reset-request-card {
          display: flex; align-items: center; gap: 14px;
          background: #ffffff; border: 1.5px solid #fde68a;
          border-radius: 10px; padding: 14px;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.08);
          transition: all 0.2s;
        }
        .reset-request-card:hover { border-color: #fbbf24; transform: translateY(-2px); }
        .reset-request-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 16px; flex-shrink: 0;
        }
        .reset-request-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .reset-request-info strong { font-size: 13px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .reset-request-username { font-size: 11px; color: #64748b; font-family: monospace; }
        .reset-request-time { font-size: 10px; color: #92400e; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .reset-request-type-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          border-radius: 10px; margin-top: 2px; width: fit-content;
        }
        .badge-password { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .badge-username { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
        .btn-sm-approve { padding: 6px 14px; font-size: 12px; white-space: nowrap; flex-shrink: 0; }

        /* ════════════════════════════════════════════════════════════
           ACTIONS & BUTTONS
        ════════════════════════════════════════════════════════════ */
        .wr-form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .btn-primary {
          padding: 12px 24px; background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(30, 136, 229, 0.35); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .btn-secondary {
          padding: 12px 20px; background: #f1f5f9; color: #475569;
          border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* ════════════════════════════════════════════════════════════
           PASSWORD TOGGLE & TABLE WRAPPER
        ════════════════════════════════════════════════════════════ */
        .password-wrapper { position: relative; display: flex; align-items: center; }
        .password-wrapper input { width: 100%; padding-right: 40px; }
        .toggle-password {
          position: absolute; right: 10px; background: none; border: none;
          font-size: 16px; cursor: pointer; padding: 4px; opacity: 0.7;
        }
        .toggle-password:hover { opacity: 1; }
        .table-wrapper { overflow-x: auto; margin-top: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }

        /* ════════════════════════════════════════════════════════════
           RESPONSIVE
        ════════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .wr-main { margin-left: 0 !important; padding: 12px; }
          .wr-header-content { padding: 16px 18px; flex-direction: column; align-items: flex-start; }
          .wr-header-right { width: 100%; justify-content: space-between; }
          .wr-stat-badge { flex: 1; min-width: unset; }
          .wr-form-grid { grid-template-columns: 1fr; }
          .wr-form-actions { flex-direction: column-reverse; }
          .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
          .reset-requests-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}