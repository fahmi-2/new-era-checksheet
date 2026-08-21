// app/status-ga/inspeksi-apar/[slug]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { ArrowLeft, QrCode } from "lucide-react";
import { format, parse, isBefore, isValid } from "date-fns";
import { aparDataBySlug, type AparDataItem } from "@/lib/apar-data";

// ✅ TAMBAHKAN IMPORTS INI UNTUK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { ScanAreaRequired } from "@/components/ScanAreaRequired";

const areaNames: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM",
  "area-training-dining-mtc": "AREA TRAINING & DINING ROOM",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (GENBA A)",
  "power-house-genba-c": "POWER HOUSE (GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE & WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

const checkItems = [
  { label: "Masa Berlaku", short: "Masa", help: "Lihat identitas APAR apakah masih berlaku" },
  { label: "Tekanan", short: "Tekanan", help: "Jarum tekanan di warna hijau" },
  { label: "Isi Tabung", short: "Isi", help: "Isi APAR tidak menggumpal" },
  { label: "Selang", short: "Selang", help: "Selang tidak rusak" },
  { label: "Segel", short: "Segel", help: "Segel terkunci" },
  { label: "Kondisi Tabung", short: "Tabung", help: "Area APAR tidak terhalang" },
  { label: "Gantungan", short: "Gantung", help: "Gantungan tidak rusak" },
  { label: "Lay out", short: "Layout", help: "APAR ada lay out" },
  { label: "Papan Petunjuk", short: "Papan", help: "Terpasang dan mudah dilihat" },
  { label: "OS & C/S", short: "OS/CS", help: "Terpasang rapi dan update" },
  { label: "Area Sekitar", short: "Area", help: "Akses APAR mudah" },
  { label: "Posisi APAR", short: "Posisi", help: "APAR tidak bergeser" },
];

