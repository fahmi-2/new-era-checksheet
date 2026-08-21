// app/status-ga/fire-alarm/riwayat/[zona]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ==========================================
// 📦 INTERFACES
// ==========================================
export interface FireAlarmItem {
  id?: number;
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
  _action?: 'create' | 'update' | 'delete';
  originalNo?: number;
}

export interface FireAlarmRecord {
  id: string;
  date: string;
  zona: string;
  checker: string;
  checkerNik?: string;
  submittedAt: string;
  items: FireAlarmItem[];
}

interface EditFormData {
  recordId: string;
  date: string;
  originalDate: string;
  zona: string;
  checker: string;
  checkerNik?: string;
  items: FireAlarmItem[];
  replaceItems?: boolean;
}

interface ValidationError {
  itemNo: number;
  lokasi: string;
  field: string;
  message: string;
}

// ==========================================
// 📄 MAIN COMPONENT
// ==========================================
export default function RiwayatFireAlarm({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { zona } = use(params);

  // State Data & Loading
  const [records, setRecords] = useState<FireAlarmRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FireAlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // State Filter
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // State UI
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // State Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'items'>('header');
  const [newItemNo, setNewItemNo] = useState(1);

  // State Validasi
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // State Scroll Indicator untuk Tabel
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  // ==========================================
  // 🔐 AUTH & INIT
  // ==========================================
  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  // ==========================================
  // 🔥 DATA LOADING
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('zona', zona);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      if (filterLocation) queryParams.append('lokasi', filterLocation);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/e-checksheet-ga/api/fire-alarm/history?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.data || []);
          setFilteredRecords(data.data || []);
        } else {
          alert('Gagal memuat riwayat: ' + data.message);
        }
      } else {
        alert('Gagal mengambil data dari server');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Gagal memuat riwayat: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zona) {
      loadData();
    }
  }, [zona, filterDateFrom, filterDateTo, filterLocation]);

  // ==========================================
  // 🔧 HELPER FUNCTIONS
  // ==========================================
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      if (!dateString) return '';
      
      // Handle ISO format (e.g., "2024-03-17T00:00:00.000Z") or other formats with time
      let dateStr = dateString;
      if (dateString.includes('T') || dateString.includes(' ')) {
        // Extract just the date part from ISO or datetime string
        dateStr = dateString.split('T')[0].split(' ')[0];
      }
      
      // Validate the date part format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateString;
      }
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const generateNextNo = (items: FireAlarmItem[]) => {
    const maxNo = Math.max(0, ...items.map(i => i.no || 0));
    return maxNo + 1;
  };

  const locations = Array.from(
    new Set(
      records
        .flatMap((r) => r.items || [])
        .map((i) => i.lokasi)
        .filter(Boolean)
    )
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) {
      const imageUrl = src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${src}`;
      setPreviewImage(imageUrl);
    }
  };

  const closeImagePreview = () => setPreviewImage(null);

  // Handle scroll untuk indicator tabel
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setShowLeftScroll(el.scrollLeft > 10);
    setShowRightScroll(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const checkScrollable = () => {
      const wrapper = document.querySelector('.table-wrapper') as HTMLDivElement;
      if (wrapper) {
        setShowRightScroll(wrapper.scrollWidth > wrapper.clientWidth + 10);
        setShowLeftScroll(wrapper.scrollLeft > 10);
      }
    };
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [filteredRecords]);

  // ==========================================
  // ✅ VALIDATION FUNCTIONS
  // ==========================================
  const hasNGStatus = (item: FireAlarmItem): boolean => {
    return (
      item.alarmBell === 'NG' ||
      item.indicatorLamp === 'NG' ||
      item.manualCallPoint === 'NG' ||
      item.idZona === 'NG' ||
      item.kebersihan === 'NG'
    );
  };

  const validateItem = (item: FireAlarmItem): string[] => {
    const errors: string[] = [];
    if (hasNGStatus(item)) {
      if (!item.kondisiNok || item.kondisiNok.trim() === '') {
        errors.push('Kondisi N-OK wajib diisi ketika ada status NG');
      }
      if (!item.tindakanPerbaikan || item.tindakanPerbaikan.trim() === '') {
        errors.push('Tindakan Perbaikan wajib diisi ketika ada status NG');
      }
    }
    return errors;
  };

  const validateAllItems = (items: FireAlarmItem[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    items.forEach((item) => {
      if (item._action === 'delete') return;
      const itemErrors = validateItem(item);
      itemErrors.forEach((message) => {
        errors.push({
          itemNo: item.no,
          lokasi: item.lokasi,
          field: 'kondisiNok',
          message
        });
      });
    });
    return errors;
  };

  // ==========================================
  // 🗑️ DELETE HANDLER
  // ==========================================
  const handleDelete = async (recordId: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const response = await fetch(`/e-checksheet-ga/api/fire-alarm/delete?id=${recordId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
        alert('Data berhasil dihapus!');
      } else {
        const error = await response.json();
        alert('Gagal menghapus: ' + error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  // ==========================================
  // ✏️ EDIT LOGIC
  // ==========================================
  const openEditModal = async (record: FireAlarmRecord) => {
    try {
      const response = await fetch(`/e-checksheet-ga/api/fire-alarm/history?zona=${zona}&record_id=${record.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.[0]) {
          const freshRecord = data.data[0];
          const formattedDate = formatDateForInput(freshRecord.date);
          setEditData({
            recordId: freshRecord.id,
            date: formattedDate,
            originalDate: formattedDate,
            zona: freshRecord.zona,
            checker: freshRecord.checker,
            checkerNik: freshRecord.checkerNik || '',
            items: (freshRecord.items || []).map((item: FireAlarmItem) => ({
              ...item,
              _action: 'update'
            })),
            replaceItems: true
          });
          setIsEditMode(true);
          setActiveTab('header');
          setNewItemNo(generateNextNo(freshRecord.items) + 1);
          setValidationErrors([]);
          setShowValidationWarning(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching record for edit:', error);
    }
    const formattedDate = formatDateForInput(record.date);
    setEditData({
      recordId: record.id,
      date: formattedDate,
      originalDate: formattedDate,
      zona: record.zona || zona,
      checker: record.checker,
      checkerNik: record.checkerNik || '',
      items: record.items.map((item) => ({ ...item, _action: 'update' })),
      replaceItems: true
    });
    setIsEditMode(true);
    setActiveTab('header');
    setNewItemNo(generateNextNo(record.items) + 1);
    setValidationErrors([]);
    setShowValidationWarning(false);
  };

  const closeEditModal = () => {
    setIsEditMode(false);
    setEditData(null);
    setNewItemNo(1);
    setValidationErrors([]);
    setShowValidationWarning(false);
  };

  const handleHeaderChange = (field: keyof EditFormData, value: string) => {
    if (!editData) return;
    if (field === 'date') {
      alert('⚠️ Tanggal tidak dapat diubah untuk mengedit data.\nJika ingin membuat data dengan tanggal baru, silakan gunakan fitur "Tambah Data".');
      return;
    }
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleItemChange = (index: number, field: keyof FireAlarmItem, value: string) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      _action: updatedItems[index]._action === 'create' ? 'create' : 'update'
    };
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);

    if (['alarmBell', 'indicatorLamp', 'manualCallPoint', 'idZona', 'kebersihan'].includes(field)) {
      if (value === 'NG') {
        const item = updatedItems[index];
        if (!item.kondisiNok || item.kondisiNok.trim() === '' ||
          !item.tindakanPerbaikan || item.tindakanPerbaikan.trim() === '') {
          setShowValidationWarning(true);
          if (activeTab === 'header') setActiveTab('items');
        }
      }
    }
    if (field === 'kondisiNok' || field === 'tindakanPerbaikan') {
      const item = updatedItems[index];
      const hasNG = hasNGStatus(item);
      const hasKondisi = item.kondisiNok && item.kondisiNok.trim() !== '';
      const hasTindakan = item.tindakanPerbaikan && item.tindakanPerbaikan.trim() !== '';
      if (hasNG && hasKondisi && hasTindakan) {
        const activeItems = updatedItems.filter(i => i._action !== 'delete');
        const allValid = activeItems.every(i => !hasNGStatus(i) || (i.kondisiNok?.trim() && i.tindakanPerbaikan?.trim()));
        if (allValid) setShowValidationWarning(false);
      }
    }
  };

  const handleAddItem = () => {
    if (!editData) return;
    const itemToAdd: FireAlarmItem = {
      no: newItemNo,
      zona: editData.zona,
      lokasi: `Lokasi Baru ${newItemNo}`,
      alarmBell: 'OK',
      indicatorLamp: 'OK',
      manualCallPoint: 'OK',
      idZona: `ID-${newItemNo}`,
      kebersihan: 'OK',
      kondisiNok: '',
      tindakanPerbaikan: '',
      pic: editData.checker,
      foto: null,
      _action: 'create'
    };
    setEditData(prev => prev ? { ...prev, items: [...prev.items, itemToAdd] } : null);
    setNewItemNo(prev => prev + 1);
  };

  const handleRemoveItem = (index: number) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    const item = updatedItems[index];
    if (item.id) {
      updatedItems[index] = { ...item, _action: 'delete' };
    } else {
      updatedItems.splice(index, 1);
    }
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
    const activeItems = updatedItems.filter(i => i._action !== 'delete');
    const errors = validateAllItems(activeItems);
    setValidationErrors(errors);
    setShowValidationWarning(errors.length > 0);
  };

  const handleFotoUpload = (index: number, file: File) => {
    if (!editData) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedItems = [...editData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        foto: reader.result as string,
        _action: updatedItems[index]._action === 'create' ? 'create' : 'update'
      };
      setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEdit = async () => {
    if (!editData) return;
    if (!editData.date || !editData.zona || !editData.checker) {
      alert('Harap lengkapi field Header: Tanggal, Zona, dan Checker');
      setActiveTab('header');
      return;
    }
    if (editData.date !== editData.originalDate) {
      alert('⚠️ Tanggal tidak dapat diubah!\nTanggal edit harus sama dengan tanggal record asli.');
      setActiveTab('header');
      return;
    }
    const activeItems = editData.items.filter(item => item._action !== 'delete');
    const errors = validateAllItems(activeItems);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationWarning(true);
      setActiveTab('items');
      alert(`⚠️ Terdapat ${errors.length} error validasi!\nItem dengan status NG wajib mengisi:\n1. Kondisi N-OK\n2. Tindakan Perbaikan\nSilakan perbaiki sebelum menyimpan.`);
      return;
    }
    const itemsToSubmit = activeItems.map(({ _action, originalNo, id, ...item }) => item);
    if (itemsToSubmit.length === 0 && !confirm('Tidak ada item yang akan disimpan. Lanjutkan hanya update header?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/e-checksheet-ga/api/fire-alarm/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: editData.recordId,
          date: editData.date,
          zona: editData.zona,
          checker: editData.checker,
          checkerNik: editData.checkerNik,
          items: itemsToSubmit,
          replaceItems: true
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Data berhasil diupdate!');
        closeEditModal();
        await loadData();
      } else {
        alert('❌ Gagal update: ' + result.message);
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  // ==========================================
  // 🎨 RENDER UI
  // ==========================================
  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button onClick={() => router.push("/status-ga/fire-alarm")} className="btn-back" aria-label="Kembali">
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">📍 Riwayat Inspeksi Fire Alarm - {zona?.toUpperCase()}</h1>
        </div>

        {/* Filter Controls */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Dari Tanggal:</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="date-input" />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="date-input" />
          </div>
          <div className="filter-group">
            <label>Lokasi:</label>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="location-select">
              <option value="">Semua Lokasi</option>
              {locations.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
            </select>
          </div>
          <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterLocation(""); }} className="clear-filter">Reset Filter</button>
          <Link href={`/status-ga/fire-alarm/${zona}`} className="btn-add">➕ Tambah Data</Link>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="riwayat-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">Belum ada data Inspeksi Fire Alarm.</div>
            ) : (
              <div className="data-tables">
                {/* ✅ DESKTOP: Table View */}
                <div className="desktop-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="data-section">
                      <div className="section-header">
                        <span>📅 {formatDateDisplay(record.date)}</span>
                        <span>👤 {record.checker}</span>
                        <div className="section-actions">
                          <button onClick={() => openEditModal(record)} className="edit-btn" title="Edit data">✏️</button>
                          <button onClick={() => handleDelete(record.id)} className="delete-btn" title="Hapus data">🗑️</button>
                        </div>
                      </div>
                      <div 
                        className={`table-wrapper ${showLeftScroll ? 'scrollable-left' : ''} ${showRightScroll ? 'scrollable-right' : ''}`}
                        onScroll={handleTableScroll}
                      >
                        <table className="apd-table">
                          <thead>
                            <tr>
                              <th className="sticky-col">No</th>
                              <th>Zona</th>
                              <th>Lokasi</th>
                              <th>Alarm Bell</th>
                              <th>Indicator Lamp</th>
                              <th>Manual Call Point</th>
                              <th>ID Zona</th>
                              <th>Kebersihan</th>
                              <th>Kondisi N-OK</th>
                              <th>Tindakan Perbaikan</th>
                              <th>PIC</th>
                              <th>Foto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item) => (
                              <tr key={`${record.id}-${item.no}`}>
                                <td className="sticky-col">{item.no}</td>
                                <td>{item.zona}</td>
                                <td>{item.lokasi}</td>
                                <td className={item.alarmBell === "NG" ? "status-ng" : ""}>{item.alarmBell || "-"}</td>
                                <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>{item.indicatorLamp || "-"}</td>
                                <td className={item.manualCallPoint === "NG" ? "status-ng" : ""}>{item.manualCallPoint || "-"}</td>
                                <td className={item.idZona === "NG" ? "status-ng" : ""}>{item.idZona || "-"}</td>
                                <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan || "-"}</td>
                                <td>{item.kondisiNok || "-"}</td>
                                <td>{item.tindakanPerbaikan || "-"}</td>
                                <td>{item.pic || "-"}</td>
                                <td>
                                  {item.foto ? (
                                    <img 
                                      src={item.foto.startsWith('http') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} 
                                      alt="Foto" 
                                      className="history-image clickable" 
                                      onClick={() => openImagePreview(item.foto!)} 
                                    />
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ MOBILE: Card View */}
                <div className="mobile-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="record-card">
                      <div className="card-header" onClick={() => toggleExpandRecord(record.id)}>
                        <div className="card-date"><span className="calendar-icon">📅</span><span>{formatDateDisplay(record.date)}</span></div>
                        <div className="card-checker"><span className="user-icon">👤</span><span>{record.checker}</span></div>
                        <div className={`expand-icon ${expandedRecord === record.id ? 'expanded' : ''}`}>▼</div>
                      </div>
                      {expandedRecord === record.id && (
                        <div className="card-body">
                          <div className="card-actions">
                            <button onClick={() => openEditModal(record)} className="edit-btn-mobile">✏️ Edit Data</button>
                            <button onClick={() => handleDelete(record.id)} className="delete-btn-mobile">🗑️ Hapus Data</button>
                          </div>
                          <div className="items-list">
                            {record.items.map((item) => (
                              <div key={`${record.id}-${item.no}`} className="item-card">
                                <div className="item-header"><span className="item-no">#{item.no}</span><span className="item-zona">{item.zona}</span></div>
                                <div className="item-lokasi">{item.lokasi}</div>
                                <div className="item-details">
                                  <div className="detail-row"><span className="detail-label">Alarm Bell:</span><span className={`detail-value ${item.alarmBell === "NG" ? "ng" : "ok"}`}>{item.alarmBell || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Indicator Lamp:</span><span className={`detail-value ${item.indicatorLamp === "NG" ? "ng" : "ok"}`}>{item.indicatorLamp || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Manual Call Point:</span><span className={`detail-value ${item.manualCallPoint === "NG" ? "ng" : "ok"}`}>{item.manualCallPoint || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">ID Zona:</span><span className={`detail-value ${item.idZona === "NG" ? "ng" : "ok"}`}>{item.idZona || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Kebersihan:</span><span className={`detail-value ${item.kebersihan === "NG" ? "ng" : "ok"}`}>{item.kebersihan || "-"}</span></div>
                                  {item.kondisiNok && <div className="detail-row full"><span className="detail-label">Kondisi N-OK:</span><span className="detail-value">{item.kondisiNok}</span></div>}
                                  {item.tindakanPerbaikan && <div className="detail-row full"><span className="detail-label">Tindakan:</span><span className="detail-value">{item.tindakanPerbaikan}</span></div>}
                                  <div className="detail-row"><span className="detail-label">PIC:</span><span className="detail-value">{item.pic || "-"}</span></div>
                                  {item.foto && (
                                    <div className="detail-row full">
                                      <span className="detail-label">Foto:</span>
                                      <img src={item.foto.startsWith('http') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} alt="Foto" className="item-photo" onClick={() => openImagePreview(item.foto!)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={closeImagePreview}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeImagePreview}>✕</button>
              <img src={previewImage} alt="Zoom" className="modal-image" />
            </div>
          </div>
        )}

        {/* ✅ EDIT MODAL */}
        {isEditMode && editData && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Edit Inspeksi Fire Alarm</h3>
                <button className="modal-close" onClick={closeEditModal}>✕</button>
              </div>
              {showValidationWarning && (
                <div className="validation-warning-banner">
                  <span className="warning-icon">⚠️</span>
                  <span className="warning-text">
                    Item dengan status <strong>NG</strong> wajib mengisi <strong>Kondisi N-OK</strong> dan <strong>Tindakan Perbaikan</strong>
                  </span>
                </div>
              )}
              <div className="edit-info-banner">
                <span className="info-icon">📅</span>
                <span className="info-text">
                  Mengedit data tanggal <strong>{formatDateDisplay(editData.date)}</strong>
                </span>
              </div>
              <div className="modal-tabs">
                <button className={`tab-btn ${activeTab === 'header' ? 'active' : ''}`} onClick={() => setActiveTab('header')}>📋 Header</button>
                <button className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
                  📦 Items ({editData.items.filter(i => i._action !== 'delete').length})
                  {validationErrors.length > 0 && <span className="error-badge">{validationErrors.length}</span>}
                </button>
              </div>
              <div className="modal-body">
                {activeTab === 'header' ? (
                  <div className="form-section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tanggal Inspeksi *</label>
                        <div className="readonly-field-wrapper">
                          <input
                            type="date"
                            value={editData.date}
                            onChange={(e) => handleHeaderChange('date', e.target.value)}
                            className="form-input readonly-input"
                            readOnly
                            title="Tanggal tidak dapat diubah saat edit"
                          />
                          <span className="readonly-badge">🔒 Tetap</span>
                        </div>
                        <p className="field-hint">Tanggal edit harus sama dengan tanggal record asli</p>
                      </div>
                      <div className="form-group">
                        <label>Zona *</label>
                        <input type="text" value={editData.zona} onChange={(e) => handleHeaderChange('zona', e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label>Checker *</label>
                        <input type="text" value={editData.checker} onChange={(e) => handleHeaderChange('checker', e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label>NIK Checker</label>
                        <input type="text" value={editData.checkerNik || ''} onChange={(e) => handleHeaderChange('checkerNik', e.target.value)} className="form-input" placeholder="Opsional" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    {validationErrors.length > 0 && (
                      <div className="error-summary">
                        <h4>⚠️ Error Validasi ({validationErrors.length})</h4>
                        <ul>
                          {validationErrors.map((err, idx) => (
                            <li key={idx}>
                              <strong>Item #{err.itemNo}</strong> ({err.lokasi}): {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="items-edit-list">
                      {editData.items.filter(i => i._action !== 'delete').map((item, index) => {
                        const originalIndex = editData.items.findIndex(i => i.no === item.no && i.lokasi === item.lokasi);
                        const realIndex = originalIndex >= 0 ? originalIndex : index;
                        const itemHasNG = hasNGStatus(item);
                        const itemHasErrors = validationErrors.some(e => e.itemNo === item.no);
                        return (
                          <div key={`${item.no}-${item.lokasi}-${index}`} className={`edit-item-card ${itemHasErrors ? 'has-validation-error' : ''}`}>
                            <div className="edit-item-header">
                              <span className="item-badge">#{item.no}</span>
                              <span className="item-lokasi-edit">{item.lokasi}</span>
                              {itemHasNG && <span className="ng-badge">NG</span>}
                              <button className="remove-item-btn" onClick={() => handleRemoveItem(realIndex)} title="Hapus item">🗑️</button>
                            </div>
                            {itemHasNG && (!item.kondisiNok || !item.tindakanPerbaikan) && (
                              <div className="required-fields-warning">
                                <span>⚠️ Lengkapi field yang wajib diisi!</span>
                              </div>
                            )}
                            <div className="edit-item-fields">
                              <div className="form-row">
                                <div className="form-group-small"><label>Lokasi</label><input type="text" value={item.lokasi} onChange={(e) => handleItemChange(realIndex, 'lokasi', e.target.value)} className="form-input-small" /></div>
                                <div className="form-group-small"><label>ID Zona</label><input type="text" value={item.idZona} onChange={(e) => handleItemChange(realIndex, 'idZona', e.target.value)} className="form-input-small" /></div>
                              </div>
                              <div className="status-grid">
                                {['alarmBell', 'indicatorLamp', 'manualCallPoint', 'kebersihan'].map((field) => (
                                  <div key={field} className="status-select-group">
                                    <label className="status-label">{field === 'alarmBell' ? 'Alarm Bell' : field === 'indicatorLamp' ? 'Indicator Lamp' : field === 'manualCallPoint' ? 'Manual Call Point' : 'Kebersihan'}</label>
                                    <select
                                      value={item[field as keyof FireAlarmItem] || 'OK'}
                                      onChange={(e) => handleItemChange(realIndex, field as keyof FireAlarmItem, e.target.value)}
                                      className={`status-select ${item[field as keyof FireAlarmItem] === 'NG' ? 'ng' : 'ok'} ${item[field as keyof FireAlarmItem] === 'NG' && (!item.kondisiNok || !item.tindakanPerbaikan) ? 'missing-info' : ''}`}
                                    >
                                      <option value="OK">✅ OK</option>
                                      <option value="NG">❌ NG</option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                              <div className="form-row">
                                <div className={`form-group-small full ${itemHasNG && !item.kondisiNok ? 'required-error' : ''}`}>
                                  <label>Kondisi N-OK {itemHasNG && <span className="required-star">*</span>}</label>
                                  <textarea
                                    value={item.kondisiNok || ''}
                                    onChange={(e) => handleItemChange(realIndex, 'kondisiNok', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder={itemHasNG ? "Wajib diisi ketika ada status NG..." : "Jelaskan jika ada kondisi NG..."}
                                  />
                                  {itemHasNG && !item.kondisiNok && <span className="field-error-message">Wajib diisi!</span>}
                                </div>
                              </div>
                              <div className="form-row">
                                <div className={`form-group-small full ${itemHasNG && !item.tindakanPerbaikan ? 'required-error' : ''}`}>
                                  <label>Tindakan Perbaikan {itemHasNG && <span className="required-star">*</span>}</label>
                                  <textarea
                                    value={item.tindakanPerbaikan || ''}
                                    onChange={(e) => handleItemChange(realIndex, 'tindakanPerbaikan', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder={itemHasNG ? "Wajib diisi ketika ada status NG..." : "Tindakan yang dilakukan..."}
                                  />
                                  {itemHasNG && !item.tindakanPerbaikan && <span className="field-error-message">Wajib diisi!</span>}
                                </div>
                              </div>
                              <div className="form-row">
                                <div className="form-group-small"><label>PIC</label><input type="text" value={item.pic || ''} onChange={(e) => handleItemChange(realIndex, 'pic', e.target.value)} className="form-input-small" /></div>
                                <div className="form-group-small">
                                  <label>Foto</label>
                                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFotoUpload(realIndex, e.target.files[0])} className="form-file-small" />
                                  {item.foto && <img src={item.foto} alt="Preview" className="item-foto-preview" onClick={() => openImagePreview(item.foto!)} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="add-item-section">
                      <button type="button" onClick={handleAddItem} className="btn-add-item">➕ Tambah Item Baru</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal} className="btn-modal-cancel" disabled={isSubmitting}>Batal</button>
                <button type="button" onClick={handleSubmitEdit} className="btn-modal-save" disabled={isSubmitting || validationErrors.length > 0}>
                  {isSubmitting ? '💾 Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ───────────────────────────────────────────────────────────
           BASE STYLES - Mobile First (min-width approach)
           ─────────────────────────────────────────────────────────── */
        .app-page { 
          display: flex; 
          min-height: 100vh; 
          background-color: #f7f9fc; 
          width: 100%;
          min-width: 0;
        }
        
        .page-content { 
          flex: 1; 
          padding: 16px 12px; 
          color: #1e293b; 
          width: 100%;
          min-width: 0;
          margin-left: 0;
          transition: margin-left 0.3s ease, padding 0.3s ease;
        }
        
        .header-banner { 
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); 
          color: white; 
          padding: 12px 16px; 
          border-radius: 12px; 
          margin-bottom: 20px; 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          flex-wrap: wrap;
          width: 100%;
          min-width: 0;
        }
        
        .btn-back { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          padding: 8px 12px; 
          background: rgba(255, 255, 255, 0.2); 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 600; 
          font-size: 0.85rem; 
          transition: background 0.2s; 
          min-height: 40px;
          min-width: 80px;
        }
        .btn-back:hover { background: rgba(255, 255, 255, 0.3); }
        .btn-back-text { display: inline; }
        
        .page-title { 
          margin: 0; 
          font-size: 1.1rem; 
          font-weight: 700; 
          flex: 1; 
          word-break: break-word;
          min-width: 0;
        }
        
        .date-filter { 
          display: flex; 
          gap: 12px; 
          margin-bottom: 20px; 
          padding: 12px; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); 
          flex-wrap: wrap; 
          align-items: center;
          width: 100%;
          min-width: 0;
        }
        
        .filter-group { 
          display: flex; 
          flex-direction: column; 
          gap: 4px; 
          min-width: 0;
          flex: 1;
        }
        .filter-group label { 
          font-weight: 600; 
          font-size: 0.85rem; 
          color: #333; 
        }
        
        .date-input, .location-select { 
          padding: 8px 10px; 
          border: 1px solid #cbd5e1; 
          border-radius: 8px; 
          font-size: 0.9rem; 
          min-width: 0;
          min-height: 40px;
          width: 100%;
        }
        
        .clear-filter { 
          padding: 8px 14px; 
          background: #dc2626; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 0.85rem; 
          font-weight: 600; 
          min-height: 40px;
          min-width: 90px;
        }
        .clear-filter:hover { background: #b91c1c; }
        
        .btn-add { 
          padding: 8px 14px; 
          background: #1e88e5; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin-left: auto; 
          white-space: nowrap; 
          min-height: 40px;
          min-width: 100px;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }
        .btn-add:hover { background: #1565c0; }
        
        .riwayat-container { 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 
          padding: 16px 12px;
          width: 100%;
          min-width: 0;
        }
        
        .empty-state { 
          text-align: center; 
          padding: 32px 16px; 
          color: #64748b; 
          font-size: 1rem; 
        }
        
        .loading-container { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          padding: 48px 16px; 
          background: white; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0; 
        }
        
        .spinner { 
          width: 36px; 
          height: 36px; 
          border: 4px solid #e2e8f0; 
          border-top-color: #1976d2; 
          border-radius: 50%; 
          animation: spin 0.8s linear infinite; 
          margin-bottom: 12px; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .data-tables { 
          display: flex; 
          flex-direction: column; 
          gap: 20px;
          width: 100%;
          min-width: 0;
        }
        
        .desktop-view { display: block; }
        .mobile-view { display: none; }
        
        .data-section { 
          border: 1px solid #e2e8f0; 
          border-radius: 10px; 
          overflow: hidden; 
          margin-bottom: 20px;
          width: 100%;
          min-width: 0;
        }
        
        .section-header { 
          background: #f1f5f9; 
          padding: 10px 14px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 0.85rem; 
          color: #475569; 
          font-weight: 600; 
          flex-wrap: wrap; 
          gap: 8px;
          min-width: 0;
        }
        
        .section-actions { 
          display: flex; 
          gap: 6px; 
        }
        
        .edit-btn, .delete-btn { 
          background: none; 
          border: none; 
          font-size: 1.1rem; 
          cursor: pointer; 
          transition: transform 0.2s; 
          min-width: 40px; 
          min-height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }
        .edit-btn { color: #1976d2; }
        .delete-btn { color: #f44336; }
        .edit-btn:hover, .delete-btn:hover { transform: scale(1.1); }
        
        /* ───────────────────────────────────────────────────────────
           TABLE WRAPPER - Horizontal Scroll dengan min-size
           ─────────────────────────────────────────────────────────── */
        .table-wrapper {
          position: relative;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #1976d2 #e2e8f0;
          border-radius: 0 0 10px 10px;
          background: white;
          width: 100%;
          min-width: 0;
          /* Visual gradient untuk indikasi scroll */
          mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
        }
        
        .table-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .table-wrapper::-webkit-scrollbar-thumb {
          background: #1976d2;
          border-radius: 3px;
        }
        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #1565c0;
        }
        
        /* Scroll indicator edges */
        .table-wrapper::before,
        .table-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 20px;
          pointer-events: none;
          z-index: 5;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .table-wrapper::before {
          left: 0;
          background: linear-gradient(to right, rgba(241, 245, 249, 0.95), transparent);
        }
        .table-wrapper::after {
          right: 0;
          background: linear-gradient(to left, rgba(241, 245, 249, 0.95), transparent);
        }
        .table-wrapper.scrollable-left::before,
        .table-wrapper.scrollable-right::after {
          opacity: 1;
        }
        
        /* ───────────────────────────────────────────────────────────
           TABLE STYLES - Mencegah shrink, enable scroll
           ─────────────────────────────────────────────────────────── */
        .apd-table {
          width: 100%;
          min-width: max-content; /* ✅ Kunci: Jangan biarkan tabel memampat */
          border-collapse: collapse;
          font-size: 0.8rem;
          table-layout: auto;
        }
        
        .apd-table th,
        .apd-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          white-space: nowrap; /* ✅ Mencegah text wrap */
          vertical-align: middle;
        }
        
        /* Kolom tertentu boleh wrap */
        .apd-table td:nth-child(3),
        .apd-table td:nth-child(9),
        .apd-table td:nth-child(10) {
          white-space: normal;
          word-break: break-word;
          max-width: 180px;
        }
        
        .apd-table th {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          font-weight: 700;
          color: #1e293b;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
        }
        
        /* Sticky first column */
        .sticky-col {
          position: sticky;
          left: 0;
          background: inherit;
          z-index: 8;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.03);
        }
        .apd-table th.sticky-col {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          z-index: 15;
        }
        
        .status-ng {
          background: #fee2e2;
          color: #dc2626;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
          min-width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .history-image {
          width: 45px;
          height: 45px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: transform 0.2s;
          display: block;
        }
        .history-image:hover {
          transform: scale(1.1);
        }
        
        /* ───────────────────────────────────────────────────────────
           MOBILE CARD VIEW
           ─────────────────────────────────────────────────────────── */
        .record-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          width: 100%;
          min-width: 0;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.2s;
          min-height: 44px;
        }
        .card-header:hover { background: #f1f5f9; }
        
        .card-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: #1e88e5;
          font-weight: 600;
        }
        
        .card-checker {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: #64748b;
          flex: 1;
          min-width: 0;
        }
        
        .expand-icon {
          font-size: 1rem;
          color: #94a3b8;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }
        .expand-icon.expanded { transform: rotate(180deg); }
        
        .card-body {
          padding: 12px 14px;
          background: #fafbfc;
        }
        
        .card-actions {
          margin-bottom: 12px;
          display: flex;
          gap: 8px;
        }
        
        .edit-btn-mobile, .delete-btn-mobile {
          flex: 1;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .edit-btn-mobile { background: #dbeafe; color: #1976d2; }
        .edit-btn-mobile:hover { background: #bfdbfe; }
        .delete-btn-mobile { background: #fee2e2; color: #dc2626; }
        .delete-btn-mobile:hover { background: #fecaca; }
        
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          width: 100%;
          min-width: 0;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        
        .item-no {
          background: #1976d2;
          color: white;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.8rem;
        }
        
        .item-zona {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .item-lokasi {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 10px;
          word-break: break-word;
        }
        
        .item-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.85rem;
        }
        .detail-row.full { flex-direction: column; gap: 3px; }
        
        .detail-label {
          color: #64748b;
          font-weight: 500;
          min-width: 110px;
          flex-shrink: 0;
        }
        
        .detail-value {
          color: #1e293b;
          font-weight: 400;
          word-break: break-word;
        }
        .detail-value.ok { color: #059669; font-weight: 600; }
        .detail-value.ng { color: #dc2626; font-weight: 600; }
        
        .item-photo {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .item-photo:hover { transform: scale(1.05); }
        
        /* ───────────────────────────────────────────────────────────
           IMAGE MODAL
           ─────────────────────────────────────────────────────────── */
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
          z-index: 1000;
          cursor: pointer;
        }
        
        .modal-content {
          position: relative;
          max-width: 95vw;
          max-height: 90vh;
          cursor: default;
        }
        
        .close-btn {
          position: absolute;
          top: -36px;
          right: 0;
          background: #fff;
          color: #000;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-weight: bold;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover { background: #e0e0e0; }
        
        .modal-image {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border: 2px solid white;
          border-radius: 8px;
        }
        
        /* ───────────────────────────────────────────────────────────
           EDIT MODAL
           ─────────────────────────────────────────────────────────── */
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
          padding: 12px;
          overflow-y: auto;
        }
        
        .modal-container {
          background: white;
          border-radius: 14px;
          width: 100%;
          max-width: 700px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 14px 14px 0 0;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .modal-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.3); }
        
        .modal-tabs {
          display: flex;
          padding: 6px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          gap: 3px;
        }
        
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .tab-btn.active { background: #1976d2; color: white; }
        .tab-btn:hover:not(.active) { background: #e2e8f0; }
        
        .error-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #dc2626;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
          margin-left: 6px;
        }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #334155;
        }
        
        .form-input {
          padding: 9px 11px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          min-height: 42px;
          transition: border-color 0.2s;
          width: 100%;
          min-width: 0;
        }
        .form-input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }
        
        .items-edit-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .edit-item-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          background: #fafbfc;
          transition: all 0.2s;
          width: 100%;
          min-width: 0;
        }
        .edit-item-card.has-validation-error {
          border: 2px solid #dc2626;
          background: #fef2f2;
        }
        
        .edit-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .item-badge {
          background: #1976d2;
          color: white;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.75rem;
        }
        
        .ng-badge {
          background: #dc2626;
          color: white;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.7rem;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        
        .item-lokasi-edit {
          font-weight: 600;
          color: #1e293b;
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }
        
        .remove-item-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: #f44336;
          padding: 4px 6px;
          border-radius: 4px;
          transition: background 0.2s;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-item-btn:hover { background: #fee2e2; }
        
        .edit-item-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .form-group-small {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 130px;
        }
        .form-group-small.full { flex: 1 1 100%; }
        
        .form-group-small label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
        }
        
        .form-input-small {
          padding: 7px 9px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          min-height: 36px;
          width: 100%;
          min-width: 0;
        }
        
        .form-textarea-small {
          padding: 7px 9px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          resize: vertical;
          font-family: inherit;
          width: 100%;
          min-width: 0;
        }
        .form-input-small:focus,
        .form-textarea-small:focus {
          outline: none;
          border-color: #1976d2;
        }
        
        .form-file-small {
          font-size: 0.8rem;
          width: 100%;
        }
        
        .item-foto-preview {
          width: 45px;
          height: 45px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          margin-top: 4px;
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .status-select-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .status-label {
          font-size: 0.7rem;
          font-weight: 500;
          color: #64748b;
        }
        
        .status-select {
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          background: white;
          min-height: 36px;
        }
        .status-select.ok { color: #059669; border-color: #059669; }
        .status-select.ng { color: #dc2626; border-color: #dc2626; }
        .status-select.missing-info {
          border: 2px solid #dc2626;
          background: #fef2f2;
          animation: shake 0.5s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        .add-item-section {
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
        }
        
        .btn-add-item {
          width: 100%;
          padding: 10px;
          background: #f1f5f9;
          color: #1976d2;
          border: 2px dashed #94a3b8;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          min-height: 42px;
        }
        .btn-add-item:hover {
          background: #e2e8f0;
          border-color: #1976d2;
        }
        
        .modal-footer {
          padding: 14px 18px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-radius: 0 0 14px 14px;
        }
        
        .btn-modal-cancel,
        .btn-modal-save {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          min-height: 42px;
          min-width: 90px;
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
        .btn-modal-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .btn-modal-save {
          background: #1976d2;
          color: white;
          border: none;
        }
        .btn-modal-save:hover:not(:disabled) { background: #1565c0; }
        .btn-modal-cancel:disabled,
        .btn-modal-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Validation banners */
        .validation-warning-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 14px 14px 14px;
          border-radius: 6px;
        }
        .warning-icon { font-size: 1.1rem; }
        .warning-text { font-size: 0.85rem; color: #92400e; }
        .warning-text strong { color: #78350f; }
        
        .edit-info-banner {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-left: 4px solid #0284c7;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 14px 14px 14px;
          border-radius: 6px;
        }
        .info-icon { font-size: 1.1rem; }
        .info-text { font-size: 0.85rem; color: #0369a1; }
        .info-text strong { color: #075985; }
        
        .error-summary {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 14px;
        }
        .error-summary h4 {
          color: #dc2626;
          font-size: 0.9rem;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .error-summary ul {
          margin: 0;
          padding-left: 18px;
          color: #991b1b;
          font-size: 0.8rem;
        }
        .error-summary li { margin-bottom: 4px; }
        
        .required-fields-warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .required-star { color: #dc2626; font-weight: 700; }
        
        .required-error .form-textarea-small {
          border-color: #dc2626;
          background: #fef2f2;
        }
        
        .field-error-message {
          color: #dc2626;
          font-size: 0.7rem;
          font-weight: 600;
          display: block;
          margin-top: 3px;
        }
        
        .readonly-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .readonly-input {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
          flex: 1;
        }
        .readonly-badge {
          background: #dc2626;
          color: white;
          padding: 3px 7px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .field-hint {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 3px;
          font-style: italic;
        }
        
        /* ───────────────────────────────────────────────────────────
           RESPONSIVE: min-width breakpoints (Mobile First)
           ─────────────────────────────────────────────────────────── */
        
        /* Tablet: min-width 480px */
        @media (min-width: 480px) {
          .page-content { padding: 18px 16px; }
          .header-banner { padding: 14px 18px; flex-direction: row; }
          .page-title { font-size: 1.2rem; }
          .date-filter { padding: 14px; }
          .filter-group { flex: none; min-width: 140px; }
          .date-input, .location-select { min-width: 140px; }
          .clear-filter, .btn-add { min-width: 100px; }
          .riwayat-container { padding: 18px 16px; }
          .apd-table { font-size: 0.82rem; min-width: max-content; }
          .apd-table th, .apd-table td { padding: 9px 12px; }
          .history-image { width: 48px; height: 48px; }
          .item-photo { width: 75px; height: 75px; }
          .modal-container { max-width: 750px; }
          .form-grid { grid-template-columns: repeat(2, 1fr); }
          .status-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        /* Small Desktop: min-width 768px (Sidebar expanded) */
        @media (min-width: 768px) {
          .page-content {
            margin-left: 120px;
            padding: 24px 20px;
          }
          .header-banner { padding: 18px 22px; border-radius: 14px; }
          .page-title { font-size: 1.4rem; }
          .btn-back { min-width: 90px; font-size: 0.9rem; }
          .date-filter { padding: 16px; }
          .filter-group { min-width: 160px; }
          .date-input, .location-select { min-width: 160px; font-size: 0.95rem; }
          .clear-filter, .btn-add { min-width: 110px; font-size: 0.9rem; }
          .riwayat-container { padding: 24px 20px; }
          .apd-table { font-size: 0.85rem; }
          .apd-table th, .apd-table td { padding: 10px 14px; }
          .history-image { width: 50px; height: 50px; }
          .modal-container { max-width: 800px; }
          .form-grid { grid-template-columns: repeat(2, 1fr); }
          .modal-footer { padding: 16px 20px; }
        }
        
        /* Large Desktop: min-width 1024px */
        @media (min-width: 1024px) {
          .page-content { padding: 28px 24px; }
          .header-banner { padding: 20px 26px; }
          .page-title { font-size: 1.5rem; }
          .riwayat-container { padding: 28px 24px; }
          .apd-table { font-size: 0.87rem; }
          .apd-table th, .apd-table td { padding: 11px 16px; }
          .modal-container { max-width: 850px; }
        }
        
        /* Extra Large: min-width 1400px */
        @media (min-width: 1400px) {
          .page-content {
            max-width: 1400px;
            margin: 0 auto 0 120px;
            padding: 32px 32px;
          }
        }
        
        /* Utility: Prevent overflow */
        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
      `}</style>
    </div>
  );
}