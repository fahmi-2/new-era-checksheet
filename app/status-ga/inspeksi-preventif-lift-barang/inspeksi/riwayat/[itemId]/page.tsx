// app/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/[itemId]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Clock, User, CheckCircle, XCircle, FileText, Wrench, Camera } from "lucide-react";

// ✅ Data item langsung di dalam file
const inspectionItems = [
  { id: "1", label: "PONDASI / BAUT PENGIKAT" },
  { id: "2", label: "KOLOM / RANGKA" },
  { id: "3", label: "SANGKAR" },
  { id: "4", label: "BEAM DUDUKAN MOTOR HOIST" },
  { id: "5", label: "REL PEMANDU" },
  { id: "6", label: "RODA PENGGERAK (NAIK - TURUN)" },
  { id: "7", label: "RODA IDLE" },
  { id: "8", label: "PEREDAM / PENYANGGA" },
  { id: "9", label: "MOTOR HOIST & GEAR BOX" },
  { id: "10", label: "PULLY / CAKRA" },
  { id: "11", label: "KAIT UTAMA" },
  { id: "12", label: "TALI KABEL BAJA" },
  { id: "13", label: "TOMBOL PUSH BUTTON" },
  { id: "14", label: "SAFETY DEVICE" },
  { id: "15", label: "KOMPONEN LISTRIK" },
  { id: "16", label: "KETERSEDIAAN APAR DI DEKAT LIFT" },
];

// ✅ Helper untuk mendapatkan nama item
const getItemNameById = (id: string): string => {
  const item = inspectionItems.find(i => i.id === id);
  return item?.label || `Item ${id}`;
};

// ✅ Helper khusus untuk sub-item
const getSubItemLabel = (subItemId: string): string => {
  const suffix = subItemId.charAt(subItemId.length - 1);
  
  switch (suffix.toUpperCase()) {
    case "A": return "KOROSI";
    case "B": return "KERETAKAN";
    case "C": return "PERUBAHAN BENTUK";
    case "D": return "KETEBALAN";
    case "E": return "KELONGGARAN";
    case "F": return "KETIDAKRATAAN";
    default: return `Sub-Item ${suffix}`;
  }
};

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS (DITAMBAHKAN UNTUK EDIT)
// ─────────────────────────────────────────────────────────────
interface InspectionItem {
  itemId?: number | null;      // ✅ Untuk edit (dari database)
  subItemId?: string;
  status: string;
  keterangan: string;
  solusi: string;
  foto_path: string;
  _action?: 'create' | 'update' | 'delete';
}

interface InspectionRecord {
  id: string;                   // ✅ inspection_id
  date: string;
  inspector: string;
  inspectorNik: string;
  submittedAt: string;
  items: Record<string, InspectionItem>;
}

interface EditFormData {
  inspectionId: string;         // ✅ Untuk API edit
  inspection_date: string;
  inspector: string;
  inspector_nik: string;
  items: Record<string, InspectionItem>;
  replaceItems?: boolean;
}

export default function RiwayatInspeksiPerItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params);
  
  const itemDisplayName = getItemNameById(itemId);
  
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ EDIT MODE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'items'>('header');

  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home");
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/e-checksheet-ga/api/lift-barang/inspeksi/history?item_id=${itemId}&limit=20`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Gagal mengambil data');
        }

        const safeRecords = Array.isArray(result.data?.records) ? result.data.records : [];
        const validatedRecords: InspectionRecord[] = safeRecords.map((record: any): InspectionRecord => ({
          id: record.id,
          date: record.inspection_date || record.date,
          inspector: record.inspector,
          inspectorNik: record.inspectorNik || record.inspector_nik,
          submittedAt: record.submittedAt || record.submitted_at,
          items: record.items && typeof record.items === 'object' && record.items !== null
            ? Object.entries(record.items).reduce((acc, [subItemId, item]: [string, any]) => ({
                ...acc,
                [subItemId]: {
                  itemId: Number(item.itemId),      // ✅ Dari API
                  subItemId: subItemId,
                  status: item.status,
                  keterangan: item.keterangan || '',
                  solusi: item.solusi || '',
                  foto_path: item.foto_path || ''
                }
              }), {})
            : {}
        }));
        
        setRecords(validatedRecords);
      } catch (err) {
        console.error('❌ Fetch history error:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [itemId, user, router]);

  // ─────────────────────────────────────────────────────────────
  // 🔧 STANDALONE FUNCTION: Load/Reload records
  // ─────────────────────────────────────────────────────────────
  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/e-checksheet-ga/api/lift-barang/inspeksi/history?item_id=${itemId}&t=${Date.now()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data');
      }

      const safeRecords = Array.isArray(result.data?.records) ? result.data.records : [];
      const validatedRecords: InspectionRecord[] = safeRecords.map((record: any): InspectionRecord => ({
        id: record.id,
        date: record.inspection_date || record.date,
        inspector: record.inspector,
        inspectorNik: record.inspectorNik || record.inspector_nik,
        submittedAt: record.submittedAt || record.submitted_at,
        items: record.items && typeof record.items === 'object' && record.items !== null
          ? Object.entries(record.items).reduce((acc, [subItemId, item]: [string, any]) => ({
              ...acc,
              [subItemId]: {
                itemId: Number(item.itemId),
                subItemId: subItemId,
                status: item.status,
                keterangan: item.keterangan || '',
                solusi: item.solusi || '',
                foto_path: item.foto_path || ''
              }
            }), {})
          : {}
      }));
      
      console.log('✅ Data reloaded:', validatedRecords.length, 'records');
      setRecords(validatedRecords);
    } catch (err) {
      console.error('❌ Load error:', err);
      alert('Gagal memuat riwayat: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getItemsArray = (items: Record<string, any>) => {
    if (!items || typeof items !== 'object' || Array.isArray(items)) return [];
    
    return Object.entries(items).map(([subItemId, itemData]) => ({
      sub_item_id: subItemId,
      ...itemData
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // ✏️ EDIT FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const openEditModal = (record: InspectionRecord) => {
    console.log('🔍 Opening edit for:', {
      inspectionId: record.id,
      itemsCount: Object.keys(record.items).length
    });

    if (!record.id) {
      console.error('❌ Inspection ID tidak ada:', record);
      alert('❌ Error: Data tidak valid. Silakan refresh halaman.');
      return;
    }

    setEditData({
      inspectionId: record.id,
      inspection_date: formatDateForInput(record.date),
      inspector: record.inspector,
      inspector_nik: record.inspectorNik || '',
      items: Object.entries(record.items).reduce((acc, [subItemId, item]) => ({
        ...acc,
        [subItemId]: {
          ...item,
          itemId: item.itemId ? Number(item.itemId) : null,
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

  const handleItemChange = (subItemId: string, field: keyof InspectionItem, value: string) => {
    if (!editData) return;
    const updatedItems = { ...editData.items };
    if (updatedItems[subItemId]) {
      updatedItems[subItemId] = {
        ...updatedItems[subItemId],
        [field]: value,
        _action: updatedItems[subItemId]._action === 'create' ? 'create' : 'update'
      };
    }
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleFotoUpload = (subItemId: string, file: File) => {
    if (!editData) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedItems = { ...editData.items };
      if (updatedItems[subItemId]) {
        updatedItems[subItemId] = {
          ...updatedItems[subItemId],
          foto_path: reader.result as string,
          _action: updatedItems[subItemId]._action === 'create' ? 'create' : 'update'
        };
      }
      setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEdit = async () => {
    if (!editData) return;
    
    if (!editData.inspection_date || !editData.inspector) {
      alert('Harap lengkapi field Header: Tanggal dan Inspector');
      setActiveTab('header');
      return;
    }

    // ✅ Convert items object, preserve itemId & _action
    const itemsToSubmit = Object.entries(editData.items).reduce((acc, [subItemId, item]) => ({
      ...acc,
      [subItemId]: {
        itemId: item.itemId,              // ✅ WAJIB KIRIM
        subItemId: subItemId,
        status: item.status,
        keterangan: item.keterangan || '',
        solusi: item.solusi || '',
        foto_path: item.foto_path || '',
        _action: item._action || 'update' // ✅ WAJIB KIRIM
      }
    }), {});

    console.log('📤 Sending payload:', {
      inspectionId: editData.inspectionId,
      itemsCount: Object.keys(itemsToSubmit).length
    });

    setIsSubmitting(true);
    try {
      const response = await fetch('/e-checksheet-ga/api/lift-barang/inspeksi/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ KIRIM inspectionId (backend butuh ini!)
          inspectionId: editData.inspectionId,
          inspection_date: editData.inspection_date,
          inspector: editData.inspector,
          inspector_nik: editData.inspector_nik,
          items: itemsToSubmit,
          replaceItems: false  // ✅ Incremental update
        })
      });
      
      const result = await response.json();
      console.log('📥 API Response:', result);
      
      if (result.success) {
        alert('✅ Data berhasil diupdate!');
        closeEditModal();
        
        // ✅ FORCE RELOAD DENGAN DELAY
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadRecords();
        
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

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header */}
        <div className="header">
          <button onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi")} className="btn-back">
            <ArrowLeft size={20} />
          </button>
          <div className="header-title">
            <h1>Riwayat Inspeksi</h1>
            <p>{itemDisplayName}</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert error">
            <div className="alert-content">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Memuat riwayat...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <h3>Belum Ada Riwayat</h3>
            <p>Belum ada data inspeksi untuk {itemDisplayName.toLowerCase()}</p>
            <button 
              onClick={() => router.push(`/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/${itemId}`)}
              className="btn-primary"
            >
              Input Inspeksi {itemDisplayName}
            </button>
          </div>
        ) : (
          <div className="records">
            {records.map((record: InspectionRecord) => {
              const itemsArray = getItemsArray(record.items);
              const ngCount = itemsArray.filter((item: any) => item.status === 'NG').length;
              const okCount = itemsArray.length - ngCount;

              return (
                <div key={record.id} className="card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="meta">
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>{new Date(record.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={16} />
                        <span>{new Date(record.submittedAt).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>
                    <div className="inspector">
                      <User size={16} />
                      <span>{record.inspector}</span>
                      <span className="nik">{record.inspectorNik}</span>
                    </div>
                    {/* ✅ EDIT BUTTON */}
                    <div className="card-actions">
                      <button
                        onClick={() => openEditModal(record)}
                        className="btn-edit"
                        title="Edit inspeksi"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="stats">
                    <div className="stat ok">
                      <CheckCircle size={18} />
                      <span>{okCount} OK</span>
                    </div>
                    <div className="stat ng">
                      <XCircle size={18} />
                      <span>{ngCount} NG</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="items">
                    {itemsArray.map((item: any, index: number) => (
                      <div key={index} className={`item ${item.status === 'NG' ? 'item-ng' : 'item-ok'}`}>
                        <div className="item-header">
                          <span className="item-label">{getSubItemLabel(item.sub_item_id)}</span>
                          <span className={`badge ${item.status === 'NG' ? 'badge-ng' : 'badge-ok'}`}>
                            {item.status}
                          </span>
                        </div>

                        {item.status === 'NG' && (
                          <div className="item-details">
                            {item.keterangan && (
                              <div className="detail">
                                <FileText size={14} />
                                <span>{item.keterangan}</span>
                              </div>
                            )}
                            {item.solusi && (
                              <div className="detail">
                                <Wrench size={14} />
                                <span>{item.solusi}</span>
                              </div>
                            )}
                            {item.foto_path && (
                              <div className="detail-photo">
                                <Camera size={14} />
                                <img 
                                  src={item.foto_path.startsWith('http') ? item.foto_path : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto_path}`} 
                                  alt="Dokumentasi" 
                                  className="photo"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(item.foto_path);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
              <img 
                src={previewImage.startsWith('http') ? previewImage : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${previewImage}`}
                alt="Zoom" 
                className="modal-image"
                onError={(e) => {
                  console.error('Modal image load error');
                  (e.target as HTMLImageElement).alt = 'Gambar tidak dapat dimuat';
                }}
              />
            </div>
          </div>
        )}

        {/* ✅ EDIT MODAL */}
        {isEditMode && editData && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Edit Inspeksi Lift Barang</h3>
                <button className="modal-close" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-tabs">
                <button
                  className={`tab-btn ${activeTab === 'header' ? 'active' : ''}`}
                  onClick={() => setActiveTab('header')}
                >
                  📋 Header
                </button>
                <button
                  className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={() => setActiveTab('items')}
                >
                  📦 Items ({Object.keys(editData.items).length})
                </button>
              </div>
              <div className="modal-body">
                {activeTab === 'header' ? (
                  <div className="form-section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tanggal *</label>
                        <input
                          type="date"
                          value={editData.inspection_date}
                          onChange={(e) => handleHeaderChange('inspection_date', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Inspector *</label>
                        <input
                          type="text"
                          value={editData.inspector}
                          onChange={(e) => handleHeaderChange('inspector', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>NIK Inspector</label>
                        <input
                          type="text"
                          value={editData.inspector_nik || ''}
                          onChange={(e) => handleHeaderChange('inspector_nik', e.target.value)}
                          className="form-input"
                          placeholder="Opsional"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <div className="items-edit-list">
                      {Object.entries(editData.items).map(([subItemId, item]) => (
                        <div key={subItemId} className="edit-item-card">
                          <div className="edit-item-header">
                            <span className="item-badge">{subItemId}</span>
                            <span className="item-lokasi-edit">{getSubItemLabel(subItemId)}</span>
                          </div>
                          <div className="edit-item-fields">
                            <div className="status-select-group">
                              <label className="status-label">Status</label>
                              <select
                                value={item.status || 'OK'}
                                onChange={(e) => handleItemChange(subItemId, 'status', e.target.value)}
                                className={`status-select ${item.status === 'NG' ? 'ng' : 'ok'}`}
                              >
                                <option value="OK">✅ OK</option>
                                <option value="NG">❌ NG</option>
                              </select>
                            </div>
                            {item.status === 'NG' && (
                              <>
                                <div className="form-group-small full">
                                  <label>Keterangan *</label>
                                  <textarea
                                    value={item.keterangan || ''}
                                    onChange={(e) => handleItemChange(subItemId, 'keterangan', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder="Keterangan kondisi NG..."
                                  />
                                </div>
                                <div className="form-group-small full">
                                  <label>Solusi *</label>
                                  <textarea
                                    value={item.solusi || ''}
                                    onChange={(e) => handleItemChange(subItemId, 'solusi', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder="Solusi/tindakan yang dilakukan..."
                                  />
                                </div>
                              </>
                            )}
                            <div className="form-group-small">
                              <label>Foto</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFotoUpload(subItemId, e.target.files[0])}
                                className="form-file-small"
                              />
                              {item.foto_path && (
                                <img
                                  src={item.foto_path}
                                  alt="Preview"
                                  className="item-foto-preview"
                                  onClick={() => setPreviewImage(item.foto_path)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn-modal-cancel"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEdit}
                  className="btn-modal-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '💾 Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
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
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-back {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.625rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          min-width: 44px;
          min-height: 44px;
        }

        .btn-back:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .header-title {
          flex: 1;
          min-width: 0;
        }

        .header-title h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
          word-break: break-word;
        }

        .header-title p {
          font-size: 0.875rem;
          color: #ffffff;
          margin: 0.25rem 0 0 0;
          word-break: break-word;
        }

        /* Alert */
        .alert {
          background: white;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .alert.error {
          border-left: 4px solid #ef4444;
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #dc2626;
          flex: 1;
          min-width: 0;
        }

        .alert-content span {
          word-break: break-word;
        }

        .btn-retry {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
          white-space: nowrap;
        }

        .btn-retry:hover {
          background: #dc2626;
        }

        /* Loading */
        .loading {
          text-align: center;
          padding: 4rem 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading p {
          color: #64748b;
          font-size: 0.875rem;
        }

        /* Empty State */
        .empty {
          text-align: center;
          padding: 4rem 1rem;
          background: white;
          border-radius: 1rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty p {
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        /* Records */
        .records {
          display: grid;
          gap: 1.25rem;
        }

        /* Card */
        .card {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .card-header {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .inspector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 500;
          flex-wrap: wrap;
        }

        .nik {
          color: #64748b;
          font-weight: 400;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #1976d2;
          transition: transform 0.2s;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-edit:hover {
          transform: scale(1.1);
        }

        /* Stats */
        .stats {
          display: flex;
          gap: 0.75rem;
          padding: 0 1.25rem 1.25rem;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .stat.ok {
          background: #f0fdf4;
          color: #16a34a;
        }

        .stat.ng {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Items */
        .items {
          display: grid;
          gap: 0.5rem;
          padding: 0 1.25rem 1.25rem;
        }

        .item {
          border-radius: 0.5rem;
          padding: 0.875rem;
          transition: all 0.2s;
        }

        .item-ok {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .item-ng {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .item-label {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
          word-break: break-word;
          flex: 1;
          min-width: 0;
        }

        .badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge-ok {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge-ng {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-details {
          display: grid;
          gap: 0.625rem;
          margin-top: 0.875rem;
          padding-top: 0.875rem;
          border-top: 1px dashed #fecaca;
        }

        .detail {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #475569;
          word-break: break-word;
        }

        .detail span {
          flex: 1;
          min-width: 0;
        }

        .detail-photo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }

        .photo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 0.5rem;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .photo:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Image Modal */
        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-image {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 0.5rem;
        }

        /* ✅ EDIT MODAL STYLES */
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
          overflow-y: auto;
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
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 16px 16px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .modal-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.3);
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
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .tab-btn.active {
          background: #1976d2;
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: #e2e8f0;
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

        .form-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #334155;
        }

        .form-input {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          min-height: 44px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
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

        .item-lokasi-edit {
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }

        .edit-item-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group-small {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 150px;
        }

        .form-group-small.full {
          flex: 1 1 100%;
        }

        .form-group-small label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
        }

        .form-textarea-small {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          resize: vertical;
          font-family: inherit;
        }

        .form-textarea-small:focus {
          outline: none;
          border-color: #1976d2;
        }

        .form-file-small {
          font-size: 0.85rem;
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

        .status-select-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .status-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
        }

        .status-select {
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          background: white;
        }

        .status-select.ok {
          color: #059669;
          border-color: #059669;
        }

        .status-select.ng {
          color: #dc2626;
          border-color: #dc2626;
        }

        .modal-footer {
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-radius: 0 0 16px 16px;
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
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-modal-cancel {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }

        .btn-modal-cancel:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-modal-save {
          background: #1976d2;
          color: white;
          border: none;
        }

        .btn-modal-save:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-modal-cancel:disabled,
        .btn-modal-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            padding: 1rem;
          }

          .header {
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .btn-back {
            min-width: 44px;
            min-height: 44px;
            padding: 0.5rem;
          }

          .header-title h1 {
            font-size: 1.25rem;
          }

          .header-title p {
            font-size: 0.8125rem;
          }

          .card-header {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
          }

          .meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .meta-item {
            font-size: 0.8125rem;
          }

          .inspector {
            margin-top: 0.5rem;
            font-size: 0.8125rem;
          }

          .stats {
            padding: 0 1rem 1rem;
            gap: 0.5rem;
          }

          .stat {
            padding: 0.5rem 0.75rem;
            font-size: 0.8125rem;
          }

          .items {
            padding: 0 1rem 1rem;
            gap: 0.5rem;
          }

          .item {
            padding: 0.75rem;
          }

          .item-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .item-label {
            font-size: 0.8125rem;
          }

          .badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.6875rem;
          }

          .item-details {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
          }

          .detail {
            font-size: 0.75rem;
            gap: 0.375rem;
          }

          .photo {
            width: 70px;
            height: 70px;
          }

          .alert {
            padding: 0.875rem;
            flex-direction: column;
            align-items: stretch;
          }

          .btn-retry {
            width: 100%;
            text-align: center;
          }

          .empty {
            padding: 3rem 1rem;
          }

          .empty-icon {
            font-size: 3rem;
          }

          .empty h3 {
            font-size: 1.125rem;
          }

          .empty p {
            font-size: 0.875rem;
          }

          .btn-primary {
            width: 100%;
            padding: 0.875rem 1.25rem;
          }

          /* Modal Mobile */
          .modal-container {
            max-height: 95vh;
            border-radius: 12px;
          }

          .modal-header {
            padding: 12px 16px;
          }

          .modal-header h3 {
            font-size: 1.1rem;
          }

          .modal-body {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column-reverse;
            padding: 12px 16px;
          }

          .btn-modal-cancel,
          .btn-modal-save {
            width: 100%;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 0.75rem;
          }

          .header-title h1 {
            font-size: 1.125rem;
          }

          .header-title p {
            font-size: 0.75rem;
          }

          .item-label {
            font-size: 0.75rem;
          }

          .badge {
            padding: 0.1875rem 0.5rem;
            font-size: 0.625rem;
          }

          .photo {
            width: 60px;
            height: 60px;
          }

          .detail {
            font-size: 0.6875rem;
          }

          .loading {
            padding: 3rem 1rem;
          }

          .spinner {
            width: 35px;
            height: 35px;
          }

          .loading p {
            font-size: 0.8125rem;
          }

          .empty {
            padding: 2.5rem 0.875rem;
          }

          .empty-icon {
            font-size: 2.5rem;
          }

          .empty h3 {
            font-size: 1rem;
          }

          .empty p {
            font-size: 0.8125rem;
          }

          .btn-primary {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }

          .alert {
            padding: 0.75rem;
          }

          .alert-content {
            font-size: 0.8125rem;
          }

          .btn-retry {
            padding: 0.5rem 0.875rem;
            font-size: 0.8125rem;
          }

          .modal-image {
            max-height: 80vh;
          }
        }
      `}</style>
    </div>
  );
}