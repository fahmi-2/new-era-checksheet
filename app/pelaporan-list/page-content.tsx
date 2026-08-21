"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import { ChatComponent } from "@/components/chat-component"
import Link from "next/link"
import { Search, Filter, X, Calendar, Clock, Building2, User, AlertCircle, CheckCircle2, CircleDot, MessageSquare, ChevronRight } from "lucide-react"

interface PelaporanData {
  id: string
  tanggal: string
  mainType: string
  subType: string
  checkPoint: string
  shift: string
  ngNotes: string
  department: string
  reporter: string
  reportedAt: string
  status: "open" | "in-progress" | "closed"
  ngItemsDetail?: Array<{ name: string; notes: string }>
  relatedCheckKey: string
  initialNgItems: string[]
}

export default function PelaporanListPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [redirected, setRedirected] = useState(false)

  const [pelaporan, setPelaporan] = useState<PelaporanData[]>([])
  const [filteredPelaporan, setFilteredPelaporan] = useState<PelaporanData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<PelaporanData | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in-progress" | "closed">("all")
  const [filterDept, setFilterDept] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [departments, setDepartments] = useState<Set<string>>(new Set())
  const [selectedReportMessages, setSelectedReportMessages] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (redirected) return;
    if (!user) {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  useEffect(() => {
    if (redirected) return;
    const selectedId = searchParams.get("selectedId")
    if (selectedId && pelaporan.length > 0) {
      const found = pelaporan.find((p) => p.id === selectedId)
      if (found) {
        setSelectedReport(found)
        setTimeout(() => {
          const reportDetail = document.getElementById("report-detail-section")
          if (reportDetail) {
            reportDetail.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
      }
    }
  }, [searchParams, pelaporan])

  useEffect(() => {
    if (redirected) return;
    const loadData = () => {
      try {
        const saved = localStorage.getItem("ngReports")
        const reports = saved ? JSON.parse(saved) : []
        setPelaporan(reports)
        const depts = new Set<string>(reports.map((r: PelaporanData) => r.department))
        setDepartments(depts)
      } catch (error) {
        console.error("Error loading pelaporan:", error)
        setPelaporan([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    const handler = () => loadData()
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  useEffect(() => {
    if (redirected) return;
    let filtered = pelaporan
    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus)
    }
    if (filterDept !== "all") {
      filtered = filtered.filter((p) => p.department === filterDept)
    }
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.checkPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ngNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    setFilteredPelaporan(filtered)
  }, [pelaporan, filterStatus, filterDept, searchQuery])

  const handleStatusUpdate = (reportId: string, newStatus: "open" | "in-progress" | "closed") => {
    const updated = pelaporan.map((p) =>
      p.id === reportId ? { ...p, status: newStatus } : p
    )
    setPelaporan(updated)
    localStorage.setItem("ngReports", JSON.stringify(updated))
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, status: newStatus })
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return { color: "status-open", label: "Buka", icon: AlertCircle }
      case "in-progress":
        return { color: "status-in-progress", label: "Proses", icon: CircleDot }
      case "closed":
        return { color: "status-closed", label: "Selesai", icon: CheckCircle2 }
      default:
        return { color: "", label: status, icon: AlertCircle }
    }
  }

  const statusCounts = {
    all: pelaporan.length,
    open: pelaporan.filter(p => p.status === "open").length,
    "in-progress": pelaporan.filter(p => p.status === "in-progress").length,
    closed: pelaporan.filter(p => p.status === "closed").length
  }

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-modern">
          <div className="header-content">
            <div className="header-title-section">
              <h1 className="page-title">📋 Daftar Laporan NG</h1>
              <p className="page-subtitle">Kelola dan diskusikan semua laporan NG dengan departemen terkait</p>
            </div>
            
            <div className="status-summary-cards">
              <div className="summary-card summary-all">
                <div className="summary-count">{statusCounts.all}</div>
                <div className="summary-label">Total Laporan</div>
              </div>
              <div className="summary-card summary-open">
                <div className="summary-count">{statusCounts.open}</div>
                <div className="summary-label">Buka</div>
              </div>
              <div className="summary-card summary-progress">
                <div className="summary-count">{statusCounts["in-progress"]}</div>
                <div className="summary-label">Proses</div>
              </div>
              <div className="summary-card summary-closed">
                <div className="summary-count">{statusCounts.closed}</div>
                <div className="summary-label">Selesai</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pelaporan-layout">
          <div className="pelaporan-list-section">
            <div className="search-filter-container">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Cari checkpoint, deskripsi, atau departemen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                Filter
                {(filterStatus !== "all" || filterDept !== "all") && (
                  <span className="filter-badge">●</span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <div className="filter-group-modern">
                  <label className="filter-label">
                    <AlertCircle size={16} />
                    Status
                  </label>
                  <div className="filter-chips">
                    {(["all", "open", "in-progress", "closed"] as const).map((status) => (
                      <button
                        key={status}
                        className={`filter-chip ${filterStatus === status ? "active" : ""}`}
                        onClick={() => setFilterStatus(status)}
                      >
                        {status === "all" ? "Semua" : getStatusConfig(status).label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group-modern">
                  <label className="filter-label">
                    <Building2 size={16} />
                    Departemen
                  </label>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="filter-select-modern"
                  >
                    <option value="all">Semua Departemen</option>
                    {Array.from(departments).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {(filterStatus !== "all" || filterDept !== "all") && (
                  <button
                    className="clear-filters-btn"
                    onClick={() => {
                      setFilterStatus("all")
                      setFilterDept("all")
                    }}
                  >
                    <X size={16} />
                    Hapus Filter
                  </button>
                )}
              </div>
            )}

            <div className="results-info">
              Menampilkan <strong>{filteredPelaporan.length}</strong> dari <strong>{pelaporan.length}</strong> laporan
            </div>

            <div className="reports-list">
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Memuat laporan...</p>
                </div>
              ) : filteredPelaporan.length === 0 ? (
                <div className="empty-state-modern">
                  <div className="empty-icon">📭</div>
                  <h3>Tidak Ada Laporan</h3>
                  <p>Tidak ada laporan yang cocok dengan filter yang dipilih</p>
                  <Link href="/home" className="btn btn-primary">
                    Kembali ke Beranda
                  </Link>
                </div>
              ) : (
                filteredPelaporan.map((report) => {
                  const statusConfig = getStatusConfig(report.status)
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <div
                      key={report.id}
                      className={`report-card-modern ${selectedReport?.id === report.id ? "active" : ""}`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="report-card-header">
                        <div className="report-main-info">
                          <h3 className="report-checkpoint">{report.checkPoint}</h3>
                          <p className="report-dept">{report.department}</p>
                        </div>
                        <div className={`status-badge-modern ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </div>
                      </div>

                      <div className="report-meta-grid">
                        <div className="meta-item">
                          <Calendar size={14} />
                          <span>{new Date(report.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>Shift {report.shift}</span>
                        </div>
                      </div>

                      {report.ngNotes && (
                        <div className="report-preview-modern">
                          {report.ngNotes}
                        </div>
                      )}

                      <div className="report-footer-modern">
                        <div className="reporter-info">
                          <User size={14} />
                          {report.reporter}
                        </div>
                        <div className="report-actions">
                          {selectedReportMessages > 0 && selectedReport?.id === report.id && (
                            <span className="message-count-badge">
                              <MessageSquare size={14} />
                              {selectedReportMessages}
                            </span>
                          )}
                          <ChevronRight size={18} className="chevron-icon" />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {selectedReport && (
            <div className="pelaporan-detail-section-modern" id="report-detail-section">
              <div className="detail-header-modern">
                <div>
                  <h2 className="detail-title">{selectedReport.checkPoint}</h2>
                  <p className="detail-subtitle">{selectedReport.department}</p>
                </div>
                <button className="btn-close-modern" onClick={() => setSelectedReport(null)}>
                  <X size={24} />
                </button>
              </div>

                <div className="detail-scroll-container">
                  <div className="status-update-section">
                    <label className="section-label">Status Laporan</label>
                    <div className="status-buttons-modern">
                      {(["open", "in-progress", "closed"] as const).map((status) => {
                        const config = getStatusConfig(status)
                        const StatusIcon = config.icon
                        return (
                        <button
                          key={status}
                          className={`btn-status-modern ${selectedReport.status === status ? "active" : ""} ${config.color}`}
                          onClick={() => handleStatusUpdate(selectedReport.id, status)}
                        >
                          <StatusIcon size={18} />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="info-section-modern">
                  <h3 className="section-title">📋 Informasi Laporan</h3>
                  
                  <div className="info-cards-grid">
                    <div className="info-card">
                      <Calendar className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Tanggal</div>
                        <div className="info-value">{new Date(selectedReport.tanggal).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>

                    <div className="info-card">
                      <Clock className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Shift</div>
                        <div className="info-value">{selectedReport.shift}</div>
                      </div>
                    </div>

                    <div className="info-card">
                      <Building2 className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Area</div>
                        <div className="info-value">{selectedReport.mainType === "pre-assy" ? "Pre Assy" : "Final Assy"}</div>
                      </div>
                    </div>

                    <div className="info-card">
                      <Building2 className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Departemen Tujuan</div>
                        <div className="info-value">{selectedReport.department}</div>
                      </div>
                    </div>

                    <div className="info-card">
                      <User className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Pelapor</div>
                        <div className="info-value">{selectedReport.reporter}</div>
                      </div>
                    </div>

                    <div className="info-card">
                      <Clock className="info-icon" size={20} />
                      <div className="info-content">
                        <div className="info-label">Waktu Lapor</div>
                        <div className="info-value">{new Date(selectedReport.reportedAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>

                  {selectedReport.ngNotes && (
                    <div className="notes-card-modern">
                      <div className="card-header">
                        <AlertCircle size={18} />
                        <span>Deskripsi Masalah</span>
                      </div>
                      <p className="notes-content">{selectedReport.ngNotes}</p>
                    </div>
                  )}

                  {selectedReport.ngItemsDetail && selectedReport.ngItemsDetail.length > 0 && (
                    <div className="items-card-modern">
                      <div className="card-header">
                        <AlertCircle size={18} />
                        <span>Item yang NG ({selectedReport.ngItemsDetail.length})</span>
                      </div>
                      <div className="ng-items-grid">
                        {selectedReport.ngItemsDetail.map((item, idx) => (
                          <div key={idx} className="ng-item-card">
                            <div className="ng-item-number">{idx + 1}</div>
                            <div className="ng-item-content">
                              <strong className="ng-item-name">{item.name}</strong>
                              {item.notes && <p className="ng-item-notes">{item.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-section-modern">
  <h3 className="section-title">💬 Diskusi</h3>
  <div className="chat-messages-container">
    <ChatComponent
      pelaporanId={selectedReport.id}
      currentUserName={user.fullName}
      currentUserRole={selectedReport.reporter === user.fullName ? "reporter" : "department"}
      departmentName={selectedReport.department}
      onMessagesChange={(messages) => setSelectedReportMessages(messages.length)}
    />
  </div>
</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
  .page-content {
    padding: 24px;
    max-width: 1600px;
    margin: 0 auto;
    margin-left: 75px; /* ← SESUAIKAN DENGAN LEBAR SIDEBAR */
  }

  .header-modern {
    margin-bottom: 32px;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ✅ CARD BOX UNTUK TITLE */
  .header-title-section {
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  .page-title {
    margin: 0;
    font-size: 2.25rem;
    font-weight: 700;
    color: #1e3a8a; /* Biru gelap */
  }

  .page-subtitle {
    margin: 8px 0 0 0;
    color: #64748b;
    font-size: 1rem;
  }

  .status-summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
  }

  .summary-card {
    background: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }

  .summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .summary-all {
    border-color: #e2e8f0;
  }

  .summary-all:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }

  .summary-open {
    border-color: #fee2e2;
  }

  .summary-open:hover {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  }

  .summary-progress {
    border-color: #fef3c7;
  }

  .summary-progress:hover {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }

  .summary-closed {
    border-color: #d1fae5;
  }

  .summary-closed:hover {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
  }

  .summary-count {
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .pelaporan-layout {
    display: grid;
    grid-template-columns: 450px 1fr;
    gap: 24px;
    height: calc(100vh - 280px);
  }

  .pelaporan-list-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .search-filter-container {
    display: flex;
    gap: 12px;
  }

  .search-box {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 16px;
    color: #94a3b8;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 12px 44px 12px 48px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .clear-search {
    position: absolute;
    right: 12px;
    background: #f1f5f9;
    border: none;
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s;
  }

  .clear-search:hover {
    background: #e2e8f0;
  }

  .filter-toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .filter-toggle-btn:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .filter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    color: #ef4444;
    font-size: 1.5rem;
  }

  .filters-panel {
    background: white;
    padding: 20px;
    border-radius: 16px;
    border: 2px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .filter-group-modern {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    color: #334155;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-chip {
    padding: 8px 16px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .filter-chip:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .filter-chip.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .filter-select-modern {
    padding: 10px 14px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .filter-select-modern:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .clear-filters-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 10px;
    color: #dc2626;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .clear-filters-btn:hover {
    background: #fee2e2;
    border-color: #ef4444;
  }

  .results-info {
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 10px;
    font-size: 0.875rem;
    color: #64748b;
  }

  .results-info strong {
    color: #0f172a;
    font-weight: 600;
  }

  .reports-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 8px;
  }

  .reports-list::-webkit-scrollbar {
    width: 8px;
  }

  .reports-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .reports-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }

  .reports-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state-modern {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    gap: 16px;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 8px;
  }

  .empty-state-modern h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #334155;
  }

  .empty-state-modern p {
    margin: 0;
    color: #64748b;
  }

  .btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    display: inline-block;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .report-card-modern {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .report-card-modern::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: #3b82f6;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .report-card-modern:hover::before {
    opacity: 1;
  }

  .report-card-modern.active {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .report-card-modern.active::before {
    opacity: 1;
  }

  .report-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .report-main-info {
    flex: 1;
    min-width: 0;
  }

  .report-checkpoint {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .report-dept {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .status-badge-modern {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-open {
    background: #fef2f2;
    color: #dc2626;
  }

  .status-in-progress {
    background: #fffbeb;
    color: #d97706;
  }

  .status-closed {
    background: #f0fdf4;
    color: #16a34a;
  }

  .report-meta-grid {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #64748b;
  }

  .report-preview-modern {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 10px;
    font-size: 0.9rem;
    color: #334155;
    line-height: 1.5;
    border-left: 3px solid #3b82f6;
  }

  .report-footer-modern {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  .reporter-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #64748b;
  }

  .report-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .message-count-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #dc2626;
    color: white;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .chevron-icon {
    color: #94a3b8;
    transition: transform 0.3s ease;
  }

  .report-card-modern:hover .chevron-icon {
    transform: translateX(4px);
  }

  .pelaporan-detail-section-modern {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .detail-header-modern {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 28px;
    border-bottom: 2px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .detail-title {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .detail-subtitle {
    margin: 0;
    font-size: 0.95rem;
    color: #64748b;
    font-weight: 500;
  }

  .btn-close-modern {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .btn-close-modern:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  .detail-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* 👇 Tambahkan ini */
  height: calc(100vh - 300px);
  max-height: calc(100vh - 300px);
}

  .status-update-section {
    background: #f8fafc;
    padding: 20px;
    border-radius: 16px;
    border: 2px solid #e2e8f0;
  }

  .section-label {
    display: block;
    margin-bottom: 16px;
    font-weight: 600;
    color: #1e293b;
    font-size: 1rem;
  }

  .status-buttons-modern {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-status-modern {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: white;
  }

  .btn-status-modern:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .btn-status-modern.active {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .status-open.active {
    background: #fee2e2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .status-in-progress.active {
    background: #fffbeb;
    border-color: #fde68a;
    color: #d97706;
  }

  .status-closed.active {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #16a34a;
  }

  .info-section-modern {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
  }

  .info-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .info-card {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .info-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
  }

  .info-icon {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-content {
    flex: 1;
    min-width: 0;
  }

  .info-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .info-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    word-break: break-word;
  }

  .notes-card-modern,
  .items-card-modern {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
    color: #dc2626;
    font-weight: 600;
  }

  .notes-content {
    margin: 0;
    line-height: 1.6;
    color: #334155;
    white-space: pre-wrap;
  }

  .ng-items-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ng-item-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 10px;
    border-left: 3px solid #dc2626;
  }

  .ng-item-number {
    background: #dc2626;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .ng-item-content {
    flex: 1;
    min-width: 0;
  }

  .ng-item-name {
    display: block;
    margin-bottom: 4px;
    color: #1e293b;
    font-weight: 600;
  }

  .ng-item-notes {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .chat-section-modern {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    
  }
    .chat-section-modern {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  height: 400px; /* Atur tinggi sesuai kebutuhan */
  display: flex;
  flex-direction: column;
}

.chat-section-modern > h3.section-title {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
}

/* ✅ Scrollable chat container */
.chat-section-modern > div:not(.section-title) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}
  

  @media (max-width: 1200px) {
    .pelaporan-layout {
      grid-template-columns: 1fr;
      height: auto;
    }
    
    .pelaporan-detail-section-modern {
      background: white;
      border-radius: 16px;  
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }

    .page-content {
      padding: 20px 16px;
    }

    .report-card.modern {
      padding: 16px;
    }
  }

  @media (max-width: 768px) {
    .page-content {
      margin-left: 0;
      padding: 16px 12px;
    }
      
    .detail-scroll-container {
      height: calc(100vh - 250px);
      max-height: calc(100vh - 250px);
      padding: 16px 12px;
    }
    
    .header-content {
      gap: 16px;
      flex-direction: column;
    }
    
    .page-title {
      font-size: 1.75rem;
    }
    
    .status-summary-cards {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .search-filter-container {
      flex-direction: column;
      gap: 12px;
    }
    
    .filter-toggle-btn {
      justify-content: center;
      width: 100%;
    }
    
    .reports-list {
      padding-right: 0;
    }
    
    .report-card-modern {
      padding: 14px;
      margin-bottom: 12px;
    }
    
    .report-card-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .report-main-info,
    .status-badge-modern {
      width: 100%;
    }

    .status-badge-modern {
      min-height: 36px;
    }
    
    .report-meta-grid {
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .report-footer-modern {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding-top: 12px;
    }
    
    .report-actions {
      justify-content: space-between;
      width: 100%;
    }

    .detail-header-modern {
      padding: 16px 20px;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .detail-title {
      font-size: 1.25rem;
      margin-bottom: 4px;
    }

    .btn-close-modern {
      align-self: flex-end;
      margin-top: -8px;
    }

    .info-card {
      padding: 12px;
      font-size: 0.9rem;
    }

    .notes-card-modern,
    .items-card-modern {
      padding: 16px;
      border-radius: 10px;
    }

    .card-header {
      font-size: 0.95rem;
      margin-bottom: 12px;
    }

    .ng-item-card {
      padding: 10px;
      gap: 10px;
    }

    .chat-section-modern {
      height: 300px;
    }
  }

  @media (max-width: 480px) {
    .page-content {
      margin-left: 0;
      padding: 12px 8px;
    }

    .header-content {
      gap: 12px;
      flex-direction: column;
      align-items: flex-start;
    }

    .page-title {
      font-size: 1.4rem;
      margin-bottom: 8px;
    }

    .header-actions {
      width: 100%;
      gap: 8px;
    }

    .page-description {
      font-size: 0.85rem;
    }

    .status-summary-cards {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .summary-card {
      padding: 10px;
    }

    .summary-count {
      font-size: 1.5rem;
    }

    .summary-label {
      font-size: 0.7rem;
    }

    .search-filter-container {
      flex-direction: column;
      gap: 8px;
    }

    .search-input {
      font-size: 14px;
      padding: 8px 12px;
      min-height: 40px;
    }

    .filter-toggle-btn {
      width: 100%;
      padding: 8px 12px;
      font-size: 0.85rem;
      min-height: 40px;
    }

    .reports-section-title {
      font-size: 1rem;
      margin-top: 12px;
    }

    .report-card-modern {
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 10px;
    }

    .report-checkpoint {
      font-size: 0.95rem;
      margin-bottom: 6px;
    }

    .report-dept {
      font-size: 0.75rem;
    }

    .status-badge-modern {
      padding: 4px 10px;
      font-size: 0.7rem;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .report-meta-grid {
      gap: 8px;
      margin-bottom: 10px;
    }

    .meta-item {
      font-size: 0.75rem;
      gap: 4px;
    }

    .meta-item svg {
      width: 14px;
      height: 14px;
    }

    .report-preview-modern {
      margin-bottom: 10px;
      padding: 10px;
      font-size: 0.8rem;
      border-radius: 8px;
    }

    .report-footer-modern {
      gap: 8px;
      padding-top: 10px;
    }

    .reporter-info {
      font-size: 0.75rem;
      gap: 4px;
    }

    .message-count-badge {
      padding: 2px 6px;
      font-size: 0.65rem;
    }

    .chevron-icon {
      width: 18px;
      height: 18px;
    }

    .pelaporan-detail-section-modern {
      margin-top: 12px;
      border-radius: 12px;
    }

    .detail-header-modern {
      padding: 12px 16px;
      gap: 8px;
      border-radius: 12px 12px 0 0;
    }

    .detail-title {
      font-size: 1.1rem;
      margin-bottom: 2px;
    }

    .detail-subtitle {
      font-size: 0.8rem;
    }

    .btn-close-modern {
      padding: 4px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .detail-scroll-container {
      padding: 12px;
    }

    .status-update-section {
      padding: 12px;
      gap: 8px;
    }

    .status-button {
      padding: 6px 10px;
      font-size: 0.75rem;
      min-height: 36px;
    }

    .info-card {
      padding: 10px;
      gap: 8px;
    }

    .info-label {
      font-size: 0.75rem;
    }

    .info-value {
      font-size: 0.9rem;
    }

    .notes-card-modern,
    .items-card-modern {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .card-header {
      font-size: 0.85rem;
      margin-bottom: 10px;
      gap: 6px;
    }

    .notes-content {
      font-size: 0.8rem;
      line-height: 1.5;
    }

    .ng-items-grid {
      gap: 8px;
    }

    .ng-item-card {
      padding: 8px;
      gap: 8px;
      border-radius: 8px;
    }

    .ng-item-number {
      width: 20px;
      height: 20px;
      font-size: 0.75rem;
    }

    .ng-item-name {
      font-size: 0.85rem;
      margin-bottom: 2px;
    }

    .ng-item-notes {
      font-size: 0.75rem;
    }

    .chat-section-modern {
      height: 250px;
      border-radius: 8px;
    }

    .chat-section-modern > h3.section-title {
      padding: 10px 12px;
      font-size: 0.9rem;
    }

    .chat-section-modern > div:not(.section-title) {
      padding: 8px;
    }

    #report-detail-section {
      margin-top: 12px;
    }

    .empty-state {
      padding: 20px;
      text-align: center;
    }

    .empty-message {
      font-size: 0.9rem;
    }
  }
`}</style>
    </div>
  );
}