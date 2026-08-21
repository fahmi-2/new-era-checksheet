// app/status-ga/checksheet-toilet/[area]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import * as React from "react";
import { QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

// ✅ TAMBAHKAN IMPORT UNTUK OFFLINE MODE
import { smartFetch } from '@/lib/smart-fetch';
import { useConnection } from '@/lib/connection-context';

// ─── TYPES ──────────────────────────────────────────────
interface ChecksheetEntry {
  date: string;
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  fotoTemuan?: string;
  tindakanPerbaikan: string;
  pic: string;
  verify: string;
  inspector: string;
}

interface SavedData {
  [itemKey: string]: ChecksheetEntry[];
}

type FormType = "wanita" | "general" | "mixed";

// ─── STATIC DATA ─────────────────────────────────────────
const INSPECTION_ITEMS = [
  { key: "kebersihanLantai", no: 1, item: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
  { key: "kebersihanDinding", no: 2, item: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
  { key: "bauToilet", no: 3, item: "Bau tidak menyengat / tidak ada bau tidak sedap" },
  { key: "ketersediaanAir", no: 4, item: "Ketersediaan air mencukupi" },
  { key: "klosetBersih", no: 5, item: "Kloset dan Urinoir bersih, tidak mampet, tidak bocor" },
  { key: "wastafel", no: 6, item: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
  { key: "tisuToilet", no: 7, item: "Tisu toilet tersedia" },
  { key: "tempatSampah", no: 8, item: "Tempat sampah tersedia dan tertutup" },
  { key: "ventilasi", no: 9, item: "Ventilasi cukup (tidak pengap)" },
  { key: "perlengkapanLain", no: 10, item: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
  { key: "lampu", no: 11, item: "Lampu penerangan berfungsi baik (tidak mati, tidak berkedip, tidak redup)" },
  { key: "keran", no: 12, item: "Keran air berfungsi baik (tidak bocor, tidak macet, aliran air normal)" },
  { key: "exhaustFan", no: 13, item: "Exhaust fan berfungsi baik (berputar normal, tidak berbunyi kasar, tidak bergetar berlebihan)" },
];

const AREA_MAP: Record<string, { title: string; desc: string; type: FormType }> = {
  "toilet-driver": { title: "TOILET - DRIVER", desc: "Toilet umum", type: "general" },
  "toilet-bea-cukai": { title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-parkir": { title: "TOILET - PARKIR", desc: "Toilet umum", type: "general" },
  "toilet-c2": { title: "TOILET - C2", desc: "Toilet wanita", type: "wanita" },
  "toilet-c1": { title: "TOILET - C1", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-d": { title: "TOILET - D", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-auditorium": { title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-whs": { title: "TOILET - WHS", desc: "Toilet wanita", type: "wanita" },
  "toilet-b1": { title: "TOILET - B1", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-b2": { title: "TOILET - B2", desc: "Toilet wanita", type: "wanita" },
  "toilet-genba-b": { title: "TOILET - GENBA B", desc: "Toilet wanita", type: "wanita" },
  "toilet-a": { title: "TOILET - A", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-lobby": { title: "TOILET - LOBBY", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-office-main": { title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan", type: "mixed" },
  "toilet-b": { title: "TOILET - B", desc: "Toilet wanita", type: "wanita" },
};

// Helper untuk mendapatkan label dan warna berdasarkan tipe
const getTypeBadge = (type: FormType) => {
  switch (type) {
    case "wanita":
      return { label: "🚺 Wanita", color: "#e91e63", bgColor: "#fce4ec", desc: "Female only" };
    case "general":
      return { label: "🚻 General", color: "#0d47a1", bgColor: "#e3f2fd", desc: "Toilet umum" };
    case "mixed":
      return { label: "🚹🚺 Mixed", color: "#7b1fa2", bgColor: "#f3e5f5", desc: "Laki & perempuan" };
    default:
      return { label: "Mixed", color: "#7b1fa2", bgColor: "#f3e5f5", desc: "" };
  }
};

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function ChecksheetToiletForm({ params }: { params: Promise<{ area: string }> }) {
  const resolvedParams = React.use(params);
  const areaId = resolvedParams.area;
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();

  // ✅ TAMBAHKAN HOOK UNTUK OFFLINE MODE
  const { isOnline, refreshPendingCount } = useConnection();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Step flow: "laki" → isi laki-laki dulu, "perempuan" → lanjut ke perempuan
  const [activeStep, setActiveStep] = useState<"laki" | "perempuan">("laki");

  const currentArea = AREA_MAP[areaId] || { title: decodeURIComponent(areaId), desc: "Lokasi tidak diketahui", type: "mixed" as FormType };
  const formType: FormType = currentArea.type;
  const isSingleForm = formType === "wanita" || formType === "general";
  const kategori = "Toilet";
  const lokasi = currentArea.desc;
  const typeBadge = getTypeBadge(formType);

  // ─── EFFECTS ────────────────────────────────────────────
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-toilet-${areaId}`;
      const saved = localStorage.getItem(key);
      if (saved) setSavedData(JSON.parse(saved));
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaId]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  useEffect(() => {
    if (!isMounted || !user) return;
    const picName = user.fullName || "";
    const newAnswers: Record<string, string> = {};

    if (isSingleForm) {
      INSPECTION_ITEMS.forEach((item) => {
        newAnswers[`${item.key}_hasil`] = "OK";
        newAnswers[`${item.key}_keterangan`] = "";
        newAnswers[`${item.key}_foto`] = "";
        newAnswers[`${item.key}_tindakan`] = "";
        newAnswers[`${item.key}_pic`] = picName;
      });
    } else {
      INSPECTION_ITEMS.forEach((item) => {
        newAnswers[`${item.key}_L_hasil`] = "OK";
        newAnswers[`${item.key}_L_keterangan`] = "";
        newAnswers[`${item.key}_L_foto`] = "";
        newAnswers[`${item.key}_L_tindakan`] = "";
        newAnswers[`${item.key}_L_pic`] = picName;

        newAnswers[`${item.key}_P_hasil`] = "OK";
        newAnswers[`${item.key}_P_keterangan`] = "";
        newAnswers[`${item.key}_P_foto`] = "";
        newAnswers[`${item.key}_P_tindakan`] = "";
        newAnswers[`${item.key}_P_pic`] = picName;
      });
    }
    setAnswers(newAnswers);
  }, [isMounted, isSingleForm, user]);

  // ─── HANDLERS ───────────────────────────────────────────
  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnswers((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }

    try {
      const toiletTypeParam = formType === "wanita" ? "wanita_only" : formType === "general" ? "general" : "laki_perempuan";
      const response = await fetch(
        `/e-checksheet-ga/api/toilet-inspections/check-status?area_code=${areaId}&inspection_date=${selectedDate}&toilet_type=${toiletTypeParam}`
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result = await response.json();

      if (result.filled && result.data) {
        const existingData: Record<string, string> = {};
        const data = result.data;

        if (isSingleForm) {
          const suffix = formType === "wanita" ? "p" : "g";
          INSPECTION_ITEMS.forEach((item) => {
            const itemNum = item.no;
            existingData[`${item.key}_hasil`] = data[`item_${itemNum}_hasil_${suffix}`] || "OK";
            existingData[`${item.key}_keterangan`] = data[`item_${itemNum}_keterangan_${suffix}`] || "";
            existingData[`${item.key}_foto`] = data[`item_${itemNum}_foto_${suffix}`] || "";
            existingData[`${item.key}_tindakan`] = data[`item_${itemNum}_tindakan_${suffix}`] || "";
            existingData[`${item.key}_pic`] = data[`item_${itemNum}_pic_${suffix}`] || user?.fullName || "";
          });
        } else {
          INSPECTION_ITEMS.forEach((item) => {
            const itemNum = item.no;
            existingData[`${item.key}_L_hasil`] = data[`item_${itemNum}_hasil_l`] || "OK";
            existingData[`${item.key}_L_keterangan`] = data[`item_${itemNum}_keterangan_l`] || "";
            existingData[`${item.key}_L_foto`] = data[`item_${itemNum}_foto_l`] || "";
            existingData[`${item.key}_L_tindakan`] = data[`item_${itemNum}_tindakan_l`] || "";
            existingData[`${item.key}_L_pic`] = data[`item_${itemNum}_pic_l`] || user?.fullName || "";
            existingData[`${item.key}_P_hasil`] = data[`item_${itemNum}_hasil_p`] || "OK";
            existingData[`${item.key}_P_keterangan`] = data[`item_${itemNum}_keterangan_p`] || "";
            existingData[`${item.key}_P_foto`] = data[`item_${itemNum}_foto_p`] || "";
            existingData[`${item.key}_P_tindakan`] = data[`item_${itemNum}_tindakan_p`] || "";
            existingData[`${item.key}_P_pic`] = data[`item_${itemNum}_pic_p`] || user?.fullName || "";
          });
        }

        setAnswers(existingData);
        alert("✓ Data berhasil dimuat dari database!");
      } else {
        const storageKey = `e-checksheet-toilet-${areaId}`;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
          try {
            const localData = JSON.parse(saved);
            const existingData: Record<string, string> = {};
            let found = false;

            if (isSingleForm) {
              INSPECTION_ITEMS.forEach((item) => {
                const entry = (localData[item.key] || []).find((e: any) => e.date === selectedDate);
                if (entry) {
                  found = true;
                  existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
                  existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
                  existingData[`${item.key}_foto`] = entry.fotoTemuan || "";
                  existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
                  existingData[`${item.key}_pic`] = entry.pic;
                }
              });
            } else {
              INSPECTION_ITEMS.forEach((item) => {
                const entryL = (localData[`${item.key}_L`] || []).find((e: any) => e.date === selectedDate);
                if (entryL) {
                  found = true;
                  existingData[`${item.key}_L_hasil`] = entryL.hasilPemeriksaan;
                  existingData[`${item.key}_L_keterangan`] = entryL.keteranganTemuan;
                  existingData[`${item.key}_L_foto`] = entryL.fotoTemuan || "";
                  existingData[`${item.key}_L_tindakan`] = entryL.tindakanPerbaikan;
                  existingData[`${item.key}_L_pic`] = entryL.pic;
                }
                const entryP = (localData[`${item.key}_P`] || []).find((e: any) => e.date === selectedDate);
                if (entryP) {
                  found = true;
                  existingData[`${item.key}_P_hasil`] = entryP.hasilPemeriksaan;
                  existingData[`${item.key}_P_keterangan`] = entryP.keteranganTemuan;
                  existingData[`${item.key}_P_foto`] = entryP.fotoTemuan || "";
                  existingData[`${item.key}_P_tindakan`] = entryP.tindakanPerbaikan;
                  existingData[`${item.key}_P_pic`] = entryP.pic;
                }
              });
            }

            if (found) {
              setAnswers(existingData);
              alert("✓ Data berhasil dimuat dari localStorage!");
            } else {
              alert("ℹ️ Tidak ada data untuk tanggal ini. Form direset ke kondisi default.");
              const picName = user?.fullName || "";
              const resetData: Record<string, string> = {};
              if (isSingleForm) {
                INSPECTION_ITEMS.forEach((item) => {
                  resetData[`${item.key}_hasil`] = "OK";
                  resetData[`${item.key}_keterangan`] = "";
                  resetData[`${item.key}_foto`] = "";
                  resetData[`${item.key}_tindakan`] = "";
                  resetData[`${item.key}_pic`] = picName;
                });
              } else {
                INSPECTION_ITEMS.forEach((item) => {
                  resetData[`${item.key}_L_hasil`] = "OK";
                  resetData[`${item.key}_L_keterangan`] = "";
                  resetData[`${item.key}_L_foto`] = "";
                  resetData[`${item.key}_L_tindakan`] = "";
                  resetData[`${item.key}_L_pic`] = picName;
                  resetData[`${item.key}_P_hasil`] = "OK";
                  resetData[`${item.key}_P_keterangan`] = "";
                  resetData[`${item.key}_P_foto`] = "";
                  resetData[`${item.key}_P_tindakan`] = "";
                  resetData[`${item.key}_P_pic`] = picName;
                });
              }
              setAnswers(resetData);
            }
          } catch (e) {
            alert("⚠️ Error saat memuat data lokal.");
          }
        } else {
          alert("ℹ️ Tidak ada data untuk tanggal ini. Form direset ke kondisi default.");
        }
      }
    } catch (error) {
      alert(`❌ Gagal memuat data: ${error instanceof Error ? error.message : "Error tidak diketahui"}`);
    }
  };

  // Check if all laki-laki fields are filled (only for mixed type)
  const isLakiComplete = formType === "mixed" && INSPECTION_ITEMS.every(
    (item) => !!answers[`${item.key}_L_hasil`]
  );

  const handleNextStep = () => {
    if (!selectedDate) { alert("Pilih tanggal terlebih dahulu!"); return; }
    const missing = INSPECTION_ITEMS.filter((item) => !answers[`${item.key}_L_hasil`]);
    if (missing.length > 0) {
      alert(`Mohon isi Hasil Pemeriksaan Laki-laki untuk:\n${missing.map(i => `Item ${i.no}`).join(", ")}`);
      return;
    }
    setActiveStep("perempuan");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setActiveStep("laki");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!selectedDate) { alert("Pilih tanggal pemeriksaan terlebih dahulu!"); return; }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) { alert("Format tanggal tidak valid!"); return; }

    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    selectedDateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj > today) { alert("Tanggal pemeriksaan tidak boleh di masa depan!"); return; }

    const missingFields: string[] = [];
    if (isSingleForm) {
      INSPECTION_ITEMS.forEach((item) => {
        if (!answers[`${item.key}_hasil`]) missingFields.push(`Item ${item.no}`);
      });
    } else {
      INSPECTION_ITEMS.forEach((item) => {
        if (!answers[`${item.key}_L_hasil`]) missingFields.push(`Item ${item.no} (Laki-laki)`);
        if (!answers[`${item.key}_P_hasil`]) missingFields.push(`Item ${item.no} (Perempuan)`);
      });
    }
    if (missingFields.length > 0) { alert(`Mohon isi Hasil Pemeriksaan untuk:\n${missingFields.join('\n')}`); return; }
    if (!user) { alert("User tidak ditemukan. Silakan login ulang."); return; }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const inspection_time = `${hours}:${minutes}:${seconds}`;

      const toiletType = formType === "wanita" ? "wanita_only" : formType === "general" ? "general" : "laki_perempuan";

      // ✅ BUILD PAYLOAD DENGAN LOG YANG JELAS
      const apiPayload: Record<string, any> = {
        area_code: areaId,
        area_name: currentArea.title,
        inspection_date: selectedDate,
        inspection_time,
        user_id: user.id || "",
        inspector_name: user.fullName || "Unknown User",
        inspector_nik: user.nik || "",
        toilet_type: toiletType,
      };

      console.log('💾 [Save] Form Type:', formType, '| Toilet Type:', toiletType, '| Is Single:', isSingleForm);

      if (isSingleForm) {
        // ✅ UNTUK GENERAL & WANITA - Gunakan suffix 'p'
        const suffix = "p"; // Selalu gunakan _p untuk single form
        console.log(`📝 [Save] Building payload for ${formType} with suffix: _${suffix}`);

        INSPECTION_ITEMS.forEach((item) => {
          const itemNum = item.no;
          const hasilKey = `item_${itemNum}_hasil_${suffix}`;
          const ketKey = `item_${itemNum}_keterangan_${suffix}`;
          const fotoKey = `item_${itemNum}_foto_${suffix}`;
          const tindakanKey = `item_${itemNum}_tindakan_${suffix}`;
          const picKey = `item_${itemNum}_pic_${suffix}`;

          apiPayload[hasilKey] = answers[`${item.key}_hasil`] || "OK";
          apiPayload[ketKey] = answers[`${item.key}_keterangan`] || "";
          apiPayload[fotoKey] = answers[`${item.key}_foto`] || "";
          apiPayload[tindakanKey] = answers[`${item.key}_tindakan`] || "";
          apiPayload[picKey] = answers[`${item.key}_pic`] || user.fullName || "";

          // Log untuk debugging (hanya item pertama)
          if (itemNum === 1) {
            console.log(`🔍 [Save] Sample payload:`, {
              [hasilKey]: apiPayload[hasilKey],
              [ketKey]: apiPayload[ketKey].substring(0, 50) + '...',
              hasFoto: !!apiPayload[fotoKey],
            });
          }
        });
      } else {
        // ✅ UNTUK MIXED (LAKI & PEREMPUAN)
        console.log('📝 [Save] Building payload for mixed (L & P)');

        INSPECTION_ITEMS.forEach((item) => {
          const itemNum = item.no;

          // Laki-laki
          apiPayload[`item_${itemNum}_hasil_l`] = answers[`${item.key}_L_hasil`] || "OK";
          apiPayload[`item_${itemNum}_keterangan_l`] = answers[`${item.key}_L_keterangan`] || "";
          apiPayload[`item_${itemNum}_foto_l`] = answers[`${item.key}_L_foto`] || "";
          apiPayload[`item_${itemNum}_tindakan_l`] = answers[`${item.key}_L_tindakan`] || "";
          apiPayload[`item_${itemNum}_pic_l`] = answers[`${item.key}_L_pic`] || user.fullName || "";

          // Perempuan
          apiPayload[`item_${itemNum}_hasil_p`] = answers[`${item.key}_P_hasil`] || "OK";
          apiPayload[`item_${itemNum}_keterangan_p`] = answers[`${item.key}_P_keterangan`] || "";
          apiPayload[`item_${itemNum}_foto_p`] = answers[`${item.key}_P_foto`] || "";
          apiPayload[`item_${itemNum}_tindakan_p`] = answers[`${item.key}_P_tindakan`] || "";
          apiPayload[`item_${itemNum}_pic_p`] = answers[`${item.key}_P_pic`] || user.fullName || "";
        });
      }

      // Hitung jumlah field item yang dikirim
      const itemCount = Object.keys(apiPayload).filter(k => k.startsWith('item_')).length;
      console.log(`📊 [Save] Total item fields: ${itemCount}`);

      // ✅ GUNAKAN smartFetch DENGAN METADATA
      const response = await smartFetch(
        "/e-checksheet-ga/api/toilet-inspections/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
          queueType: 'toilet',
          metadata: {
            areaType: formType,
            areaCode: areaId,
          },
        }
      );

      const result = await response.json();

      // Handle response
      if ((response as any).offline || result.offline) {
        // Mode offline
        const pendingCount = await refreshPendingCount();
        alert(`📴 Data tersimpan offline!\n\n` +
          `📋 Detail:\n` +
          `- Area: ${currentArea.title}\n` +
          `- Tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}\n` +
          `- Items: ${INSPECTION_ITEMS.length} inspection points\n` +
          `- Antrian: ${pendingCount} data\n\n` +
          `Data akan otomatis terkirim saat online kembali.`);
      } else {
        // Mode online - sukses
        if (!result.success) {
          throw new Error(result.message || "Gagal menyimpan data");
        }

        alert(`✅ Data berhasil disimpan!\n\n` +
          `📋 Detail:\n` +
          `- Area: ${currentArea.title}\n` +
          `- Tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}\n` +
          `- Items: ${INSPECTION_ITEMS.length} inspection points`);
      }

      // Backup ke localStorage (tetap jalankan)
      const newData: SavedData = { ...savedData };
      const storageKey = `e-checksheet-toilet-${areaId}`;
      const inspectorName = user.fullName || "Unknown User";

      if (isSingleForm) {
        INSPECTION_ITEMS.forEach((item) => {
          const entry: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
            pic: answers[`${item.key}_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };
          const arr = newData[item.key] || [];
          const idx = arr.findIndex((e) => e.date === selectedDate);
          if (idx >= 0) arr[idx] = entry; else arr.push(entry);
          newData[item.key] = arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      } else {
        INSPECTION_ITEMS.forEach((item) => {
          const entryL: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_L_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_L_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_L_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_L_tindakan`] || "",
            pic: answers[`${item.key}_L_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };
          const entryP: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_P_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_P_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_P_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_P_tindakan`] || "",
            pic: answers[`${item.key}_P_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };

          const keyL = `${item.key}_L`;
          const keyP = `${item.key}_P`;
          const arrL = newData[keyL] || [];
          const idxL = arrL.findIndex((e) => e.date === selectedDate);
          if (idxL >= 0) arrL[idxL] = entryL; else arrL.push(entryL);
          newData[keyL] = arrL.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const arrP = newData[keyP] || [];
          const idxP = arrP.findIndex((e) => e.date === selectedDate);
          if (idxP >= 0) arrP[idxP] = entryP; else arrP.push(entryP);
          newData[keyP] = arrP.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(newData));

      // Update global history
      const hasNG = INSPECTION_ITEMS.some((item) => {
        if (isSingleForm) return answers[`${item.key}_hasil`] === "NG";
        return answers[`${item.key}_L_hasil`] === "NG" || answers[`${item.key}_P_hasil`] === "NG";
      });

      const globalArea = `Toilet - ${currentArea.title.replace("TOILET - ", "")}`;
      const globalEntry = {
        id: `TOILET-${Date.now()}`,
        type: "toilet",
        area: globalArea,
        status: hasNG ? "NG" : "OK",
        filledBy: inspectorName,
        filledAt: new Date().toISOString(),
      };

      const globalHistory = JSON.parse(localStorage.getItem("checksheet_history") || "[]");
      globalHistory.push(globalEntry);
      localStorage.setItem("checksheet_history", JSON.stringify(globalHistory));

      await refreshPendingCount();
      router.push(`/status-ga/checksheet-toilet`);

    } catch (err) {
      console.error('❌ [Save] Error:', err);
      if (err instanceof Error && err.name === "AbortError") {
        alert("⏰ Request timeout. Silakan coba lagi.");
        return;
      }
      if (err instanceof Error && err.message.includes("Failed to fetch")) {
        alert("📴 Gagal terhubung ke server. Data akan disimpan offline.");
        return;
      }
      alert(`❌ Gagal menyimpan: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────
  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="cs-loading-screen">
        <div className="cs-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAuthorizedForChecksheet(user)) {
    return null;
  }

  const fullName = user.fullName || "Pengguna";

  return (
    <>
      <style>{`
        /* ─── CSS VARIABLES ─── */
        :root {
          --cs-blue: #065dd0;
          --cs-blue-light: #10b2ee;
          --cs-blue-pale: #e3f2fd;
          --cs-blue-mid: #bbdefb;
          --cs-blue-dark: #0d47a1;
          --cs-male: #1565c0;
          --cs-male-bg: #90caf9;
          --cs-male-pale: #e3f2fd;
          --cs-female: #ad1457;
          --cs-female-bg: #f48fb1;
          --cs-female-pale: #fce4ec;
          --cs-general: #0d47a1;
          --cs-general-bg: #90caf9;
          --cs-general-pale: #e3f2fd;
          --cs-ok: #2e7d32;
          --cs-ng: #c62828;
          --cs-border: #dde3ea;
          --cs-shadow: 0 2px 8px rgba(0,0,0,0.07);
          --cs-radius: 10px;
          --cs-sidebar: 75px;
        }

        /* ─── LAYOUT ─── */
        .cs-page {
          min-height: 100vh;
          background: #f0f4f8;
        }

        .cs-main {
          padding: 20px 20px 40px;
          max-width: 1600px;
          margin: 0 0 0 var(--cs-sidebar);
        }

        /* ─── HEADER ─── */
        .cs-header {
          background: linear-gradient(135deg, var(--cs-blue) 0%, var(--cs-blue-light) 100%);
          border-radius: var(--cs-radius);
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 14px rgba(6,93,208,0.25);
        }

        .cs-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .cs-header h1 {
          margin: 0;
          color: #fff;
          font-size: clamp(18px, 4vw, 26px);
          font-weight: 700;
          line-height: 1.2;
        }

        .cs-header p {
          margin: 0;
          color: rgba(255,255,255,0.88);
          font-size: clamp(12px, 2.5vw, 14px);
        }

        /* ─── TYPE BADGE ─── */
        .cs-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          margin-left: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .cs-type-badge--wanita {
          background: #fce4ec;
          color: #e91e63;
          border: 2px solid #f48fb1;
        }

        .cs-type-badge--general {
          background: #e3f2fd;
          color: #0d47a1;
          border: 2px solid #90caf9;
        }

        .cs-type-badge--mixed {
          background: #f3e5f5;
          color: #7b1fa2;
          border: 2px solid #ce93d8;
        }

        .cs-type-desc {
          display: block;
          font-size: 11px;
          font-weight: 500;
          opacity: 0.85;
          margin-top: 2px;
        }

        /* ─── CARD ─── */
        .cs-card {
          background: #fff;
          border: 1px solid var(--cs-border);
          border-radius: var(--cs-radius);
          padding: 16px 20px;
          box-shadow: var(--cs-shadow);
          margin-bottom: 16px;
        }

        .cs-card--date {
          border: 2px solid var(--cs-blue-light);
        }

        /* ─── INFO GRID ─── */
        .cs-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 4px 16px;
        }

        .cs-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          gap: 8px;
        }

        .cs-info-row:last-child { border-bottom: none; }

        .cs-info-label {
          font-weight: 600;
          color: #0095bb;
          font-size: 13px;
          flex-shrink: 0;
        }

        .cs-info-value {
          color: #333;
          font-size: 13px;
          font-weight: 500;
          text-align: right;
        }

        /* ─── DATE SECTION ─── */
        .cs-date-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cs-date-label {
          font-weight: 700;
          color: var(--cs-blue);
          font-size: 14px;
          white-space: nowrap;
        }

        .cs-date-input {
          flex: 0 0 auto;
          width: 180px;
          max-width: 180px;
          padding: 10px 14px;
          border: 2px solid #0b8ee0;
          border-radius: 6px;
          font-size: 15px;
          color: #333;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
        }

        .cs-date-input:focus { border-color: var(--cs-blue); }
        .cs-date-input:disabled { background: #f5f5f5; cursor: not-allowed; border-color: #ccc; }

        .cs-date-hint {
          margin: 10px 0 0;
          font-size: 12px;
          color: #888;
          font-style: italic;
        }

        /* ─── BANNERS ────────────────────────────────────── */
        .cs-banner {
          border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px; font-weight: 500;
          font-size: 13px;
        }
        .cs-banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .cs-banner-btn {
          margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; border: none; border-radius: 7px; padding: 8px 16px;
          cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
          display: inline-flex; align-items: center; gap: 6px; min-height: 36px;
        }
        .cs-banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .cs-banner-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .cs-scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; justify-content: space-between;
        }
        .cs-scan-warning .cs-banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 8px 16px;
        }
        .cs-scan-warning .cs-banner-btn:hover {
          transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }

        /* ─── BUTTONS ─── */
        .cs-btn {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .cs-btn--load {
          background: #ff9800;
          color: #fff;
        }

        .cs-btn--load:hover:not(:disabled) { background: #e65100; }
        .cs-btn--load:disabled { background: #bdbdbd; cursor: not-allowed; opacity: 0.6; }

        .cs-btn--back {
          background: #9e9e9e;
          color: #fff;
          min-width: 130px;
        }

        .cs-btn--back:hover { background: #616161; }

        .cs-btn--save {
          background: linear-gradient(135deg, #43a047, #1e88e5);
          color: #fff;
          min-width: 150px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.3);
        }

        .cs-btn--save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cs-btn--save:disabled { background: #bdbdbd; cursor: not-allowed; opacity: 0.6; transform: none; }

        .cs-btn--next-male {
          background: linear-gradient(135deg, #1565c0, #1e88e5);
          color: #fff;
          flex: 1;
          min-width: 160px;
          padding: 12px 20px;
          font-size: 14px;
        }

        .cs-btn--next-male:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cs-btn--next-male:disabled { background: #bdbdbd; cursor: not-allowed; opacity: 0.6; transform: none; }

        .cs-btn--prev-female {
          background: #f5f5f5;
          color: #555;
          border: 1px solid #ddd;
          flex: 0 0 auto;
          padding: 12px 20px;
          font-size: 14px;
        }

        .cs-btn--prev-female:hover { background: #eeeeee; }

        .cs-btn-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding: 20px 0;
          flex-wrap: wrap;
        }

        /* ─── SPINNER ─── */
        .cs-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.5);
          border-top-color: #fff;
          border-radius: 50%;
          animation: cs-spin 0.8s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }

        @keyframes cs-spin {
          to { transform: rotate(360deg); }
        }

        /* ─── TABLE WRAPPER ─── */
        .cs-table-wrapper {
          background: #fff;
          border-radius: var(--cs-radius);
          box-shadow: var(--cs-shadow);
          border: 2px solid var(--cs-blue-light);
          overflow: hidden;
          margin-bottom: 16px;
        }

        .cs-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* ─── TABLE ── */
        .cs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .cs-table th,
        .cs-table td {
          padding: 10px 8px;
          border: 1px solid #c9d8ea;
        }

        .cs-table thead th {
          font-weight: 700;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .cs-th--no     { width: 46px; min-width: 46px; background: var(--cs-blue-mid); color: var(--cs-blue-dark); }
        .cs-th--item   { min-width: 250px; background: var(--cs-blue-mid); color: var(--cs-blue-dark); }
        .cs-th--male   { background: var(--cs-male-bg); color: var(--cs-male); }
        .cs-th--female { background: var(--cs-female-bg); color: var(--cs-female); }
        .cs-th--wanita { background: var(--cs-female-bg); color: var(--cs-female); }
        .cs-th--general { background: var(--cs-general-bg); color: var(--cs-general); }

        .cs-th--hasil   { min-width: 100px; }
        .cs-th--ket     { min-width: 200px; }
        .cs-th--tindakan{ min-width: 160px; }
        .cs-th--pic     { min-width: 120px; }

        /* ─── TABLE CELLS ─── */
        .cs-td--no,
        .cs-td--item { background: #f7f9fc; }

        .cs-td--no {
          text-align: center;
          font-weight: 700;
          color: #333;
          vertical-align: middle;
        }

        .cs-td--item {
          color: #333;
          line-height: 1.5;
          font-weight: 500;
          vertical-align: top;
          padding: 10px 10px;
        }

        .cs-td {
          vertical-align: top;
          padding: 6px;
        }

        /* ─── FORM INPUTS ─── */
        .cs-select,
        .cs-textarea,
        .cs-input-text {
          width: 100%;
          border: 1px solid #cdd5de;
          border-radius: 5px;
          font-size: 12px;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
          background: #fff;
          font-family: inherit;
        }

        .cs-select {
          padding: 8px 6px;
          font-weight: 600;
          cursor: pointer;
          border-width: 2px;
        }

        .cs-select--male   { border-color: #2196f3; }
        .cs-select--female { border-color: #e91e63; }
        .cs-select--wanita { border-color: #e91e63; }
        .cs-select--general { border-color: #1565c0; }

        .cs-select:disabled,
        .cs-textarea:disabled,
        .cs-input-text:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          color: #888;
          border-color: #ccc;
        }

        .cs-select:focus,
        .cs-textarea:focus {
          outline: none;
          border-color: var(--cs-blue);
        }

        .cs-textarea {
          padding: 6px;
          resize: vertical;
          min-height: 56px;
        }

        .cs-input-text {
          padding: 6px;
          font-weight: 600;
        }

        .cs-input-text--male   { background: #e8f4fd; color: var(--cs-male); }
        .cs-input-text--female { background: #fde4ee; color: var(--cs-female); }
        .cs-input-text--wanita { background: #fde4ee; color: var(--cs-female); }
        .cs-input-text--general { background: #e3f2fd; color: var(--cs-general); }

        /* ─── FILE INPUT ─── */
        .cs-file-input {
          margin-top: 6px;
          font-size: 11px;
          width: 100%;
          cursor: pointer;
        }

        .cs-file-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .cs-foto-preview {
          margin-top: 6px;
          text-align: center;
        }

        .cs-foto-preview img {
          max-width: 80px;
          max-height: 80px;
          border: 1px solid #ddd;
          border-radius: 4px;
          object-fit: cover;
        }

        /* ─── LOADING SCREEN ─── */
        .cs-loading-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f0f4f8;
          gap: 16px;
          color: #555;
        }

        .cs-loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #cdd5de;
          border-top-color: var(--cs-blue);
          border-radius: 50%;
          animation: cs-spin 0.8s linear infinite;
        }

        /* ─── SCROLL HINT (mobile) ─── */
        .cs-scroll-hint {
          display: none;
          font-size: 11px;
          color: #888;
          text-align: center;
          padding: 6px 0;
          font-style: italic;
        }

        /* ─── MOBILE CARDS VIEW ─── */
        .cs-mobile-cards {
          display: none;
        }

        .cs-mobile-card {
          background: #fff;
          border-radius: 8px;
          border: 1px solid var(--cs-border);
          box-shadow: var(--cs-shadow);
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        .cs-mobile-card-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0f0f0;
        }

        .cs-mobile-card-no {
          background: var(--cs-blue);
          color: #fff;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }

        .cs-mobile-card-item {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          line-height: 1.5;
        }

        .cs-mobile-gender-block {
          margin-bottom: 12px;
          border: 1px solid var(--cs-border);
          border-radius: 6px;
          overflow: hidden;
        }

        .cs-mobile-gender-title {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cs-mobile-gender-title--male {
          background: var(--cs-male-bg);
          color: var(--cs-male);
        }

        .cs-mobile-gender-title--female {
          background: var(--cs-female-bg);
          color: var(--cs-female);
        }

        .cs-mobile-gender-title--wanita {
          background: var(--cs-female-bg);
          color: var(--cs-female);
        }

        .cs-mobile-gender-title--general {
          background: var(--cs-general-bg);
          color: var(--cs-general);
        }

        .cs-mobile-fields {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cs-mobile-field-label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 3px;
        }

        /* ─── STEP INDICATOR ─── */
        .cs-step-bar {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 16px;
          background: #fff;
          border: 1px solid var(--cs-border);
          border-radius: var(--cs-radius);
          overflow: hidden;
          box-shadow: var(--cs-shadow);
        }

        .cs-step {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: #f7f9fc;
          color: #999;
          position: relative;
        }

        .cs-step--active-male {
          background: linear-gradient(135deg, #1565c0, #1e88e5);
          color: #fff;
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.15);
        }

        .cs-step--active-female {
          background: linear-gradient(135deg, #ad1457, #e91e63);
          color: #fff;
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.15);
        }

        .cs-step--done {
          background: #e8f5e9;
          color: #2e7d32;
          cursor: pointer;
        }

        .cs-step--locked {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .cs-step-divider {
          width: 1px;
          height: 48px;
          background: #dde3ea;
          flex-shrink: 0;
        }

        .cs-step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255,255,255,0.3);
          flex-shrink: 0;
        }

        .cs-step--done .cs-step-badge {
          background: #2e7d32;
          color: #fff;
        }

        .cs-step--active-male .cs-step-badge,
        .cs-step--active-female .cs-step-badge {
          background: rgba(255,255,255,0.3);
          color: #fff;
        }

        .cs-step-nav {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        /* ─── RESPONSIVE BREAKPOINTS ─── */
        @media (max-width: 1024px) {
          .cs-main {
            margin-left: 80px;
            padding: 16px 14px 40px;
          }
        }

        @media (max-width: 768px) {
          .cs-main {
            margin-left: 0;
            padding: 12px 12px 60px;
          }

          .cs-header {
            padding: 14px 16px;
            margin-bottom: 14px;
          }

          .cs-header-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .cs-type-badge {
            margin-left: 0;
            margin-top: 8px;
          }

          .cs-card {
            padding: 12px 14px;
            margin-bottom: 12px;
          }

          .cs-date-row {
            flex-direction: column;
            align-items: stretch;
          }

          .cs-date-label {
            font-size: 13px;
          }

          .cs-date-input {
            width: 180px;
            max-width: 180px;
          }

          .cs-btn--load {
            width: 100%;
            text-align: center;
            padding: 12px;
          }

          .cs-btn-row {
            flex-direction: column;
            gap: 10px;
            padding: 16px 0;
          }

          .cs-btn--back,
          .cs-btn--save {
            width: 100%;
            min-width: unset;
            padding: 14px;
            font-size: 14px;
          }

          .cs-scroll-hint {
            display: block;
          }
        }

        @media (max-width: 600px) {
          .cs-table-wrapper {
            display: none;
          }

          .cs-mobile-cards {
            display: block;
          }

          .cs-info-grid {
            grid-template-columns: 1fr;
          }

          .cs-info-row {
            flex-direction: row;
          }
        }

        @media (max-width: 380px) {
          .cs-main {
            padding: 10px 8px 60px;
          }

          .cs-header h1 {
            font-size: 17px;
          }

          .cs-mobile-card {
            padding: 10px;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .cs-select,
          .cs-textarea,
          .cs-input-text,
          .cs-date-input {
            font-size: 16px;
          }

          .cs-btn {
            min-height: 44px;
          }

          .cs-select {
            min-height: 44px;
          }
        }
      `}</style>

      <div className="cs-page">
        <Sidebar userName={fullName} />

        <div className="cs-main">
          {/* ── Header ── */}
          <div className="cs-header">
            <div className="cs-header-top">
              <button
                onClick={() => router.push("/status-ga/checksheet-toilet")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  transition: "background 0.2s",
                  minHeight: "36px",
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.32)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              >
                ← Kembali
              </button>
              <div>
                <h1>🚻 Checksheet Toilet</h1>
                <p>Form Pemeriksaan Kebersihan &amp; Kelayakan Toilet</p>
              </div>
              <span className={`cs-type-badge cs-type-badge--${formType}`}>
                <span>{typeBadge.label}</span>
                <span className="cs-type-desc">{typeBadge.desc}</span>
              </span>
            </div>
          </div>

          {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
          {!isScanned && (
            <div className="cs-banner cs-banner-warning cs-scan-warning">
              <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
              <button
                onClick={() => router.push("/scan")}
                className="cs-banner-btn"
                disabled={isSubmitting}
              >
                <QrCode size={14} /> Scan Sekarang
              </button>
            </div>
          )}

          {/* ── Info Area ── */}
          <div className="cs-card">
            <div className="cs-info-grid">
              <InfoRow label="Nama Area" value={currentArea.title} />
              <InfoRow label="Kategori" value={kategori} />
              <InfoRow label="Lokasi" value={lokasi} />
              <InfoRow label="PIC Pengecekan" value={fullName} />
            </div>
          </div>

          {/* ── Date Selection ── */}
          <div className="cs-card cs-card--date">
            <div className="cs-date-row">
              <span className="cs-date-label">📅 Tanggal Pemeriksaan:</span>
              <input
                type="date"
                className="cs-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              />
              <button
                className="cs-btn cs-btn--load"
                onClick={handleLoadExisting}
                disabled={!selectedDate || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                📂 Muat Data
              </button>
            </div>
            <p className="cs-date-hint">
              💡 Pilih tanggal pemeriksaan, lalu isi form. Klik &quot;Muat Data&quot; jika ingin mengedit data sebelumnya.
            </p>
          </div>

          {/* ── Step Indicator (only for mixed type) ── */}
          {formType === "mixed" && (
            <div className="cs-step-bar">
              <button
                className={`cs-step ${activeStep === "laki" ? "cs-step--active-male" : "cs-step--done"}`}
                onClick={() => setActiveStep("laki")}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                <span className="cs-step-badge">{activeStep === "perempuan" ? "✓" : "1"}</span>
                🚹 Toilet Laki-laki
              </button>
              <div className="cs-step-divider" />
              <button
                className={`cs-step ${activeStep === "perempuan" ? "cs-step--active-female" : isLakiComplete ? "cs-step--done" : "cs-step--locked"}`}
                onClick={() => isLakiComplete ? setActiveStep("perempuan") : undefined}
                disabled={!isLakiComplete && activeStep !== "perempuan" || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : !isLakiComplete ? "Selesaikan isian Laki-laki terlebih dahulu" : ""}
              >
                <span className="cs-step-badge">2</span>
                🚺 Toilet Perempuan
              </button>
            </div>
          )}

          {/* ── Table (tablet/desktop) ── */}
          <div className="cs-table-wrapper">
            <p className="cs-scroll-hint">← Geser untuk melihat semua kolom →</p>
            <div className="cs-table-scroll">
              <ChecksheetTable
                inspectionItems={INSPECTION_ITEMS}
                formType={formType}
                activeStep={activeStep}
                answers={answers}
                selectedDate={selectedDate}
                isScanned={isScanned}
                onInputChange={handleInputChange}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>

          {/* ── Card layout (mobile) ── */}
          <div className="cs-mobile-cards">
            {INSPECTION_ITEMS.map((item) => (
              <MobileCard
                key={item.key}
                item={item}
                formType={formType}
                activeStep={activeStep}
                answers={answers}
                selectedDate={selectedDate}
                isScanned={isScanned}
                onInputChange={handleInputChange}
                onImageUpload={handleImageUpload}
              />
            ))}
          </div>

          {/* ── Step Navigation Buttons (mixed type only) ── */}
          {formType === "mixed" && (
            <div className="cs-step-nav">
              {activeStep === "laki" ? (
                <>
                  <button className="cs-btn cs-btn--back" onClick={() => router.push("/status-ga/checksheet-toilet")}>
                    ← Kembali
                  </button>
                  <button
                    className="cs-btn cs-btn--next-male"
                    onClick={handleNextStep}
                    disabled={!selectedDate || !isScanned}
                    title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  >
                    Lanjut ke Toilet Perempuan 🚺 →
                  </button>
                </>
              ) : (
                <>
                  <button className="cs-btn cs-btn--prev-female" onClick={handlePrevStep}>
                    ← Kembali ke Laki-laki
                  </button>
                  <button
                    className="cs-btn cs-btn--save"
                    onClick={handleSave}
                    disabled={!selectedDate || isSubmitting || !isScanned}
                    title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  >
                    {isSubmitting ? <><span className="cs-spinner" />Menyimpan...</> : "✓ Simpan Data"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Action Buttons (single form: wanita & general) ── */}
          {isSingleForm && (
            <div className="cs-btn-row">
              <button className="cs-btn cs-btn--back" onClick={() => router.push("/status-ga/checksheet-toilet")}>
                ← Kembali
              </button>
              <button
                className="cs-btn cs-btn--save"
                onClick={handleSave}
                disabled={!selectedDate || isSubmitting || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                {isSubmitting ? <><span className="cs-spinner" />Menyimpan...</> : "✓ Simpan Data"}
              </button>
            </div>
          )}
          <div className="cs-card">
            <p style={{ margin: 0, fontSize: 12, color: "#888", fontStyle: "italic" }}>
              💡 <strong>Tip:</strong> Lampirkan foto pada &quot;Keterangan Temuan&quot; jika diperlukan. Tanggal pemeriksaan mengikuti pilihan di atas.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="cs-info-row">
    <span className="cs-info-label">{label}</span>
    <span className="cs-info-value">{value}</span>
  </div>
);

// Desktop/Tablet Table
const ChecksheetTable = ({
  inspectionItems,
  formType,
  activeStep,
  answers,
  selectedDate,
  isScanned,
  onInputChange,
  onImageUpload,
}: {
  inspectionItems: typeof INSPECTION_ITEMS;
  formType: FormType;
  activeStep: "laki" | "perempuan";
  answers: Record<string, string>;
  selectedDate: string;
  isScanned: boolean;
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const isSingleForm = formType === "wanita" || formType === "general";

  return (
    <table className="cs-table" style={{ minWidth: "820px" }}>
      <thead>
        <tr>
          <th className="cs-th--no cs-th--hasil" rowSpan={2}>No</th>
          <th className="cs-th--item cs-th--ket" rowSpan={2}>Item Pengecekan</th>
          {isSingleForm ? (
            <>
              <th className={formType === "wanita" ? "cs-th--wanita cs-th--hasil" : "cs-th--general cs-th--hasil"}>HASIL</th>
              <th className={formType === "wanita" ? "cs-th--wanita cs-th--ket" : "cs-th--general cs-th--ket"}>KETERANGAN + FOTO</th>
              <th className={formType === "wanita" ? "cs-th--wanita cs-th--tindakan" : "cs-th--general cs-th--tindakan"}>TINDAKAN</th>
              <th className={formType === "wanita" ? "cs-th--wanita cs-th--pic" : "cs-th--general cs-th--pic"}>PIC</th>
            </>
          ) : activeStep === "laki" ? (
            <>
              <th className="cs-th--male cs-th--hasil">HASIL</th>
              <th className="cs-th--male cs-th--ket">KETERANGAN + FOTO</th>
              <th className="cs-th--male cs-th--tindakan">TINDAKAN</th>
              <th className="cs-th--male cs-th--pic">PIC</th>
            </>
          ) : (
            <>
              <th className="cs-th--female cs-th--hasil">HASIL</th>
              <th className="cs-th--female cs-th--ket">KETERANGAN + FOTO</th>
              <th className="cs-th--female cs-th--tindakan">TINDAKAN</th>
              <th className="cs-th--female cs-th--pic">PIC</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {inspectionItems.map((item) => (
          <TableRow
            key={item.key}
            item={item}
            formType={formType}
            activeStep={activeStep}
            answers={answers}
            selectedDate={selectedDate}
            isScanned={isScanned}
            onInputChange={onInputChange}
            onImageUpload={onImageUpload}
          />
        ))}
      </tbody>
    </table>
  );
};

// Table Row
const TableRow = ({
  item,
  formType,
  activeStep,
  answers,
  selectedDate,
  isScanned,
  onInputChange,
  onImageUpload,
}: {
  item: (typeof INSPECTION_ITEMS)[0];
  formType: FormType;
  activeStep: "laki" | "perempuan";
  answers: Record<string, string>;
  selectedDate: string;
  isScanned: boolean;
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const isSingleForm = formType === "wanita" || formType === "general";

  const renderCell = (prefix: string, variant: "male" | "female" | "wanita" | "general") => (
    <>
      <td className="cs-td">
        <select
          className={`cs-select cs-select--${variant}`}
          value={answers[`${prefix}_hasil`] || ""}
          onChange={(e) => onInputChange(`${prefix}_hasil`, e.target.value)}
          disabled={!isScanned}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        >
          <option value="">Pilih</option>
          <option value="OK">✓ OK</option>
          <option value="NG">✗ NG</option>
        </select>
      </td>
      <td className="cs-td">
        <textarea
          className="cs-textarea"
          value={answers[`${prefix}_keterangan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_keterangan`, e.target.value)}
          disabled={!isScanned}
          placeholder="Keterangan..."
          rows={2}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
        <input
          type="file"
          accept="image/*"
          className="cs-file-input"
          onChange={(e) => onImageUpload(`${prefix}_foto`, e)}
          disabled={!isScanned}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
        {answers[`${prefix}_foto`] && (
          <div className="cs-foto-preview">
            <img src={answers[`${prefix}_foto`]} alt="Foto temuan" />
          </div>
        )}
      </td>
      <td className="cs-td">
        <textarea
          className="cs-textarea"
          value={answers[`${prefix}_tindakan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_tindakan`, e.target.value)}
          disabled={!isScanned}
          placeholder="Tindakan..."
          rows={2}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
      </td>
      <td className="cs-td">
        <input
          type="text"
          className={`cs-input-text cs-input-text--${variant}`}
          value={answers[`${prefix}_pic`] || ""}
          disabled
        />
      </td>
    </>
  );

  return (
    <tr>
      <td className="cs-td--no cs-td--item cs-td">{item.no}</td>
      <td className="cs-td--item">{item.item}</td>
      {isSingleForm
        ? renderCell(item.key, formType)
        : activeStep === "laki"
          ? renderCell(`${item.key}_L`, "male")
          : renderCell(`${item.key}_P`, "female")
      }
    </tr>
  );
};

// Mobile Card (used on small screens instead of table)
const MobileCard = ({
  item,
  formType,
  activeStep,
  answers,
  selectedDate,
  isScanned,
  onInputChange,
  onImageUpload,
}: {
  item: (typeof INSPECTION_ITEMS)[0];
  formType: FormType;
  activeStep: "laki" | "perempuan";
  answers: Record<string, string>;
  selectedDate: string;
  isScanned: boolean;
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const isSingleForm = formType === "wanita" || formType === "general";

  const renderFields = (prefix: string, variant: "male" | "female" | "wanita" | "general") => (
    <div className="cs-mobile-fields">
      <div>
        <div className="cs-mobile-field-label">Hasil Pemeriksaan</div>
        <select
          className={`cs-select cs-select--${variant}`}
          value={answers[`${prefix}_hasil`] || ""}
          onChange={(e) => onInputChange(`${prefix}_hasil`, e.target.value)}
          disabled={!isScanned}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        >
          <option value="">Pilih</option>
          <option value="OK">✓ OK</option>
          <option value="NG">✗ NG</option>
        </select>
      </div>

      <div>
        <div className="cs-mobile-field-label">Keterangan + Foto</div>
        <textarea
          className="cs-textarea"
          value={answers[`${prefix}_keterangan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_keterangan`, e.target.value)}
          disabled={!isScanned}
          placeholder="Keterangan temuan..."
          rows={2}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
        <input
          type="file"
          accept="image/*"
          className="cs-file-input"
          onChange={(e) => onImageUpload(`${prefix}_foto`, e)}
          disabled={!isScanned}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
        {answers[`${prefix}_foto`] && (
          <div className="cs-foto-preview">
            <img src={answers[`${prefix}_foto`]} alt="Foto temuan" />
          </div>
        )}
      </div>

      <div>
        <div className="cs-mobile-field-label">Tindakan Perbaikan</div>
        <textarea
          className="cs-textarea"
          value={answers[`${prefix}_tindakan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_tindakan`, e.target.value)}
          disabled={!isScanned}
          placeholder="Tindakan yang dilakukan..."
          rows={2}
          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
        />
      </div>

      <div>
        <div className="cs-mobile-field-label">PIC</div>
        <input
          type="text"
          className={`cs-input-text cs-input-text--${variant}`}
          value={answers[`${prefix}_pic`] || ""}
          disabled
        />
      </div>
    </div>
  );

  const getGenderLabel = () => {
    if (formType === "wanita") {
      return <div className="cs-mobile-gender-title cs-mobile-gender-title--wanita">🚺 Wanita</div>;
    } else if (formType === "general") {
      return <div className="cs-mobile-gender-title cs-mobile-gender-title--general">🚻 Umum</div>;
    } else {
      return activeStep === "laki"
        ? <div className="cs-mobile-gender-title cs-mobile-gender-title--male">🚹 Laki-laki</div>
        : <div className="cs-mobile-gender-title cs-mobile-gender-title--female">🚺 Perempuan</div>;
    }
  };

  const prefix = isSingleForm ? item.key : activeStep === "laki" ? `${item.key}_L` : `${item.key}_P`;
  const variant: "male" | "female" | "wanita" | "general" = isSingleForm ? formType : activeStep === "laki" ? "male" : "female";

  return (
    <div className="cs-mobile-card">
      <div className="cs-mobile-card-header">
        <div className="cs-mobile-card-no">{item.no}</div>
        <div className="cs-mobile-card-item">{item.item}</div>
      </div>
      <div className="cs-mobile-gender-block">
        {getGenderLabel()}
        {renderFields(prefix, variant)}
      </div>
    </div>
  );
};