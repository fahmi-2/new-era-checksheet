// app/status-ga/checksheet-toilet/riwayat/[area]/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Download, Eye, X, CheckCircle, XCircle, ChevronDown, Trash2 } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────
interface ToiletItem {
  hasil: 'OK' | 'NG';
  keterangan: string;
  foto: string;
  tindakan: string;
  pic: string;
}

interface InspectionRecord {
  id: string;
  inspection_date: string;
  inspection_time: string;
  inspector_name: string;
  inspector_nik?: string;
  overall_status: string;
  toilet_type: string;
  area_name?: string;
  area_code?: string;
  items?: {
    L: Record<number, ToiletItem>;
    P: Record<number, ToiletItem>;
  };
  [key: string]: any;
}

interface EditFormData {
  id: string;
  area_code: string;
  area_name: string;
  inspection_date: string;
  inspection_time: string;
  toilet_type: string;
  inspector_name: string;
  inspector_nik: string;
  items: {
    L: Record<number, ToiletItem>;
    P: Record<number, ToiletItem>;
  };
}

interface InspectionItemDef {
  no: number;
  key: string;
  label: string;
}

// ─── STATIC DATA (13 ITEM) ──────────────────────────────
const INSPECTION_ITEMS: InspectionItemDef[] = [
  { no: 1,  key: "kebersihanLantai",  label: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
  { no: 2,  key: "kebersihanDinding", label: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
  { no: 3,  key: "bauToilet",         label: "Bau tidak menyengat / tidak ada bau tidak sedap" },
  { no: 4,  key: "ketersediaanAir",   label: "Ketersediaan air mencukupi" },
  { no: 5,  key: "klosetBersih",      label: "Kloset bersih, tidak mampet, tidak bocor" },
  { no: 6,  key: "wastafel",          label: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
  { no: 7,  key: "tisuToilet",        label: "Tisu toilet tersedia" },
  { no: 8,  key: "tempatSampah",      label: "Tempat sampah tersedia dan tertutup" },
  { no: 9,  key: "ventilasi",         label: "Ventilasi cukup (tidak pengap)" },
  { no: 10, key: "perlengkapanLain",  label: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
  { no: 11, key: "lampu",             label: "Lampu penerangan berfungsi baik (tidak mati, tidak berkedip, tidak redup)" },
  { no: 12, key: "keran",             label: "Keran air berfungsi baik (tidak bocor, tidak macet, aliran air normal)" },
  { no: 13, key: "exhaustFan",        label: "Exhaust fan berfungsi baik (berputar normal, tidak berbunyi kasar, tidak bergetar berlebihan)" },
];

const TOTAL_ITEMS = INSPECTION_ITEMS.length;

const AREA_NAMES: Record<string, string> = {
  "toilet-driver":      "TOILET - DRIVER",
  "toilet-bea-cukai":   "TOILET - BEA CUKAI",
  "toilet-parkir":      "TOILET - PARKIR",
  "toilet-c2":          "TOILET - C2",
  "toilet-c1":          "TOILET - C1",
  "toilet-d":           "TOILET - D",
  "toilet-auditorium":  "TOILET - AUDITORIUM",
  "toilet-whs":         "TOILET - WHS",
  "toilet-b1":          "TOILET - B1",
  "toilet-b2":          "TOILET - B2",
  "toilet-genba-b":     "TOILET - GENBA B",
  "toilet-a":           "TOILET - A",
  "toilet-lobby":       "TOILET - LOBBY",
  "toilet-office-main": "TOILET - OFFICE MAIN",
};

// ─── AREA TYPE SYSTEM ───────────────────────────────────
type AreaType = 'wanita' | 'general' | 'mixed';

const AREA_TYPES: Record<string, AreaType> = {
  "toilet-driver":      "general",
  "toilet-bea-cukai":   "mixed",
  "toilet-parkir":      "general",
  "toilet-c2":          "wanita",
  "toilet-c1":          "mixed",
  "toilet-d":           "mixed",
  "toilet-auditorium":  "mixed",
  "toilet-whs":         "wanita",
  "toilet-b1":          "mixed",
  "toilet-b2":          "wanita",
  "toilet-genba-b":     "wanita",
  "toilet-a":           "mixed",
  "toilet-lobby":       "mixed",
  "toilet-office-main": "mixed",
};

const getAreaType = (areaId: string): AreaType => AREA_TYPES[areaId] || 'mixed';

const getTypeInfo = (type: AreaType) => {
  switch (type) {
    case 'wanita':  return { label: '🚺 Wanita',  short: 'Wanita',  color: '#e91e63', bg: '#fce4ec', border: '#f48fb1', icon: '🚺' };
    case 'general': return { label: '🚻 General', short: 'General', color: '#0d47a1', bg: '#e3f2fd', border: '#90caf9', icon: '🚻' };
    case 'mixed':   return { label: '🚹🚺 Mixed', short: 'Mixed',   color: '#7b1fa2', bg: '#f3e5f5', border: '#ce93d8', icon: '🚹🚺' };
  }
};

// ─── HELPERS ─────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return dateStr; }
};
const formatDateShort = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dateStr; }
};
const formatDateForInput = (s: string) => { try { return new Date(s).toISOString().split('T')[0]; } catch { return ''; } };
const formatTimeForInput = (s: string) => { try { return s.substring(0, 5); } catch { return ''; } };

const emptyItem = (): ToiletItem => ({ hasil: 'OK', keterangan: '', foto: '', tindakan: '', pic: '' });

// ─── DETAIL MODAL ────────────────────────────────────────
function DetailModal({
  inspection, areaId, onClose, onPreviewImage,
}: {
  inspection: InspectionRecord;
  areaId: string;
  onClose: () => void;
  onPreviewImage: (url: string) => void;
}) {
  const areaType = getAreaType(areaId);
  const typeInfo = getTypeInfo(areaType);
  const isSingleForm = areaType === 'wanita' || areaType === 'general';
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (no: number) => {
    const s = new Set(expandedItems);
    const isExpanding = !s.has(no);
    if (isExpanding) {
      s.add(no);
      setExpandedItems(s);
      // Smooth scroll ke item yang baru dibuka
      setTimeout(() => {
        const el = document.getElementById(`dm-item-${no}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } else {
      s.delete(no);
      setExpandedItems(s);
    }
  };

  const expandAll = () => setExpandedItems(new Set(INSPECTION_ITEMS.map(i => i.no)));
  const collapseAll = () => setExpandedItems(new Set());

  const renderFoto = (foto: string | undefined | null, label: string) => {
    if (!foto || foto.trim() === '' || foto === 'null' || foto === 'undefined') return null;
    return (
      <div className="dm-detail-row dm-foto-row">
        <span className="dm-dl">📷 Foto:</span>
        <div className="dm-foto-container">
          <img
            src={foto} alt={`Foto ${label}`} className="dm-foto"
            onClick={(e) => { e.stopPropagation(); onPreviewImage(foto); }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="dm-foto-hint">Klik untuk memperbesar</span>
        </div>
      </div>
    );
  };

  const renderDetailBlock = (itemData: ToiletItem | undefined, genderLabel: string, genderClass: string) => {
    const hasil = itemData?.hasil || 'OK';
    const ket = itemData?.keterangan?.trim() || '';
    const tindakan = itemData?.tindakan?.trim() || '';
    const foto = itemData?.foto?.trim() || '';
    const pic = itemData?.pic?.trim() || '';
    const hasDetails = ket || tindakan || foto || pic;
    const isNG = hasil === 'NG';

    return (
      <div className={`dm-detail-section ${genderClass}`}>
        <div className="dm-detail-section-title">
          {genderLabel} — <span style={{ color: isNG ? "#b91c1c" : "#166534" }}>{hasil}</span>
        </div>
        <div className="dm-detail-content-scrollable">
          {hasDetails ? (
            <>
              {ket && <div className="dm-detail-row"><span className="dm-dl">📝 Keterangan:</span><span className="dm-detail-text">{ket}</span></div>}
              {tindakan && <div className="dm-detail-row"><span className="dm-dl">🔧 Tindakan:</span><span className="dm-detail-text">{tindakan}</span></div>}
              {pic && <div className="dm-detail-row"><span className="dm-dl">👤 PIC:</span><span className="dm-detail-text">{pic}</span></div>}
              {renderFoto(foto, genderLabel)}
            </>
          ) : (
            <div className="dm-detail-empty"><span>✓ Item dalam kondisi baik</span></div>
          )}
        </div>
      </div>
    );
  };

  const renderItemRow = (item: InspectionItemDef) => {
    const itemL = inspection.items?.L?.[item.no];
    const itemP = inspection.items?.P?.[item.no];
    const isExpanded = expandedItems.has(item.no);

    if (isSingleForm) {
      const hasil = itemP?.hasil || 'OK';
      const isNG = hasil === 'NG';
      return (
        <div id={`dm-item-${item.no}`} key={item.no} className={`dm-item ${isNG ? "dm-item--ng" : "dm-item--ok"}`}>
          <div className="dm-item-header dm-item-header--clickable" onClick={() => toggleExpand(item.no)}>
            <span className="dm-item-no">{item.no}</span>
            <span className="dm-item-label dm-item-label--responsive">{item.label}</span>
            <span className={`dm-badge ${isNG ? "dm-badge--ng" : "dm-badge--ok"}`}>{hasil}</span>
            <span className={`dm-chevron ${isExpanded ? 'dm-chevron--open' : ''}`}>▼</span>
          </div>
          {isExpanded && (
            <div className="dm-item-detail dm-item-detail--expanded">
              {renderDetailBlock(itemP, `${typeInfo.icon} ${typeInfo.short}`, areaType === 'wanita' ? 'dm-detail-section--female' : 'dm-detail-section--general')}
            </div>
          )}
        </div>
      );
    }

    const hasilL = itemL?.hasil || 'OK';
    const hasilP = itemP?.hasil || 'OK';
    const hasNG = hasilL === 'NG' || hasilP === 'NG';
    return (
      <div id={`dm-item-${item.no}`} key={item.no} className={`dm-item ${hasNG ? "dm-item--ng" : "dm-item--ok"}`}>
        <div className="dm-item-header dm-item-header--clickable" onClick={() => toggleExpand(item.no)}>
          <span className="dm-item-no">{item.no}</span>
          <span className="dm-item-label dm-item-label--responsive">{item.label}</span>
          <div className="dm-item-badges">
            <span className={`dm-badge-small ${hasilL === "NG" ? "dm-badge-small--ng" : "dm-badge-small--ok"}`}>L: {hasilL}</span>
            <span className={`dm-badge-small ${hasilP === "NG" ? "dm-badge-small--ng" : "dm-badge-small--ok"}`}>P: {hasilP}</span>
          </div>
          <span className={`dm-chevron ${isExpanded ? 'dm-chevron--open' : ''}`}>▼</span>
        </div>
        {isExpanded && (
          <div className="dm-item-detail dm-item-detail--expanded">
            <div className="dm-gender-detail-sections">
              {renderDetailBlock(itemL, '🚹 Laki-laki', 'dm-detail-section--male')}
              {renderDetailBlock(itemP, '🚺 Perempuan', 'dm-detail-section--female')}
            </div>
          </div>
        )}
      </div>
    );
  };

  const counts = INSPECTION_ITEMS.reduce((acc, item) => {
    if (isSingleForm) {
      const h = inspection.items?.P?.[item.no]?.hasil || 'OK';
      if (h === "OK") acc.ok++; else if (h === "NG") acc.ng++;
    } else {
      const l = inspection.items?.L?.[item.no]?.hasil || 'OK';
      const p = inspection.items?.P?.[item.no]?.hasil || 'OK';
      if (l === "OK") acc.ok++; else if (l === "NG") acc.ng++;
      if (p === "OK") acc.ok++; else if (p === "NG") acc.ng++;
    }
    return acc;
  }, { ok: 0, ng: 0 });

  const total = isSingleForm ? TOTAL_ITEMS : TOTAL_ITEMS * 2;
  const pct = Math.round((counts.ok / (counts.ok + counts.ng || 1)) * 100);

  return (
    <div className="dm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dm-modal dm-modal--responsive">
        {/* ── HEADER (FIXED) ── */}
        <div className="dm-modal-header">
          <div className="dm-modal-title"><Calendar size={20} /><span>Detail Pemeriksaan</span></div>
          <button className="dm-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* ── TYPE BANNER (FIXED) ── */}
        <div className="dm-type-banner" style={{ background: typeInfo.bg, borderBottom: `2px solid ${typeInfo.border}` }}>
          <span className="dm-type-badge" style={{ color: typeInfo.color, border: `2px solid ${typeInfo.border}` }}>
            {typeInfo.label}
          </span>
          <span className="dm-type-area">{AREA_NAMES[areaId] || areaId}</span>
        </div>

        {/* ── INFO BAR (FIXED) ── */}
        <div className="dm-info-bar">
          <div className="dm-info-grid">
            <div className="dm-info-item"><span className="dm-info-label">📅 Tanggal</span><span className="dm-info-val">{formatDate(inspection.inspection_date)}</span></div>
            <div className="dm-info-item"><span className="dm-info-label">⏰ Waktu</span><span className="dm-info-val">{inspection.inspection_time}</span></div>
            <div className="dm-info-item"><span className="dm-info-label">👤 Inspector</span><span className="dm-info-val">{inspection.inspector_name}</span></div>
            {inspection.inspector_nik && <div className="dm-info-item"><span className="dm-info-label">🆔 NIK</span><span className="dm-info-val">{inspection.inspector_nik}</span></div>}
          </div>
        </div>

        {/* ── SCOREBOARD (FIXED) ── */}
        <div className="dm-scoreboard">
          <div className="dm-score dm-score--ok"><CheckCircle size={22} /><span className="dm-score-num">{counts.ok}</span><span className="dm-score-label">OK</span></div>
          <div className="dm-score-divider" />
          <div className="dm-score dm-score--ng"><XCircle size={22} /><span className="dm-score-num">{counts.ng}</span><span className="dm-score-label">NG</span></div>
          <div className="dm-score-divider" />
          <div className="dm-score dm-score--total"><span className="dm-score-num">{counts.ok + counts.ng}</span><span className="dm-score-label">/ {total} Item</span></div>
          <div className="dm-overall">
            <span className={`dm-overall-badge ${inspection.overall_status === "NG" ? "dm-badge--ng" : "dm-badge--ok"}`}>
              {inspection.overall_status === "NG" ? "✗ NG" : "✓ OK"}
            </span>
          </div>
        </div>
        <div className="dm-progress-wrap">
          <div className="dm-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="dm-progress-label">{pct}% item OK</div>

        {/* ── TOOLBAR (STICKY) ── */}
        <div className="dm-toolbar">
          <span className="dm-hint-text">💡 Klik pada item untuk melihat detail</span>
          <div className="dm-toolbar-btns">
            <button className="dm-expand-btn" onClick={expandAll}>▼ Buka Semua</button>
            <button className="dm-expand-btn" onClick={collapseAll}>▲ Tutup Semua</button>
          </div>
        </div>

        {/* ── SCROLLABLE ITEMS ── */}
        <div className="dm-items-wrap">{INSPECTION_ITEMS.map(renderItemRow)}</div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function RiwayatToilet({ params }: { params: Promise<{ area: string }> }) {
  const [areaId, setAreaId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0, hasMore: false });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTab, setEditTab] = useState<'L' | 'P'>('L');

  useEffect(() => {
    (async () => { const p = await params; setAreaId(p.area); })();
  }, [params]);

  const loadHistory = useCallback(async () => {
    if (!areaId) return;
    try {
      setLoading(true);
      const qp = new URLSearchParams({
        area_code: areaId, limit: String(pagination.limit), offset: String(pagination.offset), t: Date.now().toString()
      });
      if (filterDate) qp.append("inspection_date", filterDate);

      const response = await fetch(`/e-checksheet-ga/api/toilet-inspections/history?${qp.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          let rows: InspectionRecord[] = data.data;
          if (filterStatus !== "all") rows = rows.filter(r => r.overall_status?.toLowerCase() === filterStatus.toLowerCase());

          const withItems = rows.map((record: any) => ({
            ...record,
            items: {
              L: Object.fromEntries(
                INSPECTION_ITEMS.map(item => [item.no, {
                  hasil: record[`item_${item.no}_hasil_l`] || 'OK',
                  keterangan: record[`item_${item.no}_keterangan_l`] || '',
                  foto: record[`item_${item.no}_foto_l`] || '',
                  tindakan: record[`item_${item.no}_tindakan_l`] || '',
                  pic: record[`item_${item.no}_pic_l`] || '',
                }])
              ),
              P: Object.fromEntries(
                INSPECTION_ITEMS.map(item => [item.no, {
                  hasil: record[`item_${item.no}_hasil_p`] || 'OK',
                  keterangan: record[`item_${item.no}_keterangan_p`] || '',
                  foto: record[`item_${item.no}_foto_p`] || '',
                  tindakan: record[`item_${item.no}_tindakan_p`] || '',
                  pic: record[`item_${item.no}_pic_p`] || '',
                }])
              ),
            }
          }));
          setInspections(withItems);
          if (data.pagination) setPagination(p => ({ ...p, ...data.pagination }));
        } else setInspections([]);
      }
    } catch (err) { console.error("Gagal memuat riwayat:", err); }
    finally { setLoading(false); }
  }, [areaId, pagination.limit, pagination.offset, filterDate, filterStatus]);

  useEffect(() => { if (user && areaId) loadHistory(); }, [user, areaId, loadHistory]);
  useEffect(() => {
    if (selectedInspection && inspections.length > 0) {
      const u = inspections.find(r => r.id === selectedInspection.id);
      if (u) setSelectedInspection(u);
    }
  }, [inspections]);

  const areaName = areaId ? (AREA_NAMES[areaId] || decodeURIComponent(areaId)) : "";
  const areaType = areaId ? getAreaType(areaId) : 'mixed';
  const typeInfo = getTypeInfo(areaType);
  const isSingleForm = areaType === 'wanita' || areaType === 'general';

  const openEditModal = (record: InspectionRecord) => {
    if (!record.id) { alert('❌ Error: Data tidak valid.'); return; }
    const defaultItems = {
      L: Object.fromEntries(INSPECTION_ITEMS.map(i => [i.no, emptyItem()])),
      P: Object.fromEntries(INSPECTION_ITEMS.map(i => [i.no, emptyItem()])),
    };
    setEditData({
      id: record.id,
      area_code: record.area_code || areaId || '',
      area_name: record.area_name || '',
      inspection_date: formatDateForInput(record.inspection_date),
      inspection_time: formatTimeForInput(record.inspection_time),
      toilet_type: record.toilet_type,
      inspector_name: record.inspector_name,
      inspector_nik: record.inspector_nik || '',
      items: record.items || defaultItems,
    });
    setIsEditMode(true);
    setEditTab(isSingleForm ? 'P' : 'L');
  };

  const closeEditModal = () => { setIsEditMode(false); setEditData(null); };
  const handleHeaderChange = (field: keyof EditFormData, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };
  const handleItemChange = (type: 'L' | 'P', itemNo: number, field: keyof ToiletItem, value: string) => {
    if (!editData) return;
    const updated = { ...editData.items };
    updated[type] = { ...updated[type], [itemNo]: { ...updated[type][itemNo], [field]: value } };
    setEditData(prev => prev ? { ...prev, items: updated } : null);
  };
  const handleFotoUpload = (type: 'L' | 'P', itemNo: number, file: File) => {
    if (!editData) return;
    if (file.size > 2 * 1024 * 1024) { alert("Ukuran gambar maksimal 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...editData.items };
      updated[type] = { ...updated[type], [itemNo]: { ...updated[type][itemNo], foto: reader.result as string } };
      setEditData(prev => prev ? { ...prev, items: updated } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEdit = async () => {
    if (!editData || !editData.inspection_date || !editData.inspector_name) {
      alert('Harap lengkapi field: Tanggal dan Inspector'); return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/e-checksheet-ga/api/toilet-inspections/edit', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
      });
      const result = await response.json();
      if (result.success) { alert('✅ Data berhasil diupdate!'); closeEditModal(); await loadHistory(); }
      else alert('❌ Gagal update: ' + result.message);
    } catch { alert('Terjadi kesalahan saat menyimpan perubahan'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data riwayat ini?")) return;
    try {
      const response = await fetch(`/e-checksheet-ga/api/toilet-inspections/delete`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Data berhasil dihapus!');
        if (selectedInspection?.id === id) setSelectedInspection(null);
        await loadHistory();
      } else alert('❌ Gagal menghapus: ' + result.message);
    } catch { alert('Terjadi kesalahan saat menghapus data'); }
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const handleExportCSV = () => {
    if (!inspections.length) { alert("Tidak ada data untuk diexport"); return; }
    const headers = ["Tanggal", "Waktu", "Inspector", "Tipe", "Status"];
    const rows = inspections.map(r => [
      formatDateShort(r.inspection_date), r.inspection_time, r.inspector_name,
      getTypeInfo(getAreaType(areaId || '')).short, r.overall_status
    ]);
    let csv = headers.join(",") + "\n";
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(",") + "\n"; });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `riwayat-${areaId}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!user || !areaId) return null;
  if (loading) return (
    <div className="rv-page"><Sidebar userName={user.fullName} />
      <div className="rv-content"><div className="rv-loading"><div className="rv-spinner" /><p>Memuat data...</p></div></div>
    </div>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --rv-blue: #1565c0; --rv-blue-light: #1e88e5; --rv-blue-pale: #e3f2fd;
          --rv-green: #166534; --rv-green-pale: #dcfce7; --rv-red: #b91c1c; --rv-red-pale: #fee2e2;
          --rv-gray: #64748b; --rv-border: #e2e8f0; --rv-shadow: 0 2px 8px rgba(0,0,0,0.07);
          --rv-radius: 12px; --rv-sidebar: 75px;
        }
        .rv-page { display: flex; min-height: 100vh; background: #f7f9fc; }
        .rv-content { flex: 1; margin-left: var(--rv-sidebar); padding: 24px 20px 48px; max-width: 1400px; }
        .rv-header { background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); color: #fff; padding: 16px 20px; border-radius: var(--rv-radius); margin-bottom: 20px; box-shadow: 0 4px 12px rgba(21,101,192,0.25); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .rv-btn-back { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.2); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: background 0.2s; min-height: 40px; flex-shrink: 0; white-space: nowrap; }
        .rv-btn-back:hover { background: rgba(255,255,255,0.3); }
        .rv-header-title { display: flex; align-items: center; gap: 10px; font-size: clamp(16px, 4vw, 22px); font-weight: 700; flex: 1; }
        .rv-header-type { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 2px solid; }
        .rv-filters { background: #fff; border: 1px solid var(--rv-border); border-radius: var(--rv-radius); padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; box-shadow: var(--rv-shadow); }
        .rv-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .rv-filter-group label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
        .rv-filter-input, .rv-filter-select { padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 7px; font-size: 14px; color: #1e293b; background: #fff; transition: border-color 0.2s; min-height: 40px; }
        .rv-filter-input { width: 170px; }
        .rv-filter-select { min-width: 120px; }
        .rv-filter-input:focus, .rv-filter-select:focus { outline: none; border-color: var(--rv-blue-light); box-shadow: 0 0 0 3px rgba(30,136,229,0.1); }
        .rv-btn-export { display: flex; align-items: center; gap: 7px; padding: 9px 18px; background: #10b981; color: #fff; border: none; border-radius: 7px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; min-height: 40px; margin-left: auto; white-space: nowrap; }
        .rv-btn-export:hover { background: #059669; transform: translateY(-1px); }
        .rv-stats { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .rv-stat { flex: 1; min-width: 100px; background: #fff; border: 1px solid var(--rv-border); border-radius: 8px; padding: 10px 14px; text-align: center; box-shadow: var(--rv-shadow); }
        .rv-stat-num { font-size: 22px; font-weight: 700; color: #1e293b; display: block; }
        .rv-stat-label { font-size: 11px; color: var(--rv-gray); text-transform: uppercase; letter-spacing: 0.4px; }
        .rv-stat--ok .rv-stat-num { color: var(--rv-green); }
        .rv-stat--ng .rv-stat-num { color: var(--rv-red); }
        .rv-loading, .rv-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; background: #fff; border: 1px solid var(--rv-border); border-radius: var(--rv-radius); color: var(--rv-gray); gap: 12px; }
        .rv-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: var(--rv-blue); border-radius: 50%; animation: rv-spin 0.8s linear infinite; }
        @keyframes rv-spin { to { transform: rotate(360deg); } }
        .rv-desktop { display: block; }
        .rv-mobile { display: none; }
        .rv-table-wrap { background: #fff; border: 1px solid var(--rv-border); border-radius: var(--rv-radius); overflow: hidden; box-shadow: var(--rv-shadow); overflow-x: auto; }
        .rv-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 600px; }
        .rv-table thead th { background: #f1f5f9; padding: 13px 14px; text-align: left; font-weight: 700; color: #1e293b; border-bottom: 2px solid #cbd5e1; white-space: nowrap; }
        .rv-table tbody td { padding: 12px 14px; border-bottom: 1px solid #f0f4f8; color: #334155; vertical-align: middle; }
        .rv-table tbody tr:last-child td { border-bottom: none; }
        .rv-table tbody tr:hover { background: #f8fafc; }
        .rv-no-col { text-align: center; width: 48px; color: #94a3b8; font-weight: 600; }
        .rv-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; white-space: nowrap; }
        .rv-badge--ok { background: var(--rv-green-pale); color: var(--rv-green); }
        .rv-badge--ng { background: var(--rv-red-pale); color: var(--rv-red); }
        .rv-btn-detail, .rv-btn-edit, .rv-btn-delete { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 14px; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; min-height: 34px; white-space: nowrap; }
        .rv-btn-detail { background: #3b82f6; color: #fff; }
        .rv-btn-detail:hover { background: #2563eb; transform: translateY(-1px); }
        .rv-btn-edit { background: none; color: #1976d2; font-size: 1.2rem; min-width: 44px; min-height: 44px; }
        .rv-btn-edit:hover { transform: scale(1.1); background: rgba(25,118,210,0.1); }
        .rv-btn-delete { background: none; color: #dc2626; min-width: 44px; min-height: 44px; }
        .rv-btn-delete:hover { background: rgba(220,38,38,0.1); transform: scale(1.1); }
        .rv-card { background: #fff; border: 1.5px solid var(--rv-border); border-radius: var(--rv-radius); margin-bottom: 10px; overflow: hidden; box-shadow: var(--rv-shadow); }
        .rv-card-header { display: flex; align-items: center; gap: 10px; padding: 13px 14px; cursor: pointer; background: #f8fafc; min-height: 52px; }
        .rv-card-header:hover { background: #f1f5f9; }
        .rv-card-no { width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rv-card-date { flex: 1; font-weight: 600; color: #1e293b; font-size: 14px; }
        .rv-card-meta { font-size: 11px; color: var(--rv-gray); display: block; font-weight: 400; margin-top: 2px; }
        .rv-card-chevron { color: var(--rv-gray); transition: transform 0.25s; flex-shrink: 0; }
        .rv-card-chevron.open { transform: rotate(180deg); }
        .rv-card-body { padding: 14px 16px; border-top: 1px solid var(--rv-border); background: #fafbfc; display: flex; flex-direction: column; gap: 8px; }
        .rv-card-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; gap: 8px; }
        .rv-card-row-label { color: var(--rv-gray); font-weight: 500; min-width: 80px; }
        .rv-card-row-val { color: #1e293b; text-align: right; flex: 1; }
        .rv-btn-detail-mobile { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; margin-top: 6px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; min-height: 48px; }
        .rv-btn-detail-mobile:hover { opacity: 0.9; }
        .rv-pagination { display: flex; justify-content: center; margin-top: 20px; }
        .rv-btn-more { padding: 12px 28px; background: #64748b; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; min-height: 44px; min-width: 160px; }
        .rv-btn-more:hover:not(:disabled) { background: #475569; }
        .rv-btn-more:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ═══════════════════════════════════════════════════════
           DETAIL MODAL - SCROLLABLE LAYOUT
           ═══════════════════════════════════════════════════════ */
        .dm-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.55);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          backdrop-filter: blur(2px);
        }

        /* Modal utama - FLEX COLUMN dengan max-height */
        .dm-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 860px;
          max-height: 92vh;
          margin: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: dm-slide-in 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .dm-modal--responsive {
          max-height: 92vh !important;
          display: flex;
          flex-direction: column;
        }

        @keyframes dm-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── HEADER SECTION (FIXED - tidak scroll) ── */
        .dm-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: linear-gradient(135deg, #1565c0, #1e88e5);
          color: #fff;
          flex-shrink: 0;
        }
        .dm-modal-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
        .dm-close {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.2);
          border: none; border-radius: 50%;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .dm-close:hover { background: rgba(255,255,255,0.35); }

        /* ── TYPE BANNER (FIXED) ── */
        .dm-type-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 20px;
          flex-shrink: 0;
        }
        .dm-type-badge {
          padding: 4px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
        }
        .dm-type-area { font-size: 13px; font-weight: 600; color: #334155; }

        /* ── INFO BAR (FIXED) ── */
        .dm-info-bar {
          background: #f8fafc;
          border-bottom: 1px solid var(--rv-border);
          padding: 12px 20px;
          flex-shrink: 0;
        }
        .dm-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px 16px;
        }
        .dm-info-item { display: flex; flex-direction: column; gap: 2px; }
        .dm-info-label { font-size: 11px; color: var(--rv-gray); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .dm-info-val { font-size: 13px; font-weight: 600; color: #1e293b; }

        /* ── SCOREBOARD (FIXED) ── */
        .dm-scoreboard {
          display: flex; align-items: center;
          padding: 12px 20px;
          background: #fff;
          border-bottom: 1px solid var(--rv-border);
          flex-shrink: 0;
        }
        .dm-score { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 16px; flex: 1; }
        .dm-score-num { font-size: 26px; font-weight: 800; line-height: 1; }
        .dm-score-label { font-size: 11px; font-weight: 600; color: var(--rv-gray); text-transform: uppercase; }
        .dm-score--ok { color: var(--rv-green); }
        .dm-score--ng { color: var(--rv-red); }
        .dm-score--total { color: #334155; }
        .dm-score-divider { width: 1px; height: 44px; background: var(--rv-border); }
        .dm-overall { padding: 0 16px; }
        .dm-overall-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 16px; border-radius: 20px;
          font-weight: 800; font-size: 14px;
        }
        .dm-badge--ok { background: var(--rv-green-pale); color: var(--rv-green); }
        .dm-badge--ng { background: var(--rv-red-pale); color: var(--rv-red); }

        /* ── PROGRESS (FIXED) ── */
        .dm-progress-wrap {
          height: 6px; background: #fee2e2;
          margin: 0 20px 4px;
          border-radius: 3px; overflow: hidden;
          flex-shrink: 0;
        }
        .dm-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        .dm-progress-label {
          padding: 0 20px 10px;
          font-size: 11px; color: var(--rv-gray);
          text-align: right;
          flex-shrink: 0;
        }

        /* ── TOOLBAR (STICKY di atas items) ── */
        .dm-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap; gap: 8px;
          flex-shrink: 0;
        }
        .dm-hint-text { font-size: 12px; color: #64748b; }
        .dm-toolbar-btns { display: flex; gap: 6px; }
        .dm-expand-btn {
          padding: 4px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: white;
          font-size: 11px; font-weight: 600;
          color: #475569; cursor: pointer;
          transition: all 0.2s;
        }
        .dm-expand-btn:hover { background: #e2e8f0; }

        /* ═══════════════════════════════════════════════════════
           SCROLLABLE ITEMS AREA - AREA UTAMA YANG SCROLL
           ═══════════════════════════════════════════════════════ */
        .dm-items-wrap {
          flex: 1 1 auto;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 12px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scroll-behavior: smooth;
          min-height: 0; /* Penting untuk flex scroll */
        }

        /* Custom scrollbar - items */
        .dm-items-wrap::-webkit-scrollbar { width: 10px; }
        .dm-items-wrap::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }
        .dm-items-wrap::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #94a3b8, #64748b);
          border-radius: 5px;
          border: 2px solid #f1f5f9;
        }
        .dm-items-wrap::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* ── ITEM CARD ── */
        .dm-item {
          border-radius: 8px;
          overflow: hidden;
          border: 1.5px solid;
          flex-shrink: 0;
        }
        .dm-item--ok { border-color: #bbf7d0; background: #f0fdf4; }
        .dm-item--ng { border-color: #fecaca; background: #fff5f5; }

        .dm-item-header {
          display: flex; align-items: flex-start;
          gap: 8px; padding: 10px 12px;
        }
        .dm-item-header--clickable {
          cursor: pointer; user-select: none;
          transition: background 0.15s;
        }
        .dm-item-header--clickable:hover { background: rgba(0,0,0,0.04); }

        .dm-item-no {
          width: 24px; height: 24px; min-width: 24px;
          border-radius: 50%;
          background: #e2e8f0; color: #475569;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dm-item-label {
          flex: 1;
          font-size: 12.5px; font-weight: 500;
          color: #334155; line-height: 1.4;
        }
        .dm-item-label--responsive {
          font-size: clamp(11px, 2vw, 13px);
          line-height: 1.4;
        }

        .dm-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0; align-self: flex-start;
        }
        .dm-badge-small {
          padding: 2px 8px; border-radius: 10px;
          font-size: 10px; font-weight: 700;
          white-space: nowrap;
        }
        .dm-badge-small--ok { background: #dcfce7; color: #166534; }
        .dm-badge-small--ng { background: #fee2e2; color: #b91c1c; }
        .dm-item-badges { display: flex; gap: 6px; margin-right: 8px; flex-shrink: 0; }

        .dm-chevron {
          font-size: 10px; color: #64748b;
          transition: transform 0.3s ease;
          margin-left: auto; flex-shrink: 0;
        }
        .dm-chevron--open { transform: rotate(180deg); }

        /* ── EXPANDED DETAIL ── */
        .dm-item-detail--expanded {
          padding: 12px;
          background: rgba(255,255,255,0.7);
          border-top: 1px solid rgba(0,0,0,0.08);
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dm-gender-detail-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        /* ── DETAIL SECTION (dengan scroll internal) ── */
        .dm-detail-section {
          background: white;
          border-radius: 8px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .dm-detail-section--male { border-left: 3px solid #1565c0; }
        .dm-detail-section--female { border-left: 3px solid #ad1457; }
        .dm-detail-section--general { border-left: 3px solid #0d47a1; }

        .dm-detail-section-title {
          font-weight: 700; font-size: 12px;
          margin-bottom: 8px; padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }

        /* Scrollable content dalam detail */
        .dm-detail-content-scrollable {
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 6px;
        }
        .dm-detail-content-scrollable::-webkit-scrollbar { width: 5px; }
        .dm-detail-content-scrollable::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .dm-detail-content-scrollable::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .dm-detail-content-scrollable::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .dm-detail-empty {
          color: #94a3b8; font-style: italic;
          font-size: 12px; text-align: center;
          padding: 8px;
        }

        .dm-detail-row {
          display: flex; gap: 6px;
          font-size: 11px; color: #475569;
          flex-wrap: wrap; align-items: flex-start;
          margin-bottom: 4px;
        }
        .dm-detail-row:last-child { margin-bottom: 0; }

        .dm-dl {
          font-weight: 600; color: #64748b;
          min-width: 80px; flex-shrink: 0;
          font-size: 10px;
        }
        .dm-detail-text {
          flex: 1; color: #1e293b;
          font-size: 11px; line-height: 1.4;
          word-break: break-word;
        }

        /* ── FOTO ── */
        .dm-foto-row { flex-direction: column; gap: 4px; }
        .dm-foto-container { display: flex; flex-direction: column; gap: 4px; }
        .dm-foto {
          max-width: 100px; max-height: 100px;
          width: 100px; height: 100px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          cursor: zoom-in;
          transition: transform 0.2s;
        }
        .dm-foto:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .dm-foto-hint { font-size: 10px; color: #64748b; font-style: italic; }

        /* ═══════════════════════════════════════════════════════
           EDIT MODAL
           ═══════════════════════════════════════════════════════ */
        .em-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.55);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          backdrop-filter: blur(2px);
        }
        .em-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%; max-width: 800px;
          max-height: 92vh;
          margin: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: dm-slide-in 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .em-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1565c0, #1e88e5);
          color: #fff;
          flex-shrink: 0;
        }
        .em-modal-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
        .em-close {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.2);
          border: none; border-radius: 50%;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .em-close:hover { background: rgba(255,255,255,0.35); }
        .em-type-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 20px;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .em-type-badge { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .em-tabs {
          display: flex;
          padding: 8px 16px;
          background: #f8fafc;
          border-bottom: 1px solid var(--rv-border);
          gap: 4px;
          flex-shrink: 0;
        }
        .em-tab-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-weight: 600; color: #64748b;
          cursor: pointer; font-size: 0.95rem;
        }
        .em-tab-btn.active { background: #1976d2; color: white; }
        .em-tab-btn:hover:not(.active) { background: #e2e8f0; }

        /* Body scrollable */
        .em-modal-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        .em-modal-body::-webkit-scrollbar { width: 8px; }
        .em-modal-body::-webkit-scrollbar-track { background: #f1f5f9; }
        .em-modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .em-modal-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .em-form-section { display: flex; flex-direction: column; gap: 20px; }
        .em-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .em-form-group { display: flex; flex-direction: column; gap: 6px; }
        .em-form-group label { font-weight: 600; font-size: 0.9rem; color: #334155; }
        .em-form-input {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          min-height: 44px;
        }
        .em-form-input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25,118,210,0.1);
        }
        .em-items-list { display: flex; flex-direction: column; gap: 12px; }
        .em-item-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          background: #fafbfc;
        }
        .em-item-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px; padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .em-item-no {
          background: #1976d2; color: white;
          padding: 4px 12px; border-radius: 20px;
          font-weight: 700; font-size: 0.8rem;
        }
        .em-item-label { font-weight: 600; color: #1e293b; flex: 1; font-size: 0.9rem; }
        .em-item-fields { display: flex; flex-direction: column; gap: 12px; }
        .em-status-group { display: flex; gap: 16px; }
        .em-radio-label {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; min-height: 44px;
          padding: 8px 12px; border-radius: 8px;
          background: white;
          border: 1.5px solid #e0e0e0;
          transition: all 0.2s;
        }
        .em-radio-label:hover { border-color: #1e88e5; }
        .em-radio-input { width: 20px; height: 20px; accent-color: #1e88e5; }
        .em-radio-text.ok { color: #2e7d32; font-weight: 600; }
        .em-radio-text.ng { color: #c62828; font-weight: 600; }
        .em-form-group-small { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .em-form-group-small.full { flex: 1 1 100%; }
        .em-form-group-small label { font-size: 0.8rem; font-weight: 500; color: #64748b; }
        .em-form-textarea-small {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          resize: vertical;
          font-family: inherit;
        }
        .em-form-file-small { font-size: 0.85rem; }
        .em-foto-preview {
          width: 60px; height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          cursor: zoom-in;
          margin-top: 4px;
        }
        .em-modal-footer {
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex; justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .em-btn-cancel, .em-btn-save {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600; font-size: 0.95rem;
          cursor: pointer;
          min-height: 44px; min-width: 100px;
        }
        .em-btn-cancel { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
        .em-btn-save { background: #1976d2; color: white; border: none; }
        .em-btn-cancel:disabled, .em-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─── IMAGE PREVIEW ─── */
        .preview-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 3000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; cursor: zoom-out;
        }
        .preview-image {
          max-width: 90vw; max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
        }
        .preview-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.2);
          border: none; border-radius: 50%;
          color: white; width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }

        /* ═══════════════════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════════════════ */
        @media (max-width: 1024px) {
          .rv-content { margin-left: 80px; padding: 18px 14px 40px; }
        }

        @media (max-width: 768px) {
          .rv-content { margin-left: 0; padding: 12px 10px 60px; }
          .rv-header { padding: 12px 14px; }
          .rv-btn-back-text { display: none; }
          .rv-filters { flex-direction: column; align-items: stretch; gap: 10px; }
          .rv-filter-group { width: 100%; }
          .rv-filter-input, .rv-filter-select { width: 100%; }
          .rv-btn-export { width: 100%; justify-content: center; margin-left: 0; }
          .rv-desktop { display: none; }
          .rv-mobile { display: block; }

          /* Detail modal full screen di mobile */
          .dm-overlay { padding: 0; }
          .dm-modal, .dm-modal--responsive {
            max-height: 100vh !important;
            height: 100vh !important;
            border-radius: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }

          .dm-modal-header { padding: 12px 16px; }
          .dm-type-banner { padding: 8px 16px; }
          .dm-info-bar { padding: 10px 16px; }
          .dm-scoreboard { padding: 10px 12px; flex-wrap: wrap; }
          .dm-score { padding: 0 8px; }
          .dm-score-num { font-size: 20px; }
          .dm-overall { padding: 0 8px; }
          .dm-progress-wrap { margin: 0 16px 4px; }
          .dm-progress-label { padding: 0 16px 8px; }
          .dm-toolbar { padding: 8px 16px; }
          .dm-items-wrap { padding: 10px 12px 16px; }

          .dm-gender-detail-sections { grid-template-columns: 1fr; gap: 8px; }
          .dm-detail-content-scrollable { max-height: 140px; }
          .dm-foto { width: 80px; height: 80px; max-width: 80px; max-height: 80px; }

          /* Edit modal */
          .em-overlay { padding: 0; }
          .em-modal {
            max-height: 100vh; height: 100vh;
            border-radius: 0;
            max-width: 100vw;
          }
          .em-form-grid { grid-template-columns: 1fr; }
          .em-modal-footer { flex-direction: column-reverse; }
          .em-btn-cancel, .em-btn-save { width: 100%; }
        }

        @media (max-width: 480px) {
          .dm-item-header { padding: 8px 10px; gap: 6px; }
          .dm-item-no { width: 22px; height: 22px; min-width: 22px; font-size: 10px; }
          .dm-item-label--responsive { font-size: 11px; }
          .dm-detail-section { padding: 8px; }
          .dm-detail-content-scrollable { max-height: 120px; }
          .dm-dl { min-width: 70px; font-size: 9px; }
          .dm-detail-text { font-size: 10px; }
          .dm-info-grid { grid-template-columns: 1fr 1fr; }
          .em-status-group { flex-direction: column; gap: 8px; }
        }

        @media (max-width: 768px) and (orientation: landscape) {
          .dm-items-wrap { max-height: calc(100vh - 280px) !important; }
          .dm-detail-content-scrollable { max-height: 80px; }
        }
      `}</style>

      <div className="rv-page">
        <Sidebar userName={user.fullName} />
        <div className="rv-content">
          <div className="rv-header">
            <button className="rv-btn-back" onClick={() => router.push("/status-ga/checksheet-toilet")}>
              <ArrowLeft size={16} /><span className="rv-btn-back-text">Kembali</span>
            </button>
            <div className="rv-header-title">
              <Calendar size={22} /><span>Riwayat {areaName}</span>
            </div>
            <span className="rv-header-type" style={{ color: typeInfo.color, background: typeInfo.bg, borderColor: typeInfo.border }}>
              {typeInfo.label}
            </span>
          </div>

          <div className="rv-filters">
            <div className="rv-filter-group">
              <label>Tanggal</label>
              <input type="date" className="rv-filter-input" value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPagination(p => ({ ...p, offset: 0 })); }} />
            </div>
            <div className="rv-filter-group">
              <label>Status</label>
              <select className="rv-filter-select" value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, offset: 0 })); }}>
                <option value="all">Semua</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
              </select>
            </div>
            <button className="rv-btn-export" onClick={handleExportCSV}>
              <Download size={15} /><span>Export CSV</span>
            </button>
          </div>

          {!loading && inspections.length > 0 && (
            <div className="rv-stats">
              <div className="rv-stat"><span className="rv-stat-num">{inspections.length}</span><span className="rv-stat-label">Total Data</span></div>
              <div className="rv-stat rv-stat--ok"><span className="rv-stat-num">{inspections.filter(r => r.overall_status === "OK").length}</span><span className="rv-stat-label">Total OK</span></div>
              <div className="rv-stat rv-stat--ng"><span className="rv-stat-num">{inspections.filter(r => r.overall_status === "NG").length}</span><span className="rv-stat-label">Total NG</span></div>
              <div className="rv-stat">
                <span className="rv-stat-num">{inspections.length > 0 ? Math.round((inspections.filter(r => r.overall_status === "OK").length / inspections.length) * 100) : 0}%</span>
                <span className="rv-stat-label">% OK</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="rv-loading"><div className="rv-spinner" /><p>Memuat data...</p></div>
          ) : inspections.length === 0 ? (
            <div className="rv-empty"><p>{filterDate || filterStatus !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada data riwayat"}</p></div>
          ) : (
            <>
              <div className="rv-desktop">
                <div className="rv-table-wrap">
                  <table className="rv-table">
                    <thead>
                      <tr>
                        <th className="rv-no-col">No</th>
                        <th>Tanggal</th>
                        <th>Waktu</th>
                        <th>Inspector</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="rv-no-col">{idx + 1}</td>
                          <td>{formatDateShort(r.inspection_date)}</td>
                          <td>{r.inspection_time}</td>
                          <td>{r.inspector_name}</td>
                          <td><span className={`rv-badge ${r.overall_status === "NG" ? "rv-badge--ng" : "rv-badge--ok"}`}>{r.overall_status === "NG" ? "✗" : "✓"} {r.overall_status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="rv-btn-detail" onClick={() => setSelectedInspection(r)}><Eye size={13} /> Detail</button>
                              <button className="rv-btn-edit" onClick={() => openEditModal(r)} title="Edit">✏️</button>
                              <button className="rv-btn-delete" onClick={() => handleDelete(r.id)} title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rv-mobile">
                {inspections.map((r, idx) => {
                  const isOpen = expandedId === r.id;
                  return (
                    <div key={r.id} className="rv-card">
                      <div className="rv-card-header" onClick={() => toggleExpand(r.id)}>
                        <div className="rv-card-no">{idx + 1}</div>
                        <div className="rv-card-date">
                          {formatDateShort(r.inspection_date)}
                          <span className="rv-card-meta">{r.inspection_time} · {r.inspector_name}</span>
                        </div>
                        <span className={`rv-badge ${r.overall_status === "NG" ? "rv-badge--ng" : "rv-badge--ok"}`}>
                          {r.overall_status === "NG" ? "✗" : "✓"} {r.overall_status}
                        </span>
                        <span className={`rv-card-chevron ${isOpen ? "open" : ""}`}><ChevronDown size={18} /></span>
                      </div>
                      {isOpen && (
                        <div className="rv-card-body">
                          <div className="rv-card-row"><span className="rv-card-row-label">Waktu</span><span className="rv-card-row-val">⏰ {r.inspection_time}</span></div>
                          <div className="rv-card-row"><span className="rv-card-row-label">Inspector</span><span className="rv-card-row-val">👤 {r.inspector_name}</span></div>
                          <button className="rv-btn-detail-mobile" onClick={() => setSelectedInspection(r)}><Eye size={16} /> Lihat Detail</button>
                          <button className="rv-btn-detail-mobile" style={{ background: '#dbeafe', color: '#1976d2' }} onClick={() => openEditModal(r)}>✏️ Edit Data</button>
                          <button className="rv-btn-detail-mobile" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDelete(r.id)}><Trash2 size={16} /> Hapus</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {pagination.hasMore && (
                <div className="rv-pagination">
                  <button className="rv-btn-more" onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))} disabled={loading}>
                    {loading ? "Memuat..." : "Muat Lebih Banyak"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── DETAIL MODAL ─── */}
      {selectedInspection && (
        <DetailModal inspection={selectedInspection} areaId={areaId!} onClose={() => setSelectedInspection(null)} onPreviewImage={setPreviewImage} />
      )}

      {/* ─── EDIT MODAL ─── */}
      {isEditMode && editData && (
        <div className="em-overlay" onClick={closeEditModal}>
          <div className="em-modal" onClick={(e) => e.stopPropagation()}>
            <div className="em-modal-header">
              <div className="em-modal-title"><Calendar size={20} /><span>Edit Inspeksi Toilet</span></div>
              <button className="em-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="em-type-banner" style={{ background: typeInfo.bg }}>
              <span className="em-type-badge" style={{ color: typeInfo.color, border: `2px solid ${typeInfo.border}` }}>
                {typeInfo.label}
              </span>
              <span style={{ fontSize: 13, color: '#475569' }}>{AREA_NAMES[areaId || ''] || areaId}</span>
            </div>

            {!isSingleForm && (
              <div className="em-tabs">
                <button className={`em-tab-btn ${editTab === 'L' ? 'active' : ''}`} onClick={() => setEditTab('L')}>🚹 Laki-laki</button>
                <button className={`em-tab-btn ${editTab === 'P' ? 'active' : ''}`} onClick={() => setEditTab('P')}>🚺 Perempuan</button>
              </div>
            )}

            <div className="em-modal-body">
              <div className="em-form-section">
                <div className="em-form-grid">
                  <div className="em-form-group">
                    <label>Tanggal *</label>
                    <input type="date" value={editData.inspection_date} onChange={(e) => handleHeaderChange('inspection_date', e.target.value)} className="em-form-input" />
                  </div>
                  <div className="em-form-group">
                    <label>Waktu *</label>
                    <input type="time" value={editData.inspection_time} onChange={(e) => handleHeaderChange('inspection_time', e.target.value)} className="em-form-input" />
                  </div>
                  <div className="em-form-group">
                    <label>Inspector *</label>
                    <input type="text" value={editData.inspector_name} onChange={(e) => handleHeaderChange('inspector_name', e.target.value)} className="em-form-input" />
                  </div>
                  <div className="em-form-group">
                    <label>NIK</label>
                    <input type="text" value={editData.inspector_nik} onChange={(e) => handleHeaderChange('inspector_nik', e.target.value)} className="em-form-input" />
                  </div>
                </div>

                <div className="em-items-list">
                  {INSPECTION_ITEMS.map((item) => {
                    const itemData = editData.items[isSingleForm ? 'P' : editTab][item.no];
                    return (
                      <div key={item.no} className="em-item-card">
                        <div className="em-item-header">
                          <span className="em-item-no">{item.no}</span>
                          <span className="em-item-label">{item.label}</span>
                        </div>
                        <div className="em-item-fields">
                          <div className="em-status-group">
                            <label className="em-radio-label">
                              <input type="radio" name={`hasil-${editTab}-${item.no}`} checked={itemData.hasil === 'OK'}
                                onChange={() => handleItemChange(isSingleForm ? 'P' : editTab, item.no, 'hasil', 'OK')} className="em-radio-input" />
                              <span className="em-radio-text ok">✅ OK</span>
                            </label>
                            <label className="em-radio-label">
                              <input type="radio" name={`hasil-${editTab}-${item.no}`} checked={itemData.hasil === 'NG'}
                                onChange={() => handleItemChange(isSingleForm ? 'P' : editTab, item.no, 'hasil', 'NG')} className="em-radio-input" />
                              <span className="em-radio-text ng">❌ NG</span>
                            </label>
                          </div>
                          {itemData.hasil === 'NG' && (
                            <>
                              <div className="em-form-group-small full">
                                <label>Keterangan *</label>
                                <textarea value={itemData.keterangan}
                                  onChange={(e) => handleItemChange(isSingleForm ? 'P' : editTab, item.no, 'keterangan', e.target.value)}
                                  className="em-form-textarea-small" rows={2} placeholder="Jelaskan kondisi NG..." />
                              </div>
                              <div className="em-form-group-small full">
                                <label>Tindakan Perbaikan</label>
                                <textarea value={itemData.tindakan}
                                  onChange={(e) => handleItemChange(isSingleForm ? 'P' : editTab, item.no, 'tindakan', e.target.value)}
                                  className="em-form-textarea-small" rows={2} placeholder="Tindakan yang dilakukan..." />
                              </div>
                            </>
                          )}
                          <div className="em-form-group-small">
                            <label>Foto</label>
                            <input type="file" accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleFotoUpload(isSingleForm ? 'P' : editTab, item.no, e.target.files[0])}
                              className="em-form-file-small" />
                            {itemData.foto && (
                              <img src={itemData.foto} alt="Preview" className="em-foto-preview" onClick={() => setPreviewImage(itemData.foto)} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="em-modal-footer">
              <button type="button" onClick={closeEditModal} className="em-btn-cancel" disabled={isSubmitting}>Batal</button>
              <button type="button" onClick={handleSubmitEdit} className="em-btn-save" disabled={isSubmitting}>
                {isSubmitting ? '💾 Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMAGE PREVIEW ─── */}
      {previewImage && (
        <div className="preview-overlay" onClick={() => setPreviewImage(null)}>
          <button className="preview-close" onClick={() => setPreviewImage(null)}><X size={24} /></button>
          <img src={previewImage} alt="Preview" className="preview-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}