// app/status-ga/inspeksi-apd/GaInspeksiApdContent.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
// ✅ Import API helper yang reusable
import {
  getAreasByType,
  getAvailableDates,
  getChecklistByDate,
  getItemsByType,
  ChecklistItem
} from "@/lib/api/checksheet";

interface Area {
  id: number;
  no: number;
  name: string;
  location: string;
}

export function GaInspeksiApdContent() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();

  // ✅ FIX: Use native URL API instead of useSearchParams hook to avoid conflicts
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  const openArea = getQueryParam('openArea');
  const TYPE_SLUG = 'inspeksi-apd';

  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Produksi");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [checksheetData, setChecksheetData] = useState<any>(null);

  // ✅ CHANGED: Store ALL items untuk filtering
  const [allItems, setAllItems] = useState<ChecklistItem[]>([]);
  const [currentAreaItems, setCurrentAreaItems] = useState<ChecklistItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  // ✅ Load ALL inspection items dari API (sekali saja)
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setAllItems(items);
        console.log('📋 Loaded', items.length, 'total items for filtering');
      } catch (error) {
        console.error("Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, []);

  // ✅ Load areas dari API
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        console.log('✅ Loaded areas:', data);
        setAreas(data);
      } catch (error) {
        console.error("Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // ✅ Load status untuk semua area
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses || !authVerified) return;

    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);

      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);

          if (dates.length > 0) {
            const latest = dates[0];
            statusMap[area.id] = {
              statusLabel: "Checked",
              statusColor: "#43a047",
              lastCheck: new Date(latest).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short"
              })
            };
          } else {
            statusMap[area.id] = {
              statusLabel: "No Data",
              statusColor: "#757575",
              lastCheck: "-"
            };
          }
        } catch (error) {
          console.error(`Error loading status for area ${area.id}:`, error);
          statusMap[area.id] = {
            statusLabel: "Error",
            statusColor: "#f44336",
            lastCheck: "-"
          };
        }
      }

      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };

    loadAllStatuses();
  }, [areas, authVerified]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Authentication verification
  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) {
      setAuthVerified(false);
      return;
    }

    if (user && isAuthorizedForChecksheet(user)) {
      setAuthVerified(true);
      return;
    }

    const verificationTimeout = setTimeout(() => {
      if (!user || !isAuthorizedForChecksheet(user)) {
        router.push("/login-page");
      } else {
        setAuthVerified(true);
      }
    }, 1500);

    return () => clearTimeout(verificationTimeout);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Auto-open modal jika ada openArea param
  useEffect(() => {
    if (!isMounted || !authVerified || !openArea || areas.length === 0) return;

    console.log('🔍 Searching for area to auto-open:', openArea);
    const found = areas.find((item) => {
      // ✅ Handle both ○ and TAB as separator
      const parts = item.name.includes(' ○ ')
        ? item.name.split(' ○ ')
        : item.name.split('\t');
      return parts[0]?.trim() === openArea;
    });

    if (found) {
      console.log('✅ Found area, opening detail:', found.name);
      setTimeout(() => openDetail(found), 300);
    }
  }, [isMounted, authVerified, openArea, areas]);

  // ✅ CHANGED: Filter items berdasarkan area SEBELUM load data
  const filterItemsForArea = (area: Area): ChecklistItem[] => {
    // ✅ Handle both ○ and TAB as separator
    const parts = area.name.includes(' ○ ')
      ? area.name.split(' ○ ')
      : area.name.split('\t');
    const areaBaseName = parts[0]?.trim() || '';

    console.log('🔍 Filtering items for area:', areaBaseName);

    // Filter by area number from item_key
    const areaNo = area.no;
    const expectedPrefix = `AREA${areaNo.toString().padStart(2, '0')}_`;

    const matchedProses = allItems.find(item => {
      if (item.item_group !== 'PROSES') return false;
      return item.item_key.startsWith(expectedPrefix);
    });

    if (!matchedProses) {
      console.warn('⚠️ No matching PROSES found for area:', areaBaseName);
      return [];
    }

    console.log('✅ Matched PROSES:', matchedProses.item_check, matchedProses.item_key);

    // Get all items for this area (PROSES + its APD items)
    const filteredItems = allItems.filter(item =>
      item.item_key.startsWith(expectedPrefix)
    );

    console.log('✅ Filtered to', filteredItems.length, 'items for area:', area.name);

    return filteredItems;
  };

  // ✅ CHANGED: Open detail dengan filter items dulu
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);

    try {
      // ✅ Filter items for this specific area
      const areaItems = filterItemsForArea(area);
      setCurrentAreaItems(areaItems);

      if (areaItems.length === 0) {
        console.warn('⚠️ No items found for area:', area.name);
        setChecksheetData(null);
        setIsLoading(false);
        return;
      }

      // Load available dates untuk area ini
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);

      // Set tanggal terbaru sebagai default
      if (dates.length > 0) {
        const latestDate = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        setSelectedDate(latestDate);

        // Load data untuk tanggal terbaru dengan items yang sudah di-filter
        await loadDateData(area.id, latestDate, areaItems);
      } else {
        setChecksheetData(null);
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      setChecksheetData(null);
      setAvailableDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CHANGED: Load data dengan parameter items
  const loadDateData = async (areaId: number, date: string, items?: ChecklistItem[]) => {
    setIsLoading(true);

    // Use provided items or current area items
    const itemsToUse = items || currentAreaItems;

    try {
      const data = await getChecklistByDate(TYPE_SLUG, areaId, date);

      if (data && itemsToUse.length > 0) {
        // Transform data untuk display
        const rows: any[] = [];

        // Get proses items (should be multiple for this area)
        const prosesItems = itemsToUse.filter(item => item.item_group === 'PROSES');

        prosesItems.forEach(prosesItem => {
          const prosesData = data[prosesItem.item_key];
          let parsedNotes: any = {};
          try {
            if (prosesData?.notes) {
              parsedNotes = JSON.parse(prosesData.notes);
            }
          } catch (e) {
            console.error('Error parsing notes:', e);
          }

          // Add proses row
          rows.push({
            type: "proses",
            proses: prosesItem.item_check,
            r1: parsedNotes.r1 || "",
            r2: parsedNotes.r2 || "",
            r3: parsedNotes.r3 || "",
            r4: parsedNotes.r4 || "",
            r5: parsedNotes.r5 || "",
            r6: parsedNotes.r6 || "",
            persentaseOk: "",
            problem: prosesData?.keteranganTemuan || "",
            tindakanPerbaikan: prosesData?.tindakanPerbaikan || "",
            pic: prosesData?.pic || "",
            verify: prosesData?.verify || ""
          });

          // Find and add APD rows for this proses
          const apdItems = itemsToUse.filter(item => item.item_group === prosesItem.item_key);

          apdItems.forEach(apdItem => {
            const apdData = data[apdItem.item_key];
            let apdNotes: any = {};
            try {
              if (apdData?.notes) {
                apdNotes = JSON.parse(apdData.notes);
              }
            } catch (e) {
              console.error('Error parsing APD notes:', e);
            }

            rows.push({
              type: "apd",
              proses: apdItem.item_check,
              r1: apdNotes.r1 || "",
              r2: apdNotes.r2 || "",
              r3: apdNotes.r3 || "",
              r4: apdNotes.r4 || "",
              r5: apdNotes.r5 || "",
              r6: apdNotes.r6 || "",
              persentaseOk: apdData?.hasilPemeriksaan || "",
              problem: apdData?.keteranganTemuan || "",
              tindakanPerbaikan: apdData?.tindakanPerbaikan || "",
              pic: apdData?.pic || "",
              verify: apdData?.verify || ""
            });
          });
        });

        // Get inspector from first item
        const firstItemKey = Object.keys(data)[0];
        const inspector = data[firstItemKey]?.inspector || "";

        setChecksheetData({
          date: date,
          data: rows,
          inspector: inspector
        });
      } else {
        setChecksheetData(null);
      }

      console.log('Loaded data for date:', date);
    } catch (error) {
      console.error("Error loading date data:", error);
      setChecksheetData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle perubahan tanggal
  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedArea && newDate) {
      await loadDateData(selectedArea.id, newDate);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setAvailableDates([]);
    setSelectedDate("");
    setCurrentAreaItems([]);
    setShowModal(false);
  };

  // Filter areas berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    // ✅ Handle both ○ and TAB as separator
    const parts = item.name.includes(' ○ ')
      ? item.name.split(' ○ ')
      : item.name.split('\t');
    const areaName = parts[0]?.trim() || '';
    const areaType = parts[1]?.trim() || '';
    const matchCategory = areaType === selectedCategory;
    const matchSearch = areaName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ✅ Loading screen
  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>
            {authLoading ? "Loading authentication..." : "Verifying session..."}
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingBottom: "32px",
        paddingTop: "32px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <div style={{ marginBottom: "28px" }} className="header">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18} /> Kembali
          </button>

          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{
              margin: "0 0 6px 0",
              color: "white",
              fontSize: "26px",
              fontWeight: "600",
              letterSpacing: "-0.5px"
            }}>
              🛡️ APD Inspection Dashboard
            </h1>
            <p style={{
              margin: 0,
              color: "#e3f2fd",
              fontSize: "14px",
              fontWeight: "400"
            }}>
              Monthly inspection schedule and maintenance records for Personal Protective Equipment
            </p>
          </div>
        </div>

        {/* Dropdown + Search */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end"
        }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="category-select" style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#424242"
            }}>
              Area Type:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            >
              <option value="Produksi">Produksi</option>
              <option value="Applicator">Applicator</option>
              <option value="QA">QA</option>
              <option value="Gudang">Gudang</option>
              <option value="Logistik">Logistik</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="search-input" style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#424242"
            }}>
              Search Area:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. GENBA, FINAL, WAREHOUSE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        {/* Loading Status Indicator */}
        {isLoadingStatuses && (
          <div style={{
            padding: "12px 20px",
            background: "#fff3cd",
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#856404",
            fontSize: "13px",
            textAlign: "center"
          }}>
            ⏳ Loading status data...
          </div>
        )}

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Area Name</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#9e9e9e" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: "500" }}>
                        {searchTerm ? 'No areas found matching your search' : 'No areas available for this category'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((area, idx) => {
                    // ✅ Handle both ○ and TAB as separator
                    const parts = area.name.includes(' ○ ')
                      ? area.name.split(' ○ ')
                      : area.name.split('\t');
                    const areaName = parts[0]?.trim() || '';
                    const areaType = parts[1]?.trim() || '';

                    const status = areaStatuses[area.id] || {
                      statusLabel: "Loading...",
                      statusColor: "#757575",
                      lastCheck: "-"
                    };

                    return (
                      <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                        <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{areaName}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{areaType}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{
                              padding: "4px 12px",
                              background: status.statusColor,
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "inline-block"
                            }}>
                              {status.statusLabel}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openDetail(area)}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "5px",
                                fontSize: "13px",
                                fontWeight: "500",
                                background: "#1976d2",
                                color: "white",
                                border: "none",
                                cursor: "pointer"
                              }}
                            >
                              View
                            </button>
                            <a
                              href={`/e-checksheet-ga/e-checksheet-ins-apd?areaId=${area.id}&areaName=${encodeURIComponent(areaName)}&areaType=${encodeURIComponent(areaType)}`}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "5px",
                                fontSize: "13px",
                                fontWeight: "500",
                                background: "#43a047",
                                color: "white",
                                textDecoration: "none",
                                display: "inline-block"
                              }}
                            >
                              Inspect
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {showModal && selectedArea && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "95%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#f5f5f5",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <div>
                  <h2 style={{
                    margin: "0 0 4px 0",
                    color: "#212121",
                    fontSize: "20px",
                    fontWeight: "600"
                  }}>
                    Inspection History - {selectedArea.name.includes(' ○ ')
                      ? selectedArea.name.split(' ○ ')[0]
                      : selectedArea.name.split('\t')[0]?.trim()}
                  </h2>
                  <p style={{
                    margin: "0",
                    color: "#616161",
                    fontSize: "14px"
                  }}>
                    {selectedArea.name.includes(' ○ ')
                      ? selectedArea.name.split(' ○ ')[1]
                      : selectedArea.name.split('\t')[1]?.trim()} • {currentAreaItems.filter(i => i.item_group !== 'PROSES').length} APD Items
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    color: "#757575",
                    padding: "0",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                padding: "16px 24px",
                background: "white",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <label style={{
                  fontWeight: "500",
                  color: "#424242",
                  marginRight: "12px",
                  fontSize: "14px"
                }}>
                  Inspection Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    color: "#212121",
                    padding: "7px 12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "160px",
                    outline: "none"
                  }}
                >
                  <option value="">Select date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                padding: "24px",
                overflowY: "auto",
                flex: 1,
                background: "#fafafa"
              }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Loading data...</p>
                  </div>
                ) : !checksheetData ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>
                      {!selectedDate ? 'Please select an inspection date' : 'No inspection records found'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                      minWidth: "1600px",
                      border: "1px solid #e0e0e0",
                      background: "white"
                    }}>
                      <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "4%"
                          }}>NO</th>
                          <th style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "12%"
                          }}>PROSES</th>
                          <th rowSpan={2} colSpan={6} style={{
                            padding: "8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "30%"
                          }}>NO. MESIN/NIK</th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "8%"
                          }}>PROSENTASE OK</th>
                          <th rowSpan={2} colSpan={4} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "16%"
                          }}>PROBLEM</th>
                          <th rowSpan={2} colSpan={4} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "16%"
                          }}>TINDAKAN PERBAIKAN</th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "8%"
                          }}>PIC</th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "8%"
                          }}>VERIFY</th>
                        </tr>
                        <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                          <th style={{
                            padding: "10px 8px",
                            border: "1px solid #ddd",
                            fontWeight: "600",
                            textAlign: "center",
                            width: "18%"
                          }}>STANDART APD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checksheetData.data.map((row: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                              fontWeight: "600",
                              background: row.type === "proses" ? "#f5f5f5" : "white"
                            }}>
                              {idx + 1}
                            </td>
                            <td style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "left",
                              fontWeight: row.type === "proses" ? "600" : "normal",
                              background: row.type === "proses" ? "#f5f5f5" : "white"
                            }}>
                              {row.proses || "-"}
                            </td>
                            {[...Array(6)].map((_, i) => {
                              const val = row[`r${i + 1}`] || "";
                              return (
                                <td key={i} style={{
                                  padding: "6px",
                                  border: "1px solid #ddd",
                                  textAlign: "center",
                                  background: "white"
                                }}>
                                  {val}
                                </td>
                              );
                            })}
                            <td style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                              background: "white"
                            }}>
                              {row.persentaseOk || "-"}
                            </td>
                            <td colSpan={4} style={{
                              padding: "6px",
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.problem || "-"}
                            </td>
                            <td colSpan={4} style={{
                              padding: "6px",
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.tindakanPerbaikan || "-"}
                            </td>
                            <td style={{
                              padding: "6px",
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.pic || "-"}
                            </td>
                            <td style={{
                              padding: "6px",
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.verify || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{
                      marginTop: "20px",
                      padding: "16px",
                      background: "#f9f9f9",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0"
                    }}>
                      <p style={{
                        margin: "0 0 4px 0",
                        fontSize: "12px",
                        color: "#757575"
                      }}>Inspector</p>
                      <p style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#424242"
                      }}>
                        {checksheetData.inspector || "N/A"}
                      </p>
                      <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "12px",
                        color: "#757575"
                      }}>Inspection Date</p>
                      <p style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#424242"
                      }}>
                        {new Date(checksheetData.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: "16px 24px",
                background: "#f5f5f5",
                borderTop: "1px solid #e0e0e0",
                textAlign: "right"
              }}>
                <button
                  onClick={closeDetail}
                  style={{
                    padding: "9px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Close
                </button>
              </div>

              <style jsx>{`
                @media (max-width: 1200px) {
                  div[style*="paddingLeft"] {
                    padding-left: 80px !important;
                  }
                }

                @media (max-width: 768px) {
                  div[style*="paddingLeft"] {
                    padding-left: 25px !important;
                    padding-right: 15px !important;
                    padding-top: 20px !important;
                    padding-bottom: 20px !important;
                  }

                  div[style*="gridTemplateColumns"] {
                    grid-template-columns: 1fr !important;
                    gap: 8px !important;
                  }

                  h1 {
                    font-size: 20px !important;
                    margin-bottom: 6px !important;
                  }

                  p {
                    font-size: 12px !important;
                  }

                  table {
                    font-size: 12px !important;
                    min-width: 600px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }

                  table th,
                  table td {
                    padding: 8px 6px !important;
                    border: 1px solid #ddd !important;
                  }

                  input[type="search"],
                  input[type="text"],
                  select {
                    font-size: 14px !important;
                    min-height: 36px !important;
                    width: 100% !important;
                    padding: 8px 8px !important;
                  }

                  button {
                    font-size: 13px !important;
                    min-height: 36px !important;
                    padding: 8px 12px !important;
                  }

                  div[style*="display: flex"] {
                    flex-direction: column !important;
                    gap: 10px !important;
                  }
                }

                @media (max-width: 480px) {
                  div[style*="paddingLeft"] {
                    padding-left: 15px !important;
                    padding-right: 12px !important;
                    padding-top: 16px !important;
                    padding-bottom: 16px !important;
                  }

                  h1 {
                    font-size: 18px !important;
                    margin-bottom: 4px !important;
                  }

                  p {
                    font-size: 11px !important;
                  }

                  table {
                    font-size: 10px !important;
                    min-width: 500px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }

                  table th,
                  table td {
                    padding: 6px 4px !important;
                    border: 1px solid #ddd !important;
                  }

                  input[type="search"],
                  input[type="text"],
                  select {
                    font-size: 14px !important;
                    min-height: 34px !important;
                    width: 100% !important;
                    padding: 6px 6px !important;
                  }

                  button {
                    font-size: 12px !important;
                    min-height: 40px !important;
                    padding: 8px 10px !important;
                    width: 100% !important;
                  }

                  div[style*="display: flex"] {
                    flex-direction: column !important;
                    gap: 8px !important;
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}