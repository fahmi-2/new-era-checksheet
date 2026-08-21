"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

type PreventiveHistoryEntry = {
  id: string;
  date: string;
  inspector: string;
  items: Record<string, any>;
  additionalNotes?: string;
  created_at: string;
  updated_at?: string;
};

export default function RiwayatPreventivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const [history, setHistory] = useState<PreventiveHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PreventiveHistoryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<number, { status: string; keterangan?: string; foto_path?: string }>>({});
  const [editAdditionalNotes, setEditAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (redirected) return;
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
      return;
    }

    loadHistory();
  }, [user, router, redirected]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/e-checksheet-ga/api/lift-barang/preventive');
      const result = await response.json();

      if (response.ok && result.success) {
        // Sort by date descending
        const sortedHistory = result.data.sort((a: PreventiveHistoryEntry, b: PreventiveHistoryEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setHistory(sortedHistory);
        setFilteredHistory(sortedHistory);
      } else {
        setError(result.message || "Gagal memuat riwayat");
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Terjadi kesalahan saat memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  // Filter berdasarkan tanggal
  useEffect(() => {
    if (!selectedDate) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(entry => entry.date === selectedDate);
      setFilteredHistory(filtered);
    }
  }, [selectedDate, history]);

  // Dalam fungsi handleEditStart
const handleEditStart = (entry: PreventiveHistoryEntry) => {
  setEditingId(entry.id || "");
  
  // Transform items structure for edit form
  const transformedItems: Record<number, { status: string; keterangan?: string; foto_path?: string }> = {};
  
  // Dengan struktur data baru
  Object.entries(entry.items).forEach(([id, item]) => {
    transformedItems[Number(id)] = {
      status: item.status,
      keterangan: item.keterangan || '',
      foto_path: item.foto_path || ''
    };
  });
  
  setEditFormData(transformedItems);
  setEditAdditionalNotes(entry.additionalNotes || "");
};

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
    setEditAdditionalNotes("");
  };

  const handleEditFieldChange = (id: number, field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleEditSave = async () => {
    // Validasi semua field terisi untuk status NG
    const ngItems = Object.entries(editFormData).filter(([_, data]) => data.status === "NG");
    for (const [id, data] of ngItems) {
      if (!data.keterangan?.trim()) {
        alert(`❗ Keterangan wajib diisi untuk item "${getCheckItemName(parseInt(id))}" yang berstatus NG.`);
        return;
      }
    }

    if (!editingId) return;

    try {
      setLoading(true);

      // Transform edit data to API format
      const itemsToUpdate: Record<number, any> = {};
      Object.entries(editFormData).forEach(([key, value]) => {
        const id = parseInt(key);
        itemsToUpdate[id] = {
          status: value.status,
          keterangan: value.keterangan || '',
          foto_path: value.foto_path || null
        };
      });

      const updateData = {
        items: itemsToUpdate,
        additional_notes: editAdditionalNotes.trim()
      };

      const response = await fetch(`/e-checksheet-ga/api/lift-barang/preventive/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Reload history after update
        await loadHistory();
        alert("✅ Data berhasil diperbarui!");
        handleEditCancel();
      } else {
        alert(`❌ Gagal memperbarui data: ${result.message || 'Error tidak diketahui'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert("❌ Terjadi kesalahan saat memperbarui data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      setLoading(true);

      const response = await fetch(`/e-checksheet-ga/api/lift-barang/preventive/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Reload history after delete
        await loadHistory();
        alert("✅ Data berhasil dihapus!");
      } else {
        alert(`❌ Gagal menghapus data: ${result.message || 'Error tidak diketahui'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert("❌ Terjadi kesalahan saat menghapus data");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;
  if (!isAuthorizedForChecksheet(user)) return null;

  if (loading && !error) {
    return (
      <div className="app-page">
        <Sidebar userName={user.fullName} />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat riwayat...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
          }
          .spinner {
            border: 4px solid rgba(30, 136, 229, 0.2);
            border-top: 4px solid #1e88e5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          p {
            color: #555;
            font-size: 1.1rem;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page">
        <Sidebar userName={user.fullName} />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={loadHistory} className="retry-btn">Coba Lagi</button>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            padding: 24px;
          }
          .error-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            color: #f44336;
          }
          p {
            color: #555;
            font-size: 1.2rem;
            margin-bottom: 24px;
            max-width: 600px;
          }
          .retry-btn {
            padding: 10px 24px;
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .retry-btn:hover {
            background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-section">
          <button onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/preventif")} className="btn-back">← Kembali ke Menu</button>
          <h1>🔧 Riwayat Preventive Lift Barang</h1>
        </div>

        {/* Filter Tanggal */}
        <div className="filter-section">
          <label htmlFor="date-filter">Filter berdasarkan tanggal:</label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-filter"
          >
            <option value="">Semua Tanggal</option>
            {[...new Set(history.map(entry => entry.date))].sort().reverse().map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="empty-message">Tidak ada riwayat preventive maintenance{selectedDate ? ` pada tanggal ${new Date(selectedDate).toLocaleDateString('id-ID')}` : ''}.</p>
        ) : (
          <div className="history-list">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="history-card">
                {editingId === entry.id ? (
                  // EDIT MODE
                  <div className="edit-mode">
                    <div className="card-header">
                      <h3>Edit Data - Tanggal: {new Date(entry.date).toLocaleDateString('id-ID')}</h3>
                      <p>Inspector: {entry.inspector}</p>
                    </div>

                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Check Item</th>
                          <th>Status</th>
                          <th>Keterangan</th>
                          <th>Foto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map(id => (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{getCheckItemName(id)}</td>
                            <td>
                              <div className="radio-group">
                                <label>
                                  <input
                                    type="radio"
                                    name={`edit-status-${id}`}
                                    checked={editFormData[id]?.status === "OK"}
                                    onChange={() => handleEditFieldChange(id, "status", "OK")}
                                  /> OK
                                </label>
                                <label>
                                  <input
                                    type="radio"
                                    name={`edit-status-${id}`}
                                    checked={editFormData[id]?.status === "NG"}
                                    onChange={() => handleEditFieldChange(id, "status", "NG")}
                                  /> NG
                                </label>
                              </div>
                            </td>
                            <td>
                              <textarea
                                value={editFormData[id]?.keterangan || ""}
                                onChange={(e) => handleEditFieldChange(id, "keterangan", e.target.value)}
                                className="edit-textarea"
                                placeholder={editFormData[id]?.status === "NG" ? "Wajib diisi untuk NG" : "Opsional"}
                              />
                            </td>
                            <td>
                              {editFormData[id]?.foto_path ? (
                                <div className="image-preview">
                                  <img 
                                    src={getPhotoUrl(editFormData[id].foto_path)} 
                                    alt="Foto preventive" 
                                    className="preview-image" 
                                  />
                                </div>
                              ) : (
                                <span className="no-photos">Tidak ada foto</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="additional-notes edit-mode-notes">
                      <h4>📝 Saran & Temuan Tambahan:</h4>
                      <textarea
                        value={editAdditionalNotes}
                        onChange={(e) => setEditAdditionalNotes(e.target.value)}
                        className="edit-textarea full"
                        placeholder="Opsional"
                      />
                    </div>

                    <div className="edit-actions">
                      <button onClick={handleEditCancel} className="btn-cancel" disabled={loading}>Batal</button>
                      <button onClick={handleEditSave} className="btn-save" disabled={loading}>
                        {loading ? 'Menyimpan...' : '✅ Simpan Perubahan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <>
                    <div className="card-header">
                      <h3>Tanggal: {new Date(entry.date).toLocaleDateString('id-ID')}</h3>
                      <p>Inspector: {entry.inspector}</p>
                      <p className="timestamp">Dibuat: {new Date(entry.created_at).toLocaleString('id-ID')}</p>
                      {entry.updated_at && (
                        <p className="timestamp updated">Diperbarui: {new Date(entry.updated_at).toLocaleString('id-ID')}</p>
                      )}
                    </div>

                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Check Item</th>
                          <th>Status</th>
                          <th>Keterangan</th>
                          <th>Foto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items && typeof entry.items === 'object' ? (
                          Object.entries(entry.items).map(([id, data]) => {
                            const status = (data as any)?.status || '-';
                            const keterangan = (data as any)?.keterangan || (data as any)?.catatan || '-';
                            const foto_path = (data as any)?.foto_path;
                            
                            return (
                              <tr key={id}>
                                <td>{id}</td>
                                <td>{getCheckItemName(Number(id))}</td>
                                <td className={status === "NG" ? "status-ng-cell" : "status-ok-cell"}>
                                  {status}
                                </td>
                                <td>{keterangan || '-'}</td>
                                <td>
                                  {foto_path ? (
                                    <div className="image-preview">
                                      <img 
                                        src={getPhotoUrl(foto_path)} 
                                        alt={`Foto item ${id}`} 
                                        className="preview-image" 
                                        onClick={() => window.open(getPhotoUrl(foto_path), '_blank')}
                                      />
                                    </div>
                                  ) : (
                                    <span className="no-photos">Tidak ada foto</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>
                              Tidak ada data item
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {entry.additionalNotes && (
                      <div className="additional-notes">
                        <h4>📝 Saran & Temuan Tambahan:</h4>
                        <p>{entry.additionalNotes}</p>
                      </div>
                    )}

                    <div className="card-actions">
                      <button onClick={() => handleEditStart(entry)} className="btn-edit" disabled={loading}>✏️ Edit</button>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="btn-delete" disabled={loading}>🗑️ Hapus</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .btn-back {
          padding: 10px 16px;
          background: white;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
        }
        .btn-back:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }

        .header-section h1 {
          color: #0277bd;
          margin: 0;
          flex: 1;
          text-align: center;
        }
        
        /* Filter Section */
        .filter-section {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-section label {
          font-weight: 600;
          color: #555;
        }
        .date-filter {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: white;
          min-width: 200px;
          font-size: 0.95rem;
        }

        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px 20px;
          font-size: 1.1rem;
          background: #f9f9f9;
          border-radius: 8px;
          margin-top: 24px;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .history-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: transform 0.2s;
        }
        .history-card:hover {
          transform: translateY(-2px);
        }
        .card-header {
          background: #e3f2fd;
          padding: 16px 24px;
          border-bottom: 1px solid #bbdefb;
        }
        .card-header h3 {
          margin: 0 0 8px;
          color: #0d47a1;
          font-size: 1.25rem;
        }
        .card-header p {
          margin: 4px 0;
          color: #546e7a;
          font-size: 0.95rem;
        }
        .timestamp {
          margin: 2px 0;
          color: #666;
          font-size: 0.85rem;
        }
        .timestamp.updated {
          color: #1565c0;
          font-weight: 500;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
        }
        .history-table th,
        .history-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .history-table th {
          background: #f5fbff;
          font-weight: 600;
          color: #01579b;
        }
        .status-ok-cell {
          color: #2e7d32;
          font-weight: 600;
        }
        .status-ng-cell {
          color: #c62828;
          font-weight: 600;
        }
        .additional-notes {
          padding: 16px 24px;
          background: #f9f9f9;
          border-top: 1px solid #eee;
        }
        .additional-notes h4 {
          margin: 0 0 8px;
          color: #01579b;
        }
        .additional-notes p {
          margin: 0;
          color: #555;
          line-height: 1.6;
        }

        /* Edit Mode Styles */
        .edit-mode {
          padding: 24px;
        }
        .edit-mode .card-header {
          background: #fff8e1;
          padding: 16px;
          margin: -24px -24px 20px -24px;
          border-bottom: 2px solid #ffc107;
        }
        .radio-group {
          display: flex;
          gap: 12px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .edit-textarea {
          width: 100%;
          min-height: 60px;
          padding: 8px 12px;
          border: 2px solid #bbdefb;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
        }
        .edit-textarea:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }
        .edit-textarea.full {
          min-height: 100px;
        }
        .edit-mode-notes {
          margin: 20px 0;
          background: #fff8e1;
          border-left: 4px solid #ffc107;
          padding-left: 16px;
        }
        .edit-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-cancel, .btn-save {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          min-width: 120px;
        }
        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }
        .btn-cancel:hover:not(:disabled) {
          background: #e0e0e0;
        }
        .btn-save {
          background: #4caf50;
          color: white;
        }
        .btn-save:hover:not(:disabled) {
          background: #45a049;
        }
        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Card Actions */
        .card-actions {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          background: #f5f5f5;
          border-top: 1px solid #eee;
        }
        .btn-edit, .btn-delete {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
          transition: all 0.3s;
        }
        .btn-edit {
          background: #1e88e5;
          color: white;
        }
        .btn-edit:hover:not(:disabled) {
          background: #1565c0;
        }
        .btn-delete {
          background: #f44336;
          color: white;
        }
        .btn-delete:hover:not(:disabled) {
          background: #da190b;
        }
        .btn-edit:disabled, .btn-delete:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Styling untuk foto */
        .image-preview {
          text-align: center;
          cursor: pointer;
        }
        .preview-image {
          max-width: 100px;
          max-height: 100px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .preview-image:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .no-photos {
          color: #999;
          font-style: italic;
          font-size: 0.85rem;
          display: block;
          text-align: center;
        }

        @media (max-width: 768px) {
          .header-section {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-section h1 {
            width: 100%;
            text-align: left;
            margin-top: 8px;
          }
          .history-table {
            font-size: 0.85rem;
          }
          .history-table th,
          .history-table td {
            padding: 8px 12px;
          }
          .card-actions {
            flex-direction: column;
          }
          .btn-edit, .btn-delete {
            width: 100%;
          }
          .preview-image {
            max-width: 70px;
            max-height: 70px;
          }
        }
      `}</style>
    </div>
  );
}

function getCheckItemName(id: number): string {
  const items: Record<number, string> = {
    1: "Hook Lift",
    2: "Sling / Wire Rope",
    3: "Holder Plate / Cantolan Hook",
    4: "Roda Penggerak naik turun",
    5: "Limit Switch",
  };
  return items[id] || `Item ${id}`;
}

// Fungsi untuk menangani URL foto dengan benar
function getPhotoUrl(path: string | undefined): string {
  if (!path) return '/placeholder-image.png';
  
  // Jika path sudah berupa URL lengkap, kembalikan saja
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Jika path dimulai dengan /, gunakan path tersebut
  if (path.startsWith('/')) {
    return path;
  }
  
  // Jika tidak, gunakan NEXT_PUBLIC_BASE_URL dengan penanganan trailing slash
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const hasTrailingSlash = baseUrl.endsWith('/');
  const basePath = hasTrailingSlash ? baseUrl : `${baseUrl}/`;
  
  return `${basePath}${path}`;
}