// lib/offline-db.ts
import Dexie, { Table } from 'dexie';

// ─── TIPE DATA ────────────────────────────────────────
export interface PendingSync {
  id?: number;
  queueId: string;         // UUID unik
  type: 'toilet' | 'apar' | 'fire_alarm' | 'lift' | 'apd' | string;
  endpoint: string;        // URL API tujuan
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: number;       // timestamp
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedData {
  id?: string;             // key
  data: any;
  timestamp: number;
  ttl: number;             // time-to-live dalam ms
}

// ─── DATABASE CLASS ───────────────────────────────────
class OfflineDB extends Dexie {
  pendingSync!: Table<PendingSync, number>;
  cachedData!: Table<CachedData, string>;

  constructor() {
    super('EChecksheetOfflineDB');
    
    this.version(1).stores({
      pendingSync: '++id, queueId, type, status, createdAt',
      cachedData: 'id, timestamp',
    });
  }
}

export const db = new OfflineDB();

// ─── HELPER FUNCTIONS ─────────────────────────────────

/** Tambah ke antrian sync */
export async function addToSyncQueue(item: Omit<PendingSync, 'id' | 'createdAt' | 'retryCount' | 'status'>) {
  const record: PendingSync = {
    ...item,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };
  const id = await db.pendingSync.add(record);
  console.log(`📥 [Offline Queue] Ditambahkan: ${item.type} (${item.endpoint})`);
  return id;
}

/** Ambil semua antrian pending */
export async function getPendingQueue() {
  return db.pendingSync.where('status').equals('pending').sortBy('createdAt');
}

/** Hitung jumlah pending */
export async function getPendingCount() {
  return db.pendingSync.where('status').equals('pending').count();
}

/** Hapus dari queue setelah sukses sync */
export async function removeFromQueue(id: number) {
  await db.pendingSync.delete(id);
  console.log(`✅ [Offline Queue] Dihapus ID: ${id}`);
}

/** Update status jadi failed */
export async function markAsFailed(id: number, error: string, retryCount: number) {
  await db.pendingSync.update(id, {
    status: retryCount >= 3 ? 'failed' : 'pending',
    retryCount,
    lastError: error,
  });
}

/** Cache data untuk offline viewing */
export async function cacheData(key: string, data: any, ttlMs: number = 24 * 60 * 60 * 1000) {
  await db.cachedData.put({
    id: key,
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/** Ambil cached data (jika belum expired) */
export async function getCachedData(key: string): Promise<any | null> {
  const cached = await db.cachedData.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > cached.ttl) {
    await db.cachedData.delete(key);
    return null;
  }
  return cached.data;
}

/** Hapus semua cache */
export async function clearCache() {
  await db.cachedData.clear();
}