// app/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Clock, User, CheckCircle, XCircle, FileText, Camera } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
type HistoryEntry = {
  id: number;                   // ✅ Number untuk edit
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  items: Record<number, {
    itemId?: number;            // ✅ Untuk edit
    hasil: "OK" | "NOK";
    keterangan: string;
    foto_path: string | null;
    _action?: 'create' | 'update' | 'delete';
  }>;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

interface EditFormData {
  inspectionId: number;
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  additional_notes: string;
  items: Record<number, {
    itemId?: number;
    itemNo?: number;
    hasil: string;
    keterangan: string;
    foto_path: string;
    _action?: 'create' | 'update' | 'delete';
  }>;
  replaceItems?: boolean;
}

const checklistStopKontak = [
  { no: 1, item: "Kondisi Fisik Stop Kontak", detail: "Tidak retak, pecah, atau longgar" },
  { no: 2, item: "Penutup Stop Kontak", detail: "Penutup terpasang dan aman" },
  { no: 3, item: "Fungsi Stop Kontak", detail: "Berfungsi dengan baik saat diuji" },
  { no: 4, item: "Keamanan", detail: "Tidak panas dan tidak berbau" },
];

// Helpers
const formatDateOnly = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
  } catch { return dateString; }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch { return dateString; }
};

