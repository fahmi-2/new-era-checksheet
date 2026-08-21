// app/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface PintuDaruratItem {
  itemId?: number | null;      // ✅ Untuk edit (dari database)
  no: number;
  lokasi: string;
  kondisiPintu: string;
  areaSekitar: string;
  paluAlatBantu: string;
  identitasPintu: string;
  idPeringatan: string;
  doorCloser: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string;
  _action?: 'create' | 'update' | 'delete';  // ✅ Untuk edit
}

interface PintuDaruratRecord {
  id: number;                   // ✅ Number untuk edit
  date: string;
  checker: string;
  nik?: string;
  department?: string;
  submittedAt: string;
  items: PintuDaruratItem[];
}

interface EditFormData {
  checklistId: number;          // ✅ Untuk API edit
  date: string;
  checker: string;
  nik?: string;
  department?: string;
  items: PintuDaruratItem[];
  replaceItems?: boolean;
}

export default function RiwayatPintuDarurat() {
  const router = useRouter();
  const { user } = useAuth();

  const [records, setRecords] = useState<PintuDaruratRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  
  // ✅ EDIT MODE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'items'>('header');
  const [newItemNo, setNewItemNo] = useState(1);

  // Validasi akses
  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  // ─────────────────────────────────────────────────────────────
  // 🔧 LOAD DATA FUNCTION (STANDALONE - Bisa dipanggil ulang)
  // ─────────────────────────────────────────────────────────────
  // app/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat/page.tsx

const loadRecords = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/e-checksheet-ga/api/pintu-darurat/history?t=${Date.now()}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    
    // 🔍 Debug log
    console.log('📦 Raw API data:', data[0]?.items?.slice(0, 2));
    
    const formattedData = data.map((record: any, recordIdx: number) => {
      if (!record.id) {
        console.warn(`⚠️ Record #${recordIdx} tidak memiliki id:`, record);
      }
      
      return {
        id: Number(record.id),
        date: record.date,
        checker: record.checker,
        nik: record.nik,
        department: record.department,
        submittedAt: record.submittedAt,
        items: record.items.map((item: any, itemIdx: number) => ({
          // ✅ WAJIB: Ambil itemId dari API (harus 16, 17, 18... bukan 1, 2, 3...)
          itemId: Number(item.itemId),
          no: item.no || itemIdx + 1,
          lokasi: item.lokasi,
          kondisiPintu: item.kondisiPintu || 'OK',
          areaSekitar: item.areaSekitar || 'OK',
          paluAlatBantu: item.paluAlatBantu || 'OK',
          identitasPintu: item.identitasPintu || 'OK',
          idPeringatan: item.idPeringatan || 'OK',
          doorCloser: item.doorCloser || 'OK',
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic || "",
          foto: item.foto || ""
        }))
      };
    });
    
    console.log('✅ Formatted data:', formattedData[0]?.items?.slice(0, 2));
    setRecords(formattedData);
  } catch (error) {
    console.error('❌ Load error:', error);
    alert('Gagal memuat riwayat: ' + (error as Error).message);
  } finally {
    setLoading(false);
  }
};

  // Initial Load Only
  useEffect(() => {
    loadRecords();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 🔍 FILTER
  // ─────────────────────────────────────────────────────────────
  const filteredRecords = records.filter((record) => {
    const filterDateObj = filterDate ? new Date(filterDate) : null;
    const recordDateObj = new Date(record.date);
    if (filterDateObj &&
      (recordDateObj.getFullYear() !== filterDateObj.getFullYear() ||
        recordDateObj.getMonth() !== filterDateObj.getMonth() ||
        recordDateObj.getDate() !== recordDateObj.getDate())) {
      return false;
    }
    if (filterLocation) {
      return record.items.some((item) => item.lokasi === filterLocation);
    }
    return true;
  });

  const locations = Array.from(
    new Set(records.flatMap((r) => r.items.map((i) => i.lokasi)))
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) setPreviewImage(src);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const toggleExpandRecord = (recordIndex: number) => {
    setExpandedRecord(expandedRecord === recordIndex ? null : recordIndex);
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

  const generateNextNo = (items: PintuDaruratItem[]) => {
    const maxNo = Math.max(0, ...items.map(i => i.no || 0));
    return maxNo + 1;
  };

  const openEditModal = (record: PintuDaruratRecord) => {
    // 🔍 Debug log
    console.log('🔍 Opening edit for:', {
      recordId: record.id,
      recordIdType: typeof record.id,
      recordIdValue: Number(record.id),
      itemsCount: record.items.length
    });

    // ✅ VALIDASI: Pastikan record.id valid
    if (!record.id || isNaN(Number(record.id))) {
      console.error('❌ Invalid record ID:', record);
      alert('❌ Error: Record ID tidak valid. Silakan refresh halaman.');
      return;
    }

    setEditData({
      // ✅ PAKSA KONVERSI KE NUMBER
      checklistId: Number(record.id),
      date: formatDateForInput(record.date),
      checker: record.checker,
      nik: record.nik || '',
      department: record.department || '',
      items: record.items.map((item, index) => ({
        ...item,
        // ✅ Pastikan itemId number
        itemId: item.itemId ? Number(item.itemId) : index + 1,
        _action: 'update'  // ✅ Default action untuk existing items
      })),
      // ✅ Ubah ke false untuk incremental update
      replaceItems: false
    });
    setIsEditMode(true);
    setActiveTab('header');
    setNewItemNo(generateNextNo(record.items) + 1);
  };

  const closeEditModal = () => {
    setIsEditMode(false);
    setEditData(null);
    setNewItemNo(1);
  };

  const handleHeaderChange = (field: keyof EditFormData, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleItemChange = (index: number, field: keyof PintuDaruratItem, value: string) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      _action: updatedItems[index]._action === 'create' ? 'create' : 'update'
    };
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleAddItem = () => {
    if (!editData) return;
    const itemToAdd: PintuDaruratItem = {
      no: newItemNo,
      lokasi: `Lokasi Baru ${newItemNo}`,
      kondisiPintu: 'OK',
      areaSekitar: 'OK',
      paluAlatBantu: 'OK',
      identitasPintu: 'OK',
      idPeringatan: 'OK',
      doorCloser: 'OK',
      keterangan: '',
      tindakanPerbaikan: '',
      pic: editData.checker,
      foto: '',
      _action: 'create'
    };
    setEditData(prev => prev ? { ...prev, items: [...prev.items, itemToAdd] } : null);
    setNewItemNo(prev => prev + 1);
  };

  const handleRemoveItem = (index: number) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    const item = updatedItems[index];
    
    // ✅ Jika item sudah ada di DB (punya itemId), tandai untuk di-delete
    if (item.itemId) {
      updatedItems[index] = { 
        ...item, 
        _action: 'delete'  // ✅ Backend akan proses delete
      };
    } 
    // ✅ Jika item baru (belum ada itemId), hapus dari array
    else {
      updatedItems.splice(index, 1);
    }
    
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
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
    
    if (!editData.date || !editData.checker) {
      alert('Harap lengkapi field Header: Tanggal dan Checker');
      setActiveTab('header');
      return;
    }

    // ✅ JANGAN filter delete & JANGAN hapus itemId/_action
    const itemsToSubmit = editData.items.map(item => ({
      itemId: item.itemId,              // ✅ WAJIB KIRIM
      no: item.no,
      lokasi: item.lokasi,
      kondisiPintu: item.kondisiPintu,
      areaSekitar: item.areaSekitar,
      paluAlatBantu: item.paluAlatBantu,
      identitasPintu: item.identitasPintu,
      idPeringatan: item.idPeringatan,
      doorCloser: item.doorCloser,
      keterangan: item.keterangan || '',
      tindakanPerbaikan: item.tindakanPerbaikan || '',
      pic: item.pic || '',
      foto: item.foto || '',
      _action: item._action || 'update' // ✅ WAJIB KIRIM
    }));

    // 🔍 Debug log
    console.log('📤 Sending payload:', {
      checklistId: editData.checklistId,
      checklistIdType: typeof editData.checklistId,
      itemsCount: itemsToSubmit.length,
      firstItem: itemsToSubmit[0]
    });

    setIsSubmitting(true);
    try {
      const response = await fetch('/e-checksheet-ga/api/pintu-darurat/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ KIRIM checklistId (backend butuh ini!)
          checklistId: Number(editData.checklistId),
          date: editData.date,
          checker: editData.checker,
          nik: editData.nik,
          department: editData.department,
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
        console.log('🔄 Reloading data...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadRecords();
        console.log('✅ Data reloaded');
        
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

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/exit-lamp-pintu-darurat")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">🚪 Riwayat Pintu Darurat</h1>
        </div>

        {/* Filter */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Tanggal:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Lokasi:</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="location-select"
            >
              <option value="">Semua Lokasi</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFilterDate("");
              setFilterLocation("");
            }}
            className="clear-filter"
          >
            Reset Filter
          </button>
          <Link href="/exit-lamp-pintu-darurat/pintu-darurat" className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>⏳ Memuat data...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              {records.length === 0 
                ? "Belum ada data Pintu Darurat." 
                : "Tidak ada data yang sesuai filter."}
            </div>
          ) : (
            <div className="data-tables">
              {/* ✅ DESKTOP: Table View */}
              <div className="desktop-view">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="data-section">
                    <div className="section-header">
                      <span>📅 Tanggal: {new Date(record.date).toLocaleDateString('id-ID')}</span>
                      <span>👤 Petugas: {record.checker}</span>
                      {record.department && <span>🏢 Dept: {record.department}</span>}
                      <div className="section-actions">
                        <button
                          onClick={() => openEditModal(record)}
                          className="edit-btn"
                          title="Edit data"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                    <div className="table-wrapper">
                      <table className="apd-table">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Lokasi</th>
                            <th>Kondisi Pintu</th>
                            <th>Area Sekitar</th>
                            <th>Palu/Alat Bantu</th>
                            <th>Identitas Pintu</th>
                            <th>ID Peringatan</th>
                            <th>Door Closer</th>
                            <th>Keterangan</th>
                            <th>Foto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.items.map((item, index) => {
                            const hasNg = 
                              item.kondisiPintu === "NG" ||
                              item.areaSekitar === "NG" ||
                              item.paluAlatBantu === "NG" ||
                              item.identitasPintu === "NG" ||
                              item.idPeringatan === "NG" ||
                              item.doorCloser === "NG";
                            
                            return (
                              <tr key={`${record.id}-${index}`} className={hasNg ? 'row-ng' : ''}>
                                <td>{index + 1}</td>
                                <td>{item.lokasi}</td>
                                <td className={item.kondisiPintu === "NG" ? "status-ng" : ""}>
                                  {item.kondisiPintu || "-"}
                                </td>
                                <td className={item.areaSekitar === "NG" ? "status-ng" : ""}>
                                  {item.areaSekitar || "-"}
                                </td>
                                <td className={item.paluAlatBantu === "NG" ? "status-ng" : ""}>
                                  {item.paluAlatBantu || "-"}
                                </td>
                                <td className={item.identitasPintu === "NG" ? "status-ng" : ""}>
                                  {item.identitasPintu || "-"}
                                </td>
                                <td className={item.idPeringatan === "NG" ? "status-ng" : ""}>
                                  {item.idPeringatan || "-"}
                                </td>
                                <td className={item.doorCloser === "NG" ? "status-ng" : ""}>
                                  {item.doorCloser || "-"}
                                </td>
                                <td>{item.keterangan || "-"}</td>
                                <td>
                                  {item.foto ? (
                                    <img
                                      src={item.foto.startsWith('http') || item.foto.startsWith('data:') 
                                        ? item.foto 
                                        : `/uploads${item.foto.split('uploads')[1]}`}
                                      alt="Foto"
                                      className="history-image clickable"
                                      onClick={() => openImagePreview(item.foto)}
                                      onError={(e) => {
                                        console.error('Image load error:', item.foto);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ MOBILE: Card View */}
              <div className="mobile-view">
                {filteredRecords.map((record, recordIndex) => (
                  <div key={record.id} className="record-card">
                    <div 
                      className="card-header" 
                      onClick={() => toggleExpandRecord(recordIndex)}
                    >
                      <div className="card-date">
                        <span className="calendar-icon">📅</span>
                        <span>{new Date(record.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="card-checker">
                        <span className="user-icon">👤</span>
                        <span>{record.checker}</span>
                      </div>
                      <div className={`expand-icon ${expandedRecord === recordIndex ? 'expanded' : ''}`}>
                        ▼
                      </div>
                    </div>

                    {expandedRecord === recordIndex && (
                      <div className="card-body">
                        <div className="card-actions">
                          <button
                            onClick={() => openEditModal(record)}
                            className="edit-btn-mobile"
                          >
                            ✏️ Edit Data
                          </button>
                        </div>
                        {record.items.map((item, itemIndex) => {
                          const hasNg = 
                            item.kondisiPintu === "NG" ||
                            item.areaSekitar === "NG" ||
                            item.paluAlatBantu === "NG" ||
                            item.identitasPintu === "NG" ||
                            item.idPeringatan === "NG" ||
                            item.doorCloser === "NG";
                          
                          return (
                            <div key={`${record.id}-${itemIndex}`} className={`item-card ${hasNg ? 'item-card-ng' : ''}`}>
                              <div className="item-header">
                                <span className="item-no">#{itemIndex + 1}</span>
                                <span className={`item-status ${hasNg ? 'status-ng' : 'status-ok'}`}>
                                  {hasNg ? 'NG' : 'OK'}
                                </span>
                              </div>
                              <div className="item-lokasi">{item.lokasi}</div>
                              
                              <div className="item-details">
                                <div className="detail-row">
                                  <span className="detail-label">Kondisi Pintu:</span>
                                  <span className={`detail-value ${item.kondisiPintu === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.kondisiPintu || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Area Sekitar:</span>
                                  <span className={`detail-value ${item.areaSekitar === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.areaSekitar || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Palu/Alat Bantu:</span>
                                  <span className={`detail-value ${item.paluAlatBantu === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.paluAlatBantu || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Identitas Pintu:</span>
                                  <span className={`detail-value ${item.identitasPintu === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.identitasPintu || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">ID Peringatan:</span>
                                  <span className={`detail-value ${item.idPeringatan === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.idPeringatan || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Door Closer:</span>
                                  <span className={`detail-value ${item.doorCloser === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.doorCloser || '-'}
                                  </span>
                                </div>
                                {item.keterangan && (
                                  <div className="detail-row full">
                                    <span className="detail-label">Keterangan:</span>
                                    <span className="detail-value">{item.keterangan}</span>
                                  </div>
                                )}
                                {item.foto && (
                                  <div className="detail-row full">
                                    <span className="detail-label">Foto:</span>
                                    <img
                                      src={item.foto.startsWith('http') || item.foto.startsWith('data:') 
                                        ? item.foto 
                                        : `/uploads${item.foto.split('uploads')[1]}`}
                                      alt="Foto"
                                      className="item-photo"
                                      onClick={() => openImagePreview(item.foto)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={closeImagePreview}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeImagePreview}>✕</button>
              <img 
                src={previewImage.startsWith('http') || previewImage.startsWith('data:') 
                  ? previewImage 
                  : `/uploads${previewImage.split('uploads')[1]}`}
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
                <h3>✏️ Edit Pintu Darurat</h3>
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
                  📦 Items ({editData.items.filter(i => i._action !== 'delete').length})
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
                          value={editData.date}
                          onChange={(e) => handleHeaderChange('date', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Checker *</label>
                        <input
                          type="text"
                          value={editData.checker}
                          onChange={(e) => handleHeaderChange('checker', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>NIK</label>
                        <input
                          type="text"
                          value={editData.nik || ''}
                          onChange={(e) => handleHeaderChange('nik', e.target.value)}
                          className="form-input"
                          placeholder="Opsional"
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={editData.department || ''}
                          onChange={(e) => handleHeaderChange('department', e.target.value)}
                          className="form-input"
                          placeholder="Opsional"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <div className="items-edit-list">
                      {editData.items.filter(i => i._action !== 'delete').map((item, index) => {
                        const originalIndex = editData.items.findIndex(i => i.no === item.no && i.lokasi === item.lokasi);
                        const realIndex = originalIndex >= 0 ? originalIndex : index;
                        return (
                          <div key={`${item.no}-${item.lokasi}-${index}`} className="edit-item-card">
                            <div className="edit-item-header">
                              <span className="item-badge">#{item.no}</span>
                              <span className="item-lokasi-edit">{item.lokasi}</span>
                              <button
                                className="remove-item-btn"
                                onClick={() => handleRemoveItem(realIndex)}
                                title="Hapus item"
                              >
                                🗑️
                              </button>
                            </div>
                            <div className="edit-item-fields">
                              <div className="form-row">
                                <div className="form-group-small full">
                                  <label>Lokasi</label>
                                  <input
                                    type="text"
                                    value={item.lokasi}
                                    onChange={(e) => handleItemChange(realIndex, 'lokasi', e.target.value)}
                                    className="form-input-small"
                                  />
                                </div>
                              </div>
                              <div className="status-grid">
                                {[
                                  { field: 'kondisiPintu', label: 'Kondisi Pintu' },
                                  { field: 'areaSekitar', label: 'Area Sekitar' },
                                  { field: 'paluAlatBantu', label: 'Palu/Alat Bantu' },
                                  { field: 'identitasPintu', label: 'Identitas Pintu' },
                                  { field: 'idPeringatan', label: 'ID Peringatan' },
                                  { field: 'doorCloser', label: 'Door Closer' }
                                ].map(({ field, label }) => (
                                  <div key={field} className="status-select-group">
                                    <label className="status-label">{label}</label>
                                    <select
                                      value={item[field as keyof PintuDaruratItem] || 'OK'}
                                      onChange={(e) => handleItemChange(realIndex, field as keyof PintuDaruratItem, e.target.value)}
                                      className={`status-select ${item[field as keyof PintuDaruratItem] === 'NG' ? 'ng' : 'ok'}`}
                                    >
                                      <option value="OK">✅ OK</option>
                                      <option value="NG">❌ NG</option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                              <div className="form-row">
                                <div className="form-group-small full">
                                  <label>Keterangan</label>
                                  <textarea
                                    value={item.keterangan || ''}
                                    onChange={(e) => handleItemChange(realIndex, 'keterangan', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder="Keterangan jika ada NG..."
                                  />
                                </div>
                              </div>
                              <div className="form-row">
                                <div className="form-group-small full">
                                  <label>Tindakan Perbaikan</label>
                                  <textarea
                                    value={item.tindakanPerbaikan || ''}
                                    onChange={(e) => handleItemChange(realIndex, 'tindakanPerbaikan', e.target.value)}
                                    className="form-textarea-small"
                                    rows={2}
                                    placeholder="Tindakan yang dilakukan..."
                                  />
                                </div>
                              </div>
                              <div className="form-row">
                                <div className="form-group-small">
                                  <label>PIC</label>
                                  <input
                                    type="text"
                                    value={item.pic || ''}
                                    onChange={(e) => handleItemChange(realIndex, 'pic', e.target.value)}
                                    className="form-input-small"
                                  />
                                </div>
                                <div className="form-group-small">
                                  <label>Foto</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFotoUpload(realIndex, e.target.files[0])}
                                    className="form-file-small"
                                  />
                                  {item.foto && (
                                    <img
                                      src={item.foto}
                                      alt="Preview"
                                      className="item-foto-preview"
                                      onClick={() => openImagePreview(item.foto)}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="add-item-section">
                      <button type="button" onClick={handleAddItem} className="btn-add-item">
                        ➕ Tambah Item Baru
                      </button>
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

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          color: #1e293b;
          overflow-x: hidden;
        }

        /* Header Banner */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background 0.2s;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-back-text {
          display: inline;
        }

        .page-title {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 700;
          flex: 1;
          word-break: break-word;
        }

        /* Filter */
        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .date-input,
        .location-select {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          min-width: 160px;
          min-height: 44px;
        }

        .clear-filter {
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          min-height: 44px;
        }

        .clear-filter:hover {
          background: #b91c1c;
        }

        .btn-add {
          padding: 8px 16px;
          background: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-left: auto;
          white-space: nowrap;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .btn-add:hover {
          background: #1565c0;
        }

        /* Riwayat Container */
        .riwayat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 24px;
          min-height: 400px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #1e88e5;
          font-weight: 600;
        }

        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #1e88e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 1.1rem;
        }

        .data-tables {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .data-section,
        .record-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .section-header,
        .card-header {
          background: #f1f5f9;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #475569;
          font-weight: 600;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn {
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

        .edit-btn:hover {
          transform: scale(1.1);
        }

        .card-header {
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.2s;
          min-height: 44px;
          align-items: center;
        }

        .card-header:hover {
          background: #f1f5f9;
        }

        .card-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #1e88e5;
          font-weight: 600;
        }

        .card-checker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #64748b;
          flex: 1;
        }

        .expand-icon {
          font-size: 1.2rem;
          color: #94a3b8;
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body {
          padding: 16px;
          background: #fafbfc;
        }

        .card-actions {
          margin-bottom: 16px;
        }

        .edit-btn-mobile {
          width: 100%;
          padding: 12px 16px;
          background: #dbeafe;
          color: #1976d2;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .edit-btn-mobile:hover {
          background: #bfdbfe;
        }

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 900px;
        }

        .apd-table th,
        .apd-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .apd-table th {
          background: #f8fafc;
          font-weight: 700;
          color: #1e293b;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .status-ng {
          background: #fee2e2;
          color: #dc2626;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
        }

        .row-ng {
          background: rgba(244, 67, 54, 0.05);
        }

        .history-image {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .history-image.clickable {
          cursor: zoom-in;
          transition: transform 0.2s;
        }

        .history-image.clickable:hover {
          transform: scale(1.05);
        }

        /* Mobile Card Item Styles */
        .item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .item-card:last-child {
          margin-bottom: 0;
        }

        .item-card-ng {
          border-color: rgba(244, 67, 54, 0.5);
          background: rgba(244, 67, 54, 0.05);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .item-no {
          background: #1e88e5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .item-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .item-status.ok {
          background: #d1fae5;
          color: #065f46;
        }

        .item-status.ng {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          padding: 12px 16px 4px;
          word-break: break-word;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          gap: 12px;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row.full {
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
          min-width: 120px;
          flex-shrink: 0;
        }

        .detail-value {
          font-size: 0.9rem;
          color: #1e293b;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        .detail-value.ok {
          color: #059669;
          font-weight: 600;
        }

        .detail-value.ng {
          color: #dc2626;
          font-weight: 600;
        }

        .item-photo {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
        }

        /* Image Modal */
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
          max-width: 90vw;
          max-height: 90vh;
          cursor: default;
        }

        .close-btn {
          position: absolute;
          top: -40px;
          right: 0;
          background: #fff;
          color: #000;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-weight: bold;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .close-btn:hover {
          background: #e0e0e0;
          transform: scale(1.1);
        }

        .modal-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border: 2px solid white;
          border-radius: 8px;
          background: white;
          padding: 10px;
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

        .remove-item-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #f44336;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .remove-item-btn:hover {
          background: #fee2e2;
        }

        .edit-item-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
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

        .form-input-small {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          min-height: 38px;
        }

        .form-textarea-small {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          resize: vertical;
          font-family: inherit;
        }

        .form-input-small:focus,
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

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
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

        .add-item-section {
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
        }

        .btn-add-item {
          width: 100%;
          padding: 12px;
          background: #f1f5f9;
          color: #1976d2;
          border: 2px dashed #94a3b8;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .btn-add-item:hover {
          background: #e2e8f0;
          border-color: #1976d2;
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

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.4rem;
          }

          .apd-table {
            min-width: 800px;
            font-size: 0.8rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 8px 6px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .header-banner {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: flex-start;
          }

          .btn-back-text {
            display: inline;
          }

          .page-title {
            font-size: 1.3rem;
            margin: 8px 0 0 0;
          }

          .date-filter {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px;
          }

          .filter-group {
            width: 100%;
          }

          .date-input,
          .location-select {
            width: 100%;
            min-width: 100%;
            font-size: 0.9rem;
          }

          .clear-filter,
          .btn-add {
            width: 100%;
            justify-content: center;
          }

          .btn-add {
            margin-left: 0;
          }

          .riwayat-container {
            padding: 16px 12px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .apd-table {
            min-width: 700px;
            font-size: 0.75rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 6px 4px;
          }

          .history-image {
            width: 45px;
            height: 45px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .card-date,
          .card-checker {
            font-size: 0.85rem;
          }

          .item-lokasi {
            font-size: 0.95rem;
            padding: 10px 12px 4px;
          }

          .item-details {
            padding: 0 12px 12px;
          }

          .detail-label {
            min-width: 100px;
            font-size: 0.8rem;
          }

          .detail-value {
            font-size: 0.85rem;
          }

          .item-photo {
            width: 50px;
            height: 50px;
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

          .status-grid {
            grid-template-columns: repeat(2, 1fr);
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
            padding: 12px 8px;
          }

          .header-banner {
            padding: 10px 12px;
          }

          .page-title {
            font-size: 1.1rem;
          }

          .date-filter {
            padding: 10px;
            gap: 10px;
          }

          .filter-group label {
            font-size: 0.85rem;
          }

          .date-input,
          .location-select {
            font-size: 0.85rem;
            padding: 8px 10px;
          }

          .clear-filter,
          .btn-add {
            font-size: 0.85rem;
            padding: 10px 14px;
          }

          .riwayat-container {
            padding: 12px 8px;
          }

          .card-header {
            padding: 12px;
          }

          .card-date,
          .card-checker {
            font-size: 0.8rem;
          }

          .card-body {
            padding: 12px;
          }

          .item-header {
            padding: 10px 12px;
          }

          .item-no {
            padding: 3px 10px;
            font-size: 0.8rem;
          }

          .item-status {
            font-size: 0.75rem;
            padding: 3px 10px;
          }

          .item-lokasi {
            font-size: 0.9rem;
            padding: 10px 12px 4px;
          }

          .item-details {
            padding: 0 12px 12px;
          }

          .detail-row {
            padding: 6px 0;
          }

          .detail-label {
            min-width: 90px;
            font-size: 0.75rem;
          }

          .detail-value {
            font-size: 0.8rem;
          }

          .item-photo {
            width: 45px;
            height: 45px;
          }

          .apd-table {
            min-width: 600px;
            font-size: 0.7rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 4px 3px;
          }

          .history-image {
            width: 40px;
            height: 40px;
          }

          .spinner {
            width: 35px;
            height: 35px;
          }

          .status-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            flex-direction: column;
            gap: 8px;
          }

          .form-group-small {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}