export default function InspeksiAparForm({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = use(params);

  // ✅ TAMBAHKAN HOOK INI UNTUK SCAN VERIFICATION
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  const { isOnline, pendingCount } = useConnection();
  
  const today = new Date();
  const date = format(today, "yyyy-MM-dd");

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPhotoPreviews, setTempPhotoPreviews] = useState<Record<number, string>>({});
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showLoadMaster, setShowLoadMaster] = useState(false);
  const [masterData, setMasterData] = useState<AparDataItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Konversi dari format dd/MM/yyyy ke yyyy-MM-dd (untuk date picker)
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parsed = parseExpDate(dateStr);
    return parsed ? format(parsed, 'yyyy-MM-dd') : '';
  };

  // Konversi dari format yyyy-MM-dd (date picker) ke dd/MM/yyyy (untuk display/storage)
  const formatDateForStorage = (dateStr: string): string => {
    if (!dateStr) return '';
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : dateStr;
  };

  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  useEffect(() => {
    const areaName = areaNames[slug];
    if (!areaName) {
      alert("Area tidak ditemukan!");
      router.push("/status-ga/inspeksi-apar");
      return;
    }
    const rawData: AparDataItem[] = aparDataBySlug[slug as keyof typeof aparDataBySlug] || [];
    const initialItems = rawData.map((item) => ({
      no: item.no,
      jenisApar: item.jenisApar,
      lokasi: item.lokasi,
      noApar: item.noApar,
      expDate: item.expDate,
      hydrotestDate: item.hydrotestDate || "",
      expDateInput: formatDateForInput(item.expDate),
      hydrotestDateInput: formatDateForInput(item.hydrotestDate),
      ...Object.fromEntries(checkItems.map((_, idx) => [`check${idx + 1}`, "OK"])),
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
    
    const autoLoadMasterData = async () => {
      try {
        const response = await smartFetch(`/e-checksheet-ga/api/apar/master?slug=${slug}`, {
          queueType: 'apar',
          metadata: { areaCode: 'apar' }
        });
        const result = await response.json();
        
        if (response.ok && result.success && result.data && result.data.length > 0) {
          const masterData = result.data;
          let newItems;
          
          if (masterData.length > initialItems.length) {
            newItems = masterData.map((m: any, idx: number) => ({
              no: idx + 1,
              jenisApar: m.jenisApar || '',
              lokasi: m.lokasi || '',
              noApar: m.noApar || '',
              expDate: m.expDate || '',
              expDateInput: formatDateForInput(m.expDate),
              hydrotestDate: m.hydrotestDate || '',
              hydrotestDateInput: formatDateForInput(m.hydrotestDate),
              ...Object.fromEntries(checkItems.map((_, i) => [`check${i + 1}`, 'OK'])),
              keterangan: '',
              tindakanPerbaikan: '',
              pic: user?.fullName || '',
              foto: '',
            }));
          } else {
            newItems = initialItems.map((item) => {
              const masterItem = masterData.find((m: any) => m.noApar === item.noApar);
              if (masterItem) {
                return {
                  ...item,
                  jenisApar: masterItem.jenisApar || item.jenisApar,
                  lokasi: masterItem.lokasi || item.lokasi,
                  expDate: masterItem.expDate || item.expDate,
                  expDateInput: formatDateForInput(masterItem.expDate),
                  hydrotestDate: masterItem.hydrotestDate || item.hydrotestDate,
                  hydrotestDateInput: formatDateForInput(masterItem.hydrotestDate),
                };
              }
              return item;
            });
          }
          
          setItems(newItems);
          console.log(`✅ Auto-load master data berhasil: ${masterData.length} item diterapkan`);
        }
      } catch (error) {
        console.error('Auto-load master error:', error);
      }
    };
    
    autoLoadMasterData();
  }, [slug, user]);

  const loadMasterData = async () => {
    try {
      setLoadingMaster(true);
      const response = await smartFetch(`/e-checksheet-ga/api/apar/master?slug=${slug}`, {
        queueType: 'apar',
        metadata: { areaCode: 'apar' }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        if (result.data && result.data.length > 0) {
          setMasterData(result.data);
          setShowLoadMaster(true);
        } else {
          alert('⚠️ Data master belum tersedia untuk area ini. Silakan lakukan inspeksi terlebih dahulu.');
        }
      } else {
        alert('⚠️ Gagal memuat data master: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Load master error:', error);
      alert('❌ Terjadi kesalahan saat memuat data master');
    } finally {
      setLoadingMaster(false);
    }
  };

  const applyMasterData = () => {
    if (masterData.length === 0) return;

    const newItems = items.map((item, index) => {
      const masterItem = masterData.find(m => m.noApar === item.noApar);
      if (masterItem) {
        return {
          ...item,
          jenisApar: masterItem.jenisApar || item.jenisApar,
          lokasi: masterItem.lokasi || item.lokasi,
          expDate: masterItem.expDate || item.expDate,
          expDateInput: formatDateForInput(masterItem.expDate),
          hydrotestDate: masterItem.hydrotestDate || item.hydrotestDate,
          hydrotestDateInput: formatDateForInput(masterItem.hydrotestDate),
        };
      }
      return item;
    });

    setItems(newItems);
    setShowLoadMaster(false);
    setMasterData([]);
    alert('✅ Data master berhasil diterapkan ke form!');
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    
    if (field === 'expDateInput' || field === 'hydrotestDateInput') {
      const storageField = field.replace('Input', '');
      const formattedValue = formatDateForStorage(value);
      newItems[index] = { 
        ...newItems[index], 
        [field]: value,
        [storageField]: formattedValue
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoPreviews(prev => ({ ...prev, [index]: reader.result as string }));
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', slug);
      formData.append('lokasi', items[index].lokasi);

      const response = await smartFetch('/e-checksheet-ga/api/apar/upload', { 
        method: 'POST', 
        body: formData,
        queueType: 'apar',
        metadata: { areaCode: 'apar' }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        handleInputChange(index, "foto", result.data.path);
        setTempPhotoPreviews(prev => { const n = { ...prev }; delete n[index]; return n; });
        alert('✅ Foto berhasil diupload!');
      } else {
        setTempPhotoPreviews(prev => { const n = { ...prev }; delete n[index]; return n; });
        alert('❌ Gagal upload foto: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setTempPhotoPreviews(prev => { const n = { ...prev }; delete n[index]; return n; });
      alert('❌ Terjadi kesalahan saat upload foto');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    handleInputChange(index, "foto", "");
    setTempPhotoPreviews(prev => { const n = { ...prev }; delete n[index]; return n; });
  };

  const parseExpDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    let parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return parsed;
    parsed = parse(dateStr, "dd/MM/yy", new Date());
    if (isValid(parsed)) return parsed;
    return null;
  };

  const isExpired = (expDateString: string | null | undefined): boolean => {
    const expDate = parseExpDate(expDateString);
    return expDate ? isBefore(expDate, new Date()) : false;
  };

  const isHydrotestExpired = (hydrotestDateString: string | null | undefined): boolean => {
    const hydrotestDate = parseExpDate(hydrotestDateString);
    return hydrotestDate ? isBefore(hydrotestDate, new Date()) : false;
  };

  const handleShowPreview = () => {
    for (const item of items) {
      for (let i = 1; i <= checkItems.length; i++) {
        const val = item[`check${i}`];
        if (!val || !["OK", "NG", "OBS"].includes(val)) {
          alert("⚠️ Semua kolom pengecekan harus diisi dengan 'OK', 'NG', atau 'OBS'!");
          return;
        }
      }
    }
    const ngExists = items.some((item) =>
      Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "NG").some(Boolean)
    );
    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "NG").some(Boolean) &&
          (!item.keterangan || item.keterangan.trim() === "")
      );
      if (missingKeterangan) {
        alert("⚠️ Harap isi kolom 'Keterangan' untuk semua item yang berstatus NG!");
        return;
      }
    }
    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleCancelPreview = () => setShowPreview(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        
        if (!item.jenisApar || item.jenisApar.trim() === '') {
          throw new Error(`Baris ${index + 1}: Jenis APAR wajib diisi`);
        }
        if (!item.lokasi || item.lokasi.trim() === '') {
          throw new Error(`Baris ${index + 1}: Lokasi wajib diisi`);
        }
        if (!item.noApar || item.noApar.trim() === '') {
          throw new Error(`Baris ${index + 1}: Nomor APAR wajib diisi`);
        }
        if (!item.expDate || item.expDate.trim() === '') {
          throw new Error(`Baris ${index + 1}: Exp. Date wajib diisi`);
        }
        
        for (let i = 1; i <= 12; i++) {
          const checkValue = item[`check${i}`];
          if (!checkValue || !['OK', 'NG', 'OBS'].includes(checkValue)) {
            throw new Error(`Baris ${index + 1}: Check item ${i} harus diisi dengan 'OK', 'NG', atau 'OBS'`);
          }
        }
        
        const hasNgItem = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === 'NG').some(Boolean);
        if (hasNgItem && (!item.keterangan || item.keterangan.trim() === '')) {
          throw new Error(`Baris ${index + 1}: Keterangan wajib diisi untuk item dengan status NG`);
        }
      }
      
      const submitData = {
        date, 
        slug,
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: items.map((item) => ({
          no: item.no, 
          jenisApar: item.jenisApar, 
          lokasi: item.lokasi,
          noApar: item.noApar, 
          expDate: item.expDate,
          hydrotestDate: item.hydrotestDate || null,
          check1: item.check1, check2: item.check2, check3: item.check3,
          check4: item.check4, check5: item.check5, check6: item.check6,
          check7: item.check7, check8: item.check8, check9: item.check9,
          check10: item.check10, check11: item.check11, check12: item.check12,
          keterangan: item.keterangan || "", 
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic, 
          foto: item.foto || null
        }))
      };
      
      const response = await smartFetch('/e-checksheet-ga/api/apar/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(submitData),
        credentials: 'include',
        queueType: 'apar',
        metadata: { areaCode: 'apar' }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ Data berhasil disimpan! Data ini akan menjadi master untuk inspeksi berikutnya.');
        router.push(`/status-ga/inspeksi-apar/${slug}/riwayat`);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ Gagal menyimpan data: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const handleAddItem = () => {
    const maxNo = Math.max(0, ...items.map(item => item.no || 0));
    const newItem = {
      no: maxNo + 1, jenisApar: "", lokasi: "", noApar: "", expDate: "", hydrotestDate: "",
      ...Object.fromEntries(checkItems.map((_, idx) => [`check${idx + 1}`, "OK"])),
      keterangan: "", tindakanPerbaikan: "", pic: user?.fullName || "", foto: "",
    };
    setItems([...items, newItem]);
    setExpandedItem(items.length);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('⚠️ Minimal harus ada 1 item dalam daftar!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      const newItems = items.filter((_, i) => i !== index);
      const renumberedItems = newItems.map((item, i) => ({ ...item, no: i + 1 }));
      setItems(renumberedItems);
    }
  };

  if (!user || !isAuthorizedForChecksheet(user)) return null;



  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button onClick={() => router.push("/status-ga/inspeksi-apar")} className="btn-back">
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">🧯 Inspeksi APAR - {areaNames[slug]}</h1>
        </div>

        <p className="subtitle">
          📅{" "}
          <span className="date-text">
            {new Date(date).toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </span>
        </p>

        {/* Load Master Button */}
        <div className="action-buttons" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={loadMasterData} 
            disabled={loadingMaster || loading || !isScanned}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loadingMaster || loading || !isScanned) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={!isScanned ? "Harap scan QR code area terlebih dahulu" : ""}
          >
            {loadingMaster ? '⏳ Memuat...' : '📥 Load Master Data'}
          </button>
        </div>

       {/* ✅ SCAN WARNING BANNER - PERBAIKAN */}
{!isScanned && (
  <div className="banner banner-warning scan-warning">
    <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
    <button
      onClick={() => {
        console.log("Scan button clicked"); // Debug log
        router.push("/scan");
      }}
      className="banner-btn"
      disabled={loading}
      type="button" // Tambahkan type="button"
    >
      <QrCode size={14} /> Scan Sekarang
    </button>
  </div>
)}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memproses...</p>
          </div>
        )}

        {/* Load Master Modal */}
        {showLoadMaster && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div className="modal-content" style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '16px' }}>📥 Data Master Tersedia</h2>
              <p style={{ marginBottom: '16px' }}>
                Berikut adalah data master yang akan diterapkan ke form. Data berasal dari inspeksi terakhir.
              </p>
              
              <div style={{ maxHeight: '400px', overflow: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>No</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Jenis APAR</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Lokasi</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>No. APAR</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Exp. Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterData.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.no}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.jenisApar}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.lokasi}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.noApar}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.expDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { setShowLoadMaster(false); setMasterData([]); }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button 
                  onClick={applyMasterData}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Terapkan Data Master
                </button>
              </div>
            </div>
          </div>
        )}

        {!showPreview ? (
          <div className="card-container">
            {/* ✅ DESKTOP: Table View */}
            <div className="desktop-view">
              <div className="table-scroll-wrapper">
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Hapus Kolom</th>
                      <th className="sticky-col">No</th>
                      <th>Jenis APAR</th>
                      <th>Lokasi</th>
                      <th>No. APAR</th>
                      <th>Exp. Date</th>
                      <th>Hydrotest Date</th>
                      {checkItems.map((item, idx) => (
                        <th key={idx} title={item.help} className="check-th">{item.short}</th>
                      ))}
                      <th>Keterangan</th>
                      <th>Tindakan</th>
                      <th>PIC</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="delete-col">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            className="delete-btn"
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : "Hapus item ini"}
                          >
                            ✕
                          </button>
                        </td>
                        <td className="sticky-col">{item.no}</td>
                        
                        {/* ✅ Jenis APAR - Editable Input */}
                        <td>
                          <input
                            type="text"
                            value={item.jenisApar}
                            onChange={(e) => handleInputChange(index, "jenisApar", e.target.value)}
                            className="notes-input"
                            disabled={loading || !isScanned}
                            placeholder="Jenis APAR..."
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </td>
                        
                        {/* ✅ Lokasi - Editable Input */}
                        <td>
                          <input
                            type="text"
                            value={item.lokasi}
                            onChange={(e) => handleInputChange(index, "lokasi", e.target.value)}
                            className="notes-input"
                            disabled={loading || !isScanned}
                            placeholder="Lokasi..."
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </td>
                        
                        {/* ✅ No. APAR - Editable Input */}
                        <td>
                          <input
                            type="text"
                            value={item.noApar}
                            onChange={(e) => handleInputChange(index, "noApar", e.target.value)}
                            className="notes-input"
                            disabled={loading || !isScanned}
                            placeholder="No. APAR..."
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </td>
                        
                        {/* ✅ Exp. Date - Date Picker */}
                        <td>
                          <input
                            type="date"
                            value={item.expDateInput || ''}
                            onChange={(e) => handleInputChange(index, "expDateInput", e.target.value)}
                            className={`status-select ${isExpired(item.expDate) ? 'status-expired' : ''}`}
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : "Klik untuk mengubah tanggal kedaluwarsa"}
                          />
                        </td>
                        
                        {/* ✅ Hydrotest Date - Date Picker */}
                        <td>
                          <input
                            type="date"
                            value={item.hydrotestDateInput || ''}
                            onChange={(e) => handleInputChange(index, "hydrotestDateInput", e.target.value)}
                            className={`notes-input ${isHydrotestExpired(item.hydrotestDate) ? 'status-expired' : ''}`}
                            disabled={loading || !isScanned}
                            placeholder="Pilih tanggal"
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : (isHydrotestExpired(item.hydrotestDate) ? '⚠️ Hydrotest sudah expired' : 'Pilih tanggal hydrotest')}
                          />
                        </td>
                        
                        {/* Checklist Items */}
                        {checkItems.map((_, idx) => (
                          <td key={idx}>
                            <select
                              value={item[`check${idx + 1}`]}
                              onChange={(e) => handleInputChange(index, `check${idx + 1}`, e.target.value)}
                              className="status-select"
                              disabled={loading || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                              <option value="OBS">OBS</option>
                            </select>
                          </td>
                        ))}
                        
                        {/* Keterangan, Tindakan, PIC, Foto */}
                        <td>
                          <input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                            placeholder="Wajib jika NG"
                            className="notes-input"
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.tindakanPerbaikan}
                            onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                            placeholder="Tindakan..."
                            className="notes-input"
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </td>
                        <td><div className="info-cell">{item.pic}</div></td>
                        <td>
                          <div className="image-upload">
                            {(items[index].foto || tempPhotoPreviews[index]) ? (
                              <div className="image-preview">
                                <img
                                  src={
                                    tempPhotoPreviews[index] ||
                                    (items[index].foto.startsWith('data:')
                                      ? items[index].foto
                                      : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${items[index].foto}`)
                                  }
                                  alt="Preview"
                                  className="uploaded-image"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveImage(index)} 
                                  className="remove-btn" 
                                  disabled={loading || !isScanned}
                                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                >
                                  ✕
                                </button>
                                {loading && <div className="upload-loading"><div className="spinner-small"></div></div>}
                              </div>
                            ) : (
                              <label className={`file-label ${!isScanned ? 'disabled' : ''}`}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                                📷 Unggah
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => handleImageUpload(e, index)} 
                                  className="file-input" 
                                  disabled={loading || !isScanned} 
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Card View */}
            <div className="mobile-view">
              {items.map((item, index) => (
                <div key={index} className="checklist-card">
                  <div className="card-header" onClick={() => toggleExpandItem(index)}>
                    <div className="card-no">{item.no}</div>
                    <div className="card-info">
                      <div className="card-zona">{item.jenisApar}</div>
                      <div className="card-lokasi">{item.lokasi}</div>
                      <div className="card-noapar">No. APAR: {item.noApar}</div>
                    </div>
                    <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>▼</div>
                  </div>
                  {expandedItem === index && (
                    <div className="card-body">
                      {/* ✅ Jenis APAR - Mobile */}
                      <div className="form-group">
                        <label>Jenis APAR *</label>
                        <input
                          type="text"
                          value={item.jenisApar}
                          onChange={(e) => handleInputChange(index, "jenisApar", e.target.value)}
                          className="notes-input"
                          disabled={loading || !isScanned}
                          placeholder="Jenis APAR..."
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>
                      
                      {/* ✅ Lokasi - Mobile */}
                      <div className="form-group">
                        <label>Lokasi *</label>
                        <input
                          type="text"
                          value={item.lokasi}
                          onChange={(e) => handleInputChange(index, "lokasi", e.target.value)}
                          className="notes-input"
                          disabled={loading || !isScanned}
                          placeholder="Lokasi..."
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>
                      
                      {/* ✅ No. APAR - Mobile */}
                      <div className="form-group">
                        <label>No. APAR *</label>
                        <input
                          type="text"
                          value={item.noApar}
                          onChange={(e) => handleInputChange(index, "noApar", e.target.value)}
                          className="notes-input"
                          disabled={loading || !isScanned}
                          placeholder="No. APAR..."
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>
                      
                      {/* Exp. Date - Mobile */}
                      <div className="form-group">
                        <label>Exp. Date *</label>
                        <input
                          type="date"
                          value={item.expDateInput || ''}
                          onChange={(e) => handleInputChange(index, "expDateInput", e.target.value)}
                          className={`notes-input ${isExpired(item.expDate) ? 'status-expired' : ''}`}
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                        {isExpired(item.expDate) && <span className="text-warning text-sm">⚠️ Expired</span>}
                      </div>
                      
                      {/* Hydrotest Date - Mobile */}
                      <div className="form-group">
                        <label>Hydrotest Date</label>
                        <input
                          type="date"
                          value={item.hydrotestDateInput || ''}
                          onChange={(e) => handleInputChange(index, "hydrotestDateInput", e.target.value)}
                          className={`notes-input ${isHydrotestExpired(item.hydrotestDate) ? 'status-expired' : ''}`}
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                        {isHydrotestExpired(item.hydrotestDate) && <span className="text-warning text-sm">⚠️ Hydrotest Expired</span>}
                      </div>
                      
                      {/* Checklist Section */}
                      <div className="checklist-section">
                        <h4 className="section-title">✅ Checklist Inspeksi</h4>
                        {checkItems.map((checkItem, idx) => (
                          <div key={idx} className="check-row">
                            <label className="check-label" title={checkItem.help}>{checkItem.label}</label>
                            <select
                              value={item[`check${idx + 1}`]}
                              onChange={(e) => handleInputChange(index, `check${idx + 1}`, e.target.value)}
                              className="check-select"
                              disabled={loading || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                              <option value="OBS">OBS</option>
                            </select>
                          </div>
                        ))}
                      </div>
                      
                      {/* Keterangan & Tindakan */}
                      <div className="form-group">
                        <label>Keterangan</label>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib diisi jika NG"
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tindakan Perbaikan</label>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan perbaikan..."
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>
                      <div className="form-group">
                        <label>PIC</label>
                        <div className="info-cell-mobile">{item.pic}</div>
                      </div>
                      <div className="form-group">
                        <label>Foto</label>
                        <div className="image-upload">
                          {(items[index].foto || tempPhotoPreviews[index]) ? (
                            <div className="image-preview">
                              <img
                                src={
                                  tempPhotoPreviews[index] ||
                                  (items[index].foto.startsWith('data:')
                                    ? items[index].foto
                                    : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${items[index].foto}`)
                                }
                                alt="Preview"
                                className="uploaded-image"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveImage(index)} 
                                className="remove-btn" 
                                disabled={loading || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                ✕
                              </button>
                              {loading && <div className="upload-loading"><div className="spinner-small"></div></div>}
                            </div>
                          ) : (
                            <label className={`file-label file-label-large ${!isScanned ? 'disabled' : ''}`}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                              📷 Unggah Foto
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, index)} 
                                className="file-input" 
                                disabled={loading || !isScanned} 
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button 
                onClick={handleAddItem} 
                className="btn-add-item" 
                disabled={loading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                ➕ Tambah Item
              </button>
              <button 
                onClick={() => router.push("/status-ga/inspeksi-apar")} 
                className="btn-cancel" 
                disabled={loading}
              >
                Batal
              </button>
              <button 
                onClick={handleShowPreview} 
                className="btn-submit" 
                disabled={loading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                👁️ Preview & Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="card-container preview-mode">
            <h2 className="preview-title">🔍 Preview Data</h2>

            {/* ✅ DESKTOP: Preview Table */}
            <div className="desktop-view">
              <div className="table-scroll-wrapper">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">No</th>
                      <th>Lokasi</th>
                      <th>No. APAR</th>
                      <th>Status</th>
                      <th>Keterangan</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const hasNgItem = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === "NG").some(Boolean);
                      return (
                        <tr key={index} className={hasNgItem ? "row-ng" : ""}>
                          <td className="sticky-col">{item.no}</td>
                          <td>{item.lokasi}</td>
                          <td>{item.noApar}</td>
                          <td className={hasNgItem ? "status-ng" : "status-ok"}>{hasNgItem ? "NG" : "OK"}</td>
                          <td>{item.keterangan || "-"}</td>
                          <td>
                            {item.foto ? (
                              <img
                                src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                                alt="Foto"
                                className="preview-image"
                              />
                            ) : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Preview Cards */}
            <div className="mobile-view">
              {items.map((item, index) => {
                const hasNgItem = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === "NG").some(Boolean);
                return (
                  <div key={index} className={`preview-card ${hasNgItem ? 'preview-card-ng' : ''}`}>
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className={`preview-card-status ${hasNgItem ? 'status-ng' : 'status-ok'}`}>
                        {hasNgItem ? 'NG' : 'OK'}
                      </span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Lokasi:</span>
                        <span className="preview-value">{item.lokasi}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">No. APAR:</span>
                        <span className="preview-value">{item.noApar}</span>
                      </div>
                      {item.keterangan && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.keterangan}</span>
                        </div>
                      )}
                      {item.foto && (
                        <div className="preview-row">
                          <span className="preview-label">Foto:</span>
                          <img
                            src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                            alt="Foto"
                            className="preview-card-image"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn" disabled={loading}>← Kembali</button>
              <button onClick={handleSave} className="save-btn" disabled={loading}>💾 Simpan Data</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
          margin: 0; padding: 0; background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        /* ── Layout ─────────────────────────────────────── */
        .app-page {
          display: flex; min-height: 100vh; background-color: #f7f9fc;
        }
        .page-content {
          flex: 1; max-width: 1400px; margin: 0 auto; padding: 24px; width: 100%;
        }

        /* ── Header Banner ──────────────────────────────── */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white; padding: 16px 24px; border-radius: 16px;
          margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .btn-back {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px;
          background: rgba(255,255,255,0.2); color: white; border: none;
          border-radius: 8px; cursor: pointer; font-weight: 600;
          transition: all 0.3s ease; font-size: 0.9rem; min-height: 44px;
        }
        .btn-back:hover { background: rgba(255,255,255,0.3); }
        .btn-back-text { display: inline; }
        .page-title { margin: 0; font-size: 1.4rem; font-weight: 700; flex: 1; word-break: break-word; }

        /* ── Subtitle / Date ────────────────────────────── */
        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 1rem;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .date-text {
          font-weight: 700;
          font-size: 1.1rem;
          color: #ffeb3b;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 12px;
          border-radius: 8px;
          letter-spacing: 0.3px;
        }

        /* ── Banners ────────────────────────────────────── */
        .banner {
          border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px; font-weight: 500;
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-btn {
          margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; border: none; border-radius: 7px; padding: 5px 14px;
          cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
        }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 6px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }

        /* ── Card Container ─────────────────────────────── */
        .card-container {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          padding: 24px; color: white; position: relative;
        }
        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* ── Desktop/Mobile Toggle ──────────────────────── */
        .desktop-view { display: block; }
        .mobile-view { display: none; }

        /* ── Table ──────────────────────────────────────── */
        .table-scroll-wrapper {
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 24px;
        }
        .table-scroll-wrapper::-webkit-scrollbar { height: 6px; }
        .table-scroll-wrapper::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .table-scroll-wrapper::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.4); border-radius: 3px; }

        .checklist-table, .simple-table {
          width: 100%; min-width: max-content; border-collapse: collapse;
          color: #fff8f8; font-size: 0.8rem; table-layout: auto;
        }
        .checklist-table th, .checklist-table td,
        .simple-table th, .simple-table td {
          padding: 10px 12px; text-align: left;
          border: 1px solid rgba(255,255,255,0.2); color: white;
          white-space: nowrap; vertical-align: middle;
        }
        .checklist-table td:nth-child(3),
        .checklist-table td:nth-child(10),
        .checklist-table td:nth-child(11) {
          white-space: normal;
          word-break: break-word;
          max-width: 150px;
        }
        .checklist-table th, .simple-table th {
          background: rgba(0,0,0,0.15); font-weight: 600; position: sticky; top: 0;
          color: white; z-index: 10;
        }
        .sticky-col {
          position: sticky; left: 0; background: inherit; z-index: 8;
          box-shadow: 2px 0 4px rgba(0,0,0,0.2);
        }
        .checklist-table th.sticky-col, .simple-table th.sticky-col {
          background: rgba(0,0,0,0.15); z-index: 15;
        }
        .check-th { text-align: center; }
        .row-ng { background: rgba(244,67,54,0.1); }

        /* ── Form Controls ──────────────────────────────── */
        .status-select, .notes-input {
          width: 100%; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px; font-size: 0.85rem; background: rgba(255,255,255,0.9);
          color: #333; min-height: 40px;
        }
        .status-select:focus, .notes-input:focus {
          outline: none; border-color: #4fc3f7;
          box-shadow: 0 0 0 2px rgba(79,195,247,0.3);
        }
        .status-select:disabled, .notes-input:disabled {
          background: rgba(255,255,255,0.5); cursor: not-allowed;
        }
        .info-cell {
          background: rgba(255,255,255,0.4); color: white;
          font-weight: 500; padding: 6px 10px; border-radius: 6px;
        }
        .status-expired {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
          font-weight: bold;
        }
        .status-ng {
          background: rgba(244,67,54,0.3); color: #ffcdd2;
          font-weight: bold; border-radius: 4px; padding: 4px 8px;
        }
        .status-ok {
          background: rgba(76,175,80,0.3); color: #c8e6c9;
          font-weight: bold; border-radius: 4px; padding: 4px 8px;
        }

        /* ── Delete col ─────────────────────────────────── */
        .delete-col { text-align: center; }
        .delete-btn {
          background: rgba(244,67,54,0.8); color: white; border: none;
          border-radius: 6px; width: 28px; height: 28px; cursor: pointer;
          font-size: 0.75rem; font-weight: 700; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; margin: 0 auto;
        }
        .delete-btn:hover { background: #f44336; transform: scale(1.1); }
        .delete-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Image Upload ───────────────────────────────── */
        .image-upload { display: flex; justify-content: center; align-items: center; min-height: 44px; }
        .image-preview { position: relative; width: 80px; height: 80px; }
        .uploaded-image { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid white; }
        .preview-image { max-width: 80px; max-height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid white; }
        .remove-btn {
          position: absolute; top: -8px; right: -8px; background: #f44336; color: white;
          border: 2px solid white; border-radius: 50%; width: 24px; height: 24px;
          font-size: 14px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; padding: 0; transition: all 0.2s;
          min-height: 24px; min-width: 24px;
        }
        .remove-btn:hover { background: #d32f2f; transform: scale(1.1); }
        .remove-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .file-label {
          display: flex; align-items: center; justify-content: center;
          padding: 8px 16px; background: rgba(255,255,255,0.9); color: #333;
          border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background 0.2s;
          min-height: 44px;
        }
        .file-label-large { width: 100%; padding: 12px 16px; }
        .file-label:hover { background: rgba(255,255,255,1); }
        .file-label.disabled {
          background: rgba(255,255,255,0.5); cursor: not-allowed; color: #666;
        }
        .file-input { display: none; }
        .upload-loading {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex;
          justify-content: center; align-items: center; border-radius: 6px;
        }

        /* ── Mobile Card View ───────────────────────────── */
        .checklist-card, .preview-card {
          background: rgba(255,255,255,0.1); border-radius: 12px;
          margin-bottom: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);
        }
        .preview-card-ng { border-color: rgba(244,67,54,0.5); background: rgba(244,67,54,0.1); }
        .card-header, .preview-card-header {
          display: flex; align-items: center; gap: 12px; padding: 16px;
          cursor: pointer; background: rgba(0,0,0,0.1); transition: background 0.2s; min-height: 44px;
        }
        .card-header:hover, .preview-card-header:hover { background: rgba(0,0,0,0.2); }
        .card-no, .preview-card-no {
          width: 36px; height: 36px; background: #1976d2; color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1rem; flex-shrink: 0;
        }
        .preview-card-status {
          margin-left: auto; padding: 4px 12px; border-radius: 20px;
          font-weight: 600; font-size: 0.8rem;
        }
        .preview-card-status.status-ok { background: rgba(76,175,80,0.3); color: #c8e6c9; }
        .preview-card-status.status-ng { background: rgba(244,67,54,0.3); color: #ffcdd2; }
        .card-info { flex: 1; min-width: 0; }
        .card-zona { font-size: 0.85rem; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
        .card-lokasi { font-size: 1rem; font-weight: 600; color: white; word-break: break-word; margin-bottom: 4px; }
        .card-noapar { font-size: 0.8rem; color: rgba(255,255,255,0.9); }
        .expand-icon { font-size: 1.2rem; color: rgba(255,255,255,0.8); transition: transform 0.3s ease; }
        .expand-icon.expanded { transform: rotate(180deg); }
        .card-body, .preview-card-body { padding: 16px; background: rgba(0,0,0,0.1); }
        .info-cell-mobile {
          padding: 8px 10px; background: rgba(255,255,255,0.15);
          border-radius: 6px; color: white; font-weight: 500; font-size: 0.9rem;
        }
        .info-cell-mobile.expired { color: #ffcdd2; font-weight: 700; }
        .checklist-section { margin-bottom: 14px; }
        .section-title {
          font-size: 0.95rem; font-weight: 600; color: white;
          margin-bottom: 10px; padding-bottom: 8px;
          border-bottom: 2px solid rgba(255,255,255,0.2);
        }
        .check-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .check-row:last-child { border-bottom: none; }
        .check-label { font-size: 0.85rem; color: rgba(255,255,255,0.9); flex: 1; padding-right: 10px; }
        .check-select {
          width: 100%; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px; font-size: 0.85rem; background: rgba(255,255,255,0.9);
          color: #333; min-height: 40px; min-width: 90px;
        }
        .check-select:disabled { background: rgba(255,255,255,0.5); cursor: not-allowed; }
        .form-group { margin-bottom: 16px; }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label {
          display: block; margin-bottom: 6px; font-size: 0.9rem;
          color: rgba(255,255,255,0.9); font-weight: 500;
        }
        .preview-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); gap: 12px;
        }
        .preview-row:last-child { border-bottom: none; }
        .preview-label { font-size: 0.85rem; color: rgba(255,255,255,0.8); font-weight: 500; min-width: 80px; flex-shrink: 0; }
        .preview-value { font-size: 0.9rem; color: white; word-break: break-word; text-align: right; flex: 1; }
        .preview-card-image {
          width: 60px; height: 60px; object-fit: cover; border-radius: 6px;
          border: 2px solid white; cursor: pointer;
        }

        /* ── Form Actions & Buttons ─────────────────────── */
        .form-actions, .preview-actions {
          display: flex; gap: 16px; justify-content: flex-end;
          margin-top: 20px; flex-wrap: wrap;
        }
        .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn {
          padding: 12px 24px; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; font-size: 1rem;
          transition: all 0.2s ease; min-height: 48px; min-width: 120px;
        }
        .btn-cancel, .cancel-btn {
          background: rgba(255,255,255,0.2); color: white;
        }
        .btn-cancel:hover, .cancel-btn:hover { background: rgba(255,255,255,0.3); }
        .btn-cancel:disabled, .cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-add-item { background: rgba(79,195,247,0.8); color: white; }
        .btn-add-item:hover { background: rgba(79,195,247,1); }
        .btn-add-item:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-submit { background: #4caf50; color: white; }
        .btn-submit:hover { background: #43a047; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-btn { background: #2e7d32; color: white; }
        .save-btn:hover { background: #1b5e20; }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .preview-title {
          margin: 0 0 24px; color: white; font-size: 1.5rem;
          text-align: center; font-weight: 700;
        }

        /* ── Loading ────────────────────────────────────── */
        .loading-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
          justify-content: center; align-items: center; z-index: 9999; color: white;
        }
        .spinner {
          width: 60px; height: 60px; border: 6px solid rgba(255,255,255,0.3);
          border-top-color: #4caf50; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin-bottom: 16px;
        }
        .spinner-small {
          width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #4caf50; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive: Tablet ─────────────────────────── */
        @media (max-width: 1024px) {
          .page-content { padding: 20px 16px; }
          .page-title { font-size: 1.4rem; }
          .checklist-table, .simple-table { font-size: 0.82rem; }
          .checklist-table th, .checklist-table td,
          .simple-table th, .simple-table td { padding: 8px 10px; }
        }

        /* ── Responsive: Mobile ─────────────────────────── */
        @media (max-width: 768px) {
          .page-content { padding: 16px 12px; margin-left: 0; }
          .header-banner { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 12px; }
          .btn-back { width: 100%; justify-content: center; }
          .page-title { font-size: 1.3rem; width: 100%; }
          .subtitle { font-size: 0.9rem; width: 100%; }
          .date-text { font-size: 1rem; width: 100%; text-align: center; }
          .card-container { padding: 16px 12px; }
          .desktop-view { display: none; }
          .mobile-view { display: block; }
          .form-actions, .preview-actions { flex-direction: column; gap: 12px; }
          .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn {
            width: 100%; min-height: 52px; font-size: 1rem;
          }
          .image-preview { width: 70px; height: 70px; }
          .preview-image { max-width: 70px; max-height: 70px; }
          .card-no { width: 32px; height: 32px; font-size: 0.9rem; }
          .card-lokasi { font-size: 0.95rem; }
          .preview-label { min-width: 70px; font-size: 0.8rem; }
          .preview-value { font-size: 0.85rem; }
          .preview-card-image { width: 55px; height: 55px; }
        }

        /* ── Responsive: Small Mobile ───────────────────── */
        @media (max-width: 480px) {
          .page-content { padding: 12px 8px; }
          .header-banner { padding: 10px 12px; }
          .page-title { font-size: 1.1rem; }
          .subtitle { font-size: 0.85rem; }
          .date-text { font-size: 0.9rem; padding: 3px 8px; }
          .card-container { padding: 12px 8px; }
          .card-header, .preview-card-header { padding: 12px; }
          .card-no, .preview-card-no { width: 28px; height: 28px; font-size: 0.85rem; }
          .card-body, .preview-card-body { padding: 12px; }
          .check-row { padding: 7px 0; }
          .check-label { font-size: 0.75rem; }
          .check-select { min-width: 80px; font-size: 0.85rem; }
          .form-group label { font-size: 0.85rem; }
          .status-select, .notes-input { font-size: 0.9rem; min-height: 44px; }
          .file-label { padding: 10px 14px; font-size: 0.85rem; min-height: 44px; }
          .file-label-large { padding: 12px 14px; }
          .image-preview { width: 60px; height: 60px; }
          .preview-image { max-width: 60px; max-height: 60px; }
          .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn {
            min-height: 56px; font-size: 0.95rem; padding: 14px 20px;
          }
          .preview-title { font-size: 1.3rem; }
          .preview-label { min-width: 60px; font-size: 0.7rem; }
          .preview-value { font-size: 0.8rem; }
          .preview-card-image { width: 45px; height: 45px; }
        }

        /* ── Touch-friendly ─────────────────────────────── */
        @media (hover: none) and (pointer: coarse) {
          .status-select, .notes-input, .check-select, .file-label {
            font-size: 16px; min-height: 44px;
          }
          .btn-back, .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn { min-height: 44px; }
          .remove-btn { min-height: 44px; min-width: 44px; width: 44px; height: 44px; }
        }

        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
      `}</style>
    </div>
  );
}