export default function RiwayatStopKontak() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // ✅ EDIT MODE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'items'>('header');

  useEffect(() => {
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      router.push("/home");
      return;
    }
    loadHistory();
  }, [user, router]);

  // ─────────────────────────────────────────────────────────────
  // 🔧 LOAD DATA FUNCTION
  // ─────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/e-checksheet-ga/api/electrical_inspections?type=instalasi-listrik&t=${Date.now()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const filtered = result.data.filter((item: HistoryEntry) => item.type === 'instalasi-listrik');
        
        // ✅ Pastikan itemId ada dari API
        const withItemIds = filtered.map((entry: HistoryEntry) => ({
          ...entry,
          id: Number(entry.id),
          items: Object.entries(entry.items || {}).reduce((acc, [itemNo, item]: [string, any]) => ({
            ...acc,
            [parseInt(itemNo)]: {
              itemId: Number(item.itemId),      // ✅ Dari API
              hasil: item.hasil,
              keterangan: item.keterangan || '',
              foto_path: item.foto_path || null
            }
          }), {})
        }));
        
        setHistory(withItemIds);
      }
    } catch (e) {
      console.error("❌ Error loading history:", e);
      alert(`Gagal memuat riwayat: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ✏️ EDIT FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const openEditModal = (entry: HistoryEntry) => {
    console.log('🔍 Opening edit for:', {
      inspectionId: entry.id,
      itemsCount: Object.keys(entry.items).length
    });

    if (!entry.id) {
      console.error('❌ Inspection ID tidak ada:', entry);
      alert('❌ Error: Data tidak valid. Silakan refresh halaman.');
      return;
    }

    setEditData({
      inspectionId: entry.id,
      type: entry.type,
      tanggal: formatDateForInput(entry.tanggal),
      area: entry.area,
      pic: entry.pic,
      additional_notes: entry.additionalNotes || '',
      items: Object.entries(entry.items).reduce((acc, [itemNo, item]) => ({
        ...acc,
        [parseInt(itemNo)]: {
          itemId: item.itemId ? Number(item.itemId) : null,
          itemNo: parseInt(itemNo),
          hasil: item.hasil,
          keterangan: item.keterangan || '',
          foto_path: item.foto_path || '',
          _action: 'update'
        }
      }), {}),
      replaceItems: false
    });
    setIsEditMode(true);
    setActiveTab('header');
  };

  const closeEditModal = () => {
    setIsEditMode(false);
    setEditData(null);
  };

  const handleHeaderChange = (field: keyof EditFormData, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleItemChange = (itemNo: number, field: keyof any, value: string) => {
    if (!editData) return;
    const updatedItems = { ...editData.items };
    if (updatedItems[itemNo]) {
      updatedItems[itemNo] = {
        ...updatedItems[itemNo],
        [field]: value,
        _action: updatedItems[itemNo]._action === 'create' ? 'create' : 'update'
      };
    }
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleFotoUpload = (itemNo: number, file: File) => {
    if (!editData) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedItems = { ...editData.items };
      if (updatedItems[itemNo]) {
        updatedItems[itemNo] = {
          ...updatedItems[itemNo],
          foto_path: reader.result as string,
          _action: updatedItems[itemNo]._action === 'create' ? 'create' : 'update'
        };
      }
      setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEdit = async () => {
    if (!editData) return;
    
    if (!editData.tanggal || !editData.area || !editData.pic) {
      alert('Harap lengkapi field Header: Tanggal, Area, dan PIC');
      setActiveTab('header');
      return;
    }

    const itemsToSubmit = Object.entries(editData.items).reduce((acc, [itemNo, item]) => ({
      ...acc,
      [itemNo]: {
        itemId: item.itemId,
        itemNo: parseInt(itemNo),
        hasil: item.hasil,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path || '',
        _action: item._action || 'update'
      }
    }), {});

    console.log('📤 Sending payload:', {
      inspectionId: editData.inspectionId,
      itemsCount: Object.keys(itemsToSubmit).length
    });

    setIsSubmitting(true);
    try {
      const response = await fetch('/e-checksheet-ga/api/electrical_inspections/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId: Number(editData.inspectionId),
          type: editData.type,
          tanggal: editData.tanggal,
          area: editData.area,
          pic: editData.pic,
          additional_notes: editData.additional_notes,
          items: itemsToSubmit,
          replaceItems: false
        })
      });
      
      const result = await response.json();
      console.log('📥 API Response:', result);
      
      if (result.success) {
        alert('✅ Data berhasil diupdate!');
        closeEditModal();
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadHistory();
      } else {
        alert('❌ Gagal update: ' + result.message);
        console.error('API Error:', result);
      }
    } catch (error) {
      console.error('✗ Edit error:', error);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;
  if (isLoading) return <div className="loading"><div className="spinner"></div><p>Loading riwayat...</p></div>;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <button onClick={() => router.back()} className="back-btn">← Kembali</button>
        <h1>📋 Riwayat Pengecekan Instalasi Listrik</h1>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Tidak ada riwayat inspeksi</p>
            <button onClick={() => router.push("/status-ga/form-inspeksi-stop-kontak/instalasi-listrik")} className="btn-primary">
              + Buat Pengecekan Baru
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry) => {
              const hasNOK = Object.values(entry.items).some(item => item?.hasil === "NOK");
              const isExpanded = expandedId === entry.id.toString();
              
              return (
                <div key={entry.id} className="history-card">
                  <div className="card-header" onClick={() => setExpandedId(isExpanded ? null : entry.id.toString())}>
                    <div className="header-info">
                      <div className="header-text">
                        <h3>{entry.area}</h3>
                        <p className="tanggal">{formatDateOnly(entry.tanggal)}</p>
                        <p className="waktu">Input: {formatDateTime(entry.createdAt)}</p>
                      </div>
                      <span className={hasNOK ? "status-nok" : "status-ok"}>
                        {hasNOK ? "⚠️ ADA MASALAH" : "✓ BAIK"}
                      </span>
                    </div>
                    <div className="card-actions-header">
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(entry); }} className="btn-edit" title="Edit">
                        ✏️
                      </button>
                      <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="card-body">
                      <div className="meta-info">
                        <div className="meta-item"><span className="meta-label">PIC:</span><span className="meta-value">{entry.pic}</span></div>
                        <div className="meta-item"><span className="meta-label">Tanggal:</span><span className="meta-value">{formatDateOnly(entry.tanggal)}</span></div>
                        <div className="meta-item"><span className="meta-label">Waktu Input:</span><span className="meta-value">{formatDateTime(entry.createdAt)}</span></div>
                      </div>
                      <div className="table-wrapper">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th className="col-no">No</th>
                              <th className="col-item">Item Pengecekan</th>
                              <th className="col-hasil">Hasil</th>
                              <th className="col-ket">Keterangan</th>
                              <th className="col-foto">Foto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {checklistStopKontak.map((item) => {
                              const data = entry.items[item.no];
                              return (
                                <tr key={item.no}>
                                  <td className="col-no">{item.no}</td>
                                  <td className="col-item">
                                    <div className="item-name">{item.item}</div>
                                    <div className="item-detail">{item.detail}</div>
                                  </td>
                                  <td className="col-hasil">
                                    <span className={`hasil-${data?.hasil?.toLowerCase()}`}>{data?.hasil || "-"}</span>
                                  </td>
                                  <td className="col-ket">{data?.keterangan || "-"}</td>
                                  <td className="col-foto">
                                    {data?.foto_path && (
                                      <img src={data.foto_path.startsWith('http') ? data.foto_path : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${data.foto_path}`} 
                                        alt="Foto" className="history-image" onClick={(e) => { e.stopPropagation(); setPreviewImage(data.foto_path); }} />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={() => setPreviewImage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setPreviewImage(null)}>✕</button>
              <img src={previewImage.startsWith('http') ? previewImage : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${previewImage}`} alt="Zoom" className="modal-image" />
            </div>
          </div>
        )}

        {/* ✅ EDIT MODAL */}
        {isEditMode && editData && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Edit Instalasi Listrik</h3>
                <button className="modal-close" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-tabs">
                <button className={`tab-btn ${activeTab === 'header' ? 'active' : ''}`} onClick={() => setActiveTab('header')}>📋 Header</button>
                <button className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>📦 Items ({Object.keys(editData.items).length})</button>
              </div>
              <div className="modal-body">
                {activeTab === 'header' ? (
                  <div className="form-section">
                    <div className="form-grid">
                      <div className="form-group"><label>Tanggal *</label><input type="date" value={editData.tanggal} onChange={(e) => handleHeaderChange('tanggal', e.target.value)} className="form-input" /></div>
                      <div className="form-group"><label>Area *</label><input type="text" value={editData.area} onChange={(e) => handleHeaderChange('area', e.target.value)} className="form-input" /></div>
                      <div className="form-group"><label>PIC *</label><input type="text" value={editData.pic} onChange={(e) => handleHeaderChange('pic', e.target.value)} className="form-input" /></div>
                      <div className="form-group full"><label>Catatan Tambahan</label><textarea value={editData.additional_notes || ''} onChange={(e) => handleHeaderChange('additional_notes', e.target.value)} className="form-textarea" rows={3} /></div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <div className="items-edit-list">
                      {Object.entries(editData.items).map(([itemNo, item]) => (
                        <div key={itemNo} className="edit-item-card">
                          <div className="edit-item-header"><span className="item-badge">Item {itemNo}</span></div>
                          <div className="edit-item-fields">
                            <div className="status-select-group">
                              <label className="status-label">Hasil</label>
                              <select value={item.hasil || 'OK'} onChange={(e) => handleItemChange(parseInt(itemNo), 'hasil', e.target.value)} className={`status-select ${item.hasil === 'NOK' ? 'nok' : 'ok'}`}>
                                <option value="OK">✅ OK</option>
                                <option value="NOK">❌ NOK</option>
                              </select>
                            </div>
                            {item.hasil === 'NOK' && (
                              <div className="form-group-small full"><label>Keterangan *</label><textarea value={item.keterangan || ''} onChange={(e) => handleItemChange(parseInt(itemNo), 'keterangan', e.target.value)} className="form-textarea-small" rows={2} /></div>
                            )}
                            <div className="form-group-small"><label>Foto</label><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFotoUpload(parseInt(itemNo), e.target.files[0])} className="form-file-small" />
                              {item.foto_path && <img src={item.foto_path} alt="Preview" className="item-foto-preview" onClick={() => setPreviewImage(item.foto_path)} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal} className="btn-modal-cancel" disabled={isSubmitting}>Batal</button>
                <button type="button" onClick={handleSubmitEdit} className="btn-modal-save" disabled={isSubmitting}>{isSubmitting ? '💾 Menyimpan...' : '💾 Simpan Perubahan'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          max-width: 1200px;
        }

        .back-btn {
          background: white;
          border: 1.5px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 24px;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }

        h1 {
          color: #0d47a1;
          margin-bottom: 24px;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top-color: #1e88e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p {
          color: #666;
          font-size: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state p {
          color: #999;
          font-size: 1.1rem;
          margin-bottom: 24px;
        }

        .btn-primary {
          padding: 12px 32px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.2);
          min-height: 44px;
        }

        .btn-primary:hover {
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
          transform: translateY(-2px);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border-left: 5px solid #1e88e5;
        }

        .history-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .card-header:hover {
          background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex: 1;
          flex-wrap: wrap;
        }

        .header-text {
          flex: 1;
          min-width: 200px;
        }

        .header-text h3 {
          margin: 0 0 6px 0;
          color: #0d47a1;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .header-text .tanggal {
          margin: 0 0 4px 0;
          color: #555;
          font-size: 0.95rem;
        }

        .header-text .waktu {
          margin: 0;
          color: #888;
          font-size: 0.85rem;
        }

        .expand-icon {
          color: #1565c0;
          font-size: 1rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .status-ok {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border-left: 3px solid #2e7d32;
          white-space: nowrap;
        }

        .status-nok {
          background: #ffebee;
          color: #c62828;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border-left: 3px solid #c62828;
          white-space: nowrap;
        }

        .card-body {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
        }

        .meta-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #f5f5f5 100%);
          border-radius: 8px;
          border-left: 4px solid #1e88e5;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
        }

        .meta-value {
          font-size: 0.95rem;
          color: #1a237e;
          font-weight: 500;
        }

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 16px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
          min-width: 600px;
        }

        .detail-table th,
        .detail-table td {
          padding: 14px;
          border-bottom: 1px solid #f0f0f0;
          text-align: left;
        }

        .detail-table th {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          font-weight: 700;
          color: #0d47a1;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .detail-table tbody tr:hover {
          background: #f8f9fa;
        }

        .col-no {
          width: 60px;
          text-align: center;
          font-weight: 600;
        }

        .col-item {
          min-width: 200px;
        }

        .item-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .item-detail {
          font-size: 0.85rem;
          color: #64748b;
        }

        .col-hasil {
          width: 120px;
          text-align: center;
        }

        .hasil-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #2e7d32;
          min-width: 60px;
        }

        .hasil-nok {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #c62828;
          min-width: 60px;
        }

        .col-ket {
          min-width: 200px;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .btn-view {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-view:hover {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          transform: translateY(-2px);
        }

        /* ✅ TABLET RESPONSIVE (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          h1 {
            font-size: 1.6rem;
          }

          .header-info {
            gap: 16px;
          }

          .status-ok,
          .status-nok {
            font-size: 0.85rem;
            padding: 6px 12px;
          }
        }

        /* ✅ TABLET OPTIMIZATION (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 18px 14px;
          }

          h1 {
            font-size: 1.5rem;
            margin-bottom: 18px;
          }

          .back-btn {
            padding: 10px 14px;
            font-size: 0.9rem;
          }

          .modal-container {
            max-width: 85vw;
            max-height: 90vh;
          }

          .form-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }

        /* ✅ MOBILE RESPONSIVE (480px - 767px) */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 12px 8px;
          }

          .back-btn {
            width: 100%;
            justify-content: center;
            min-height: 44px;
            padding: 10px 12px;
            margin-bottom: 16px;
          }

          h1 {
            font-size: 1.3rem;
            margin-bottom: 16px;
          }

          .card-header {
            padding: 12px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .header-info {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .header-text {
            width: 100%;
          }

          .header-text h3 {
            font-size: 1rem;
            font-weight: 600;
          }

          .header-text .tanggal {
            font-size: 0.85rem;
          }

          .header-text .waktu {
            font-size: 0.8rem;
          }

          .status-ok,
          .status-nok {
            padding: 8px 12px;
            font-size: 0.85rem;
            align-self: flex-start;
          }

          .expand-icon {
            position: static;
            transform: none;
            margin-top: 4px;
            text-align: right;
          }

          .meta-info {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 10px;
            margin-bottom: 12px;
          }

          .meta-item {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .meta-label {
            font-size: 0.8rem;
            min-width: 100px;
          }

          .meta-value {
            font-size: 0.85rem;
            text-align: right;
          }

          .detail-table {
            font-size: 0.85rem;
            min-width: 100%;
            overflow-x: auto;
          }

          .detail-table th,
          .detail-table td {
            padding: 10px 8px;
          }

          .col-no {
            width: 50px;
          }

          .col-hasil {
            width: 90px;
          }

          .hasil-ok,
          .hasil-nok {
            font-size: 0.8rem;
            padding: 4px 10px;
          }

          .item-detail {
            font-size: 0.8rem;
          }

          .card-body {
            padding: 12px;
          }

          .card-actions {
            flex-direction: column;
            gap: 8px;
            margin-top: 8px;
          }

          .btn-edit,
          .btn-delete {
            width: 100%;
            min-height: 44px;
            padding: 10px 12px;
            font-size: 0.9rem;
          }

          .modal-overlay {
            padding: 8px;
          }

          .modal-container {
            width: 100%;
            max-width: 100%;
            max-height: 95vh;
            border-radius: 12px 12px 0 0;
          }

          .modal-header {
            padding: 12px;
            border-radius: 12px 12px 0 0;
          }

          .modal-header h3 {
            font-size: 1.1rem;
          }

          .modal-close {
            width: 28px;
            height: 28px;
          }

          .modal-tabs {
            padding: 6px 8px;
            gap: 2px;
            overflow-x: auto;
          }

          .tab-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
            white-space: nowrap;
          }

          .modal-body {
            padding: 12px;
            max-height: calc(95vh - 200px);
            overflow-y: auto;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .form-group {
            gap: 4px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .form-input,
          .form-textarea {
            padding: 8px 10px;
            font-size: 0.9rem;
            min-height: 40px;
          }

          .items-edit-list {
            gap: 8px;
          }

          .edit-item-card {
            padding: 10px;
            border-radius: 8px;
          }

          .edit-item-header {
            gap: 6px;
            margin-bottom: 8px;
            padding-bottom: 8px;
          }

          .item-badge {
            font-size: 0.75rem;
            padding: 3px 10px;
          }

          .item-lokasi-edit {
            font-size: 0.9rem;
          }

          .status-select {
            font-size: 0.85rem;
            padding: 6px 8px;
            min-height: 40px;
          }

          .form-textarea-small {
            font-size: 0.85rem;
            padding: 8px 10px;
            min-height: 60px;
          }

          .modal-footer {
            padding: 12px;
            flex-direction: column-reverse;
            gap: 8px;
          }

          .btn-modal-cancel,
          .btn-modal-save {
            width: 100%;
            padding: 12px 16px;
            min-height: 44px;
            font-size: 0.9rem;
          }
        }

        /* ✅ SMALL MOBILE (320px - 479px) */
        @media (max-width: 479px) {
          .page-content {
            padding: 8px 6px;
          }

          .back-btn {
            padding: 8px 10px;
            font-size: 0.8rem;
            margin-bottom: 12px;
          }

          h1 {
            font-size: 1.15rem;
            margin-bottom: 12px;
          }

          .card-header {
            padding: 10px;
          }

          .header-text h3 {
            font-size: 0.95rem;
          }

          .header-text .tanggal {
            font-size: 0.8rem;
          }

          .header-text .waktu {
            font-size: 0.75rem;
          }

          .status-ok,
          .status-nok {
            font-size: 0.8rem;
            padding: 6px 10px;
          }

          .card-body {
            padding: 10px;
          }

          .meta-info {
            padding: 10px;
            gap: 6px;
          }

          .meta-label {
            font-size: 0.75rem;
            min-width: 90px;
          }

          .meta-value {
            font-size: 0.8rem;
          }

          .detail-table {
            font-size: 0.8rem;
            min-width: 100%;
          }

          .detail-table th,
          .detail-table td {
            padding: 8px 6px;
          }

          .col-no {
            width: 45px;
          }

          .hasil-ok,
          .hasil-nok {
            font-size: 0.75rem;
            padding: 3px 8px;
          }

          .modal-body {
            max-height: calc(95vh - 180px);
            padding: 10px;
          }

          .form-grid {
            gap: 8px;
          }

          .form-input,
          .form-textarea,
          .status-select {
            padding: 6px 8px;
            font-size: 0.8rem;
          }

          .form-textarea-small {
            min-height: 50px;
          }

          .btn-modal-cancel,
          .btn-modal-save {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
        }

          .header-text .tanggal {
            font-size: 0.8rem;
          }

          .status-ok,
          .status-nok {
            font-size: 0.75rem;
            padding: 6px 10px;
          }

          .detail-table {
            font-size: 0.75rem;
            min-width: 400px;
          }

          .detail-table th,
          .detail-table td {
            padding: 6px 4px;
          }

          .btn-view {
            font-size: 0.8rem;
            padding: 8px 16px;
            min-height: 40px;
          }
        }
          /* ===================================================== */
/* ✅ EDIT BUTTON (HEADER ACTIONS) */
/* ===================================================== */

.card-actions-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-edit {
  background: white;
  border: 1px solid #e0e0e0;
  font-size: 1.1rem;
  cursor: pointer;
  color: #1976d2;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit:hover {
  background: #e3f2fd;
  border-color: #1976d2;
  transform: scale(1.05);
}

/* ===================================================== */
/* ✅ EDIT MODAL STYLES */
/* ===================================================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-tabs {
  display: flex;
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 4px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #1976d2;
  color: white;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
}

.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;s
  border-radius: 8px;
  font-size: 0.95rem;
  
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.items-edit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  background: #fafbfc;
}

.edit-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.item-badge {
  background: #1976d2;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-select.ok {
  color: #059669;
  border-color: #059669;
}

.status-select.nok {
  color: #dc2626;
  border-color: #dc2626;
}

.form-textarea-small {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  resize: vertical;
}

.item-foto-preview {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  margin-top: 4px;
}

.modal-footer {
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-modal-cancel,
.btn-modal-save {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  min-height: 44px;
  min-width: 100px;
}

.btn-modal-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-modal-save {
  background: #1976d2;
  color: white;
  border: none;
}

.btn-modal-cancel:disabled,
.btn-modal-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===================================================== */
/* ✅ IMAGE PREVIEW */
/* ===================================================== */

.history-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}
      `}</style>
    </div>
  );
}