// lib/sync-manager.ts
import { db, getPendingQueue, removeFromQueue, markAsFailed } from './offline-db';

const MAX_RETRY = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Proses semua antrian sync dari IndexedDB ke server
 * @returns Object dengan jumlah success dan failed
 */
export async function syncQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getPendingQueue();
  
  if (queue.length === 0) {
    console.log('📭 [Sync] Queue kosong, tidak ada data untuk sync');
    return { success: 0, failed: 0 };
  }

  console.log(`🔄 [Sync] Memproses ${queue.length} item...`);
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      // Update status jadi syncing
      await db.pendingSync.update(item.id!, { status: 'syncing' });

      console.log(`📤 [Sync] Mengirim: ${item.type} ke ${item.endpoint}`);

      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Cek response dari server
      const result = await response.json();
      
      if (result.success === false) {
        throw new Error(result.message || 'Server mengembalikan error');
      }

      // Sukses → hapus dari queue
      await removeFromQueue(item.id!);
      success++;
      console.log(`✅ [Sync] Sukses: ${item.type} (Queue ID: ${item.queueId})`);

      // Delay kecil agar tidak membanjiri server
      await new Promise(r => setTimeout(r, 500));
      
    } catch (err: any) {
      console.error(`❌ [Sync] Gagal: ${item.type}`, err.message);
      
      const newRetryCount = item.retryCount + 1;
      await markAsFailed(item.id!, err.message, newRetryCount);
      failed++;

      // Jika masih bisa retry, tunggu sebelum lanjut ke item berikutnya
      if (newRetryCount < MAX_RETRY) {
        console.log(`⏳ [Sync] Retry ${newRetryCount}/${MAX_RETRY} dalam ${RETRY_DELAY_MS/1000} detik...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.warn(`⚠️ [Sync] Item ${item.queueId} gagal setelah ${MAX_RETRY}x retry`);
      }
    }
  }

  console.log(`🏁 [Sync] Selesai: ${success} sukses, ${failed} gagal`);
  
  // Tampilkan notifikasi jika ada yang gagal
  if (failed > 0) {
    console.warn(`⚠️ ${failed} data gagal di-sync. Silakan coba lagi nanti.`);
  }

  return { success, failed };
}

/**
 * Generate unique ID untuk queue item
 * Format: q_{timestamp}_{random}
 */
export function generateQueueId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `q_${timestamp}_${random}`;
}

/**
 * Cek apakah ada item yang sedang di-sync
 */
export async function isSyncing(): Promise<boolean> {
  const count = await db.pendingSync.where('status').equals('syncing').count();
  return count > 0;
}

/**
 * Reset semua item yang stuck di status 'syncing' kembali ke 'pending'
 * Berguna jika sync terputus di tengah jalan
 */
export async function resetStuckItems(): Promise<number> {
  const stuckItems = await db.pendingSync.where('status').equals('syncing').toArray();
  
  if (stuckItems.length === 0) {
    return 0;
  }

  console.log(`🔄 [Sync] Reset ${stuckItems.length} item stuck...`);
  
  for (const item of stuckItems) {
    await db.pendingSync.update(item.id!, { status: 'pending' });
  }

  return stuckItems.length;
}

/**
 * Hapus semua item yang sudah gagal (status = 'failed')
 */
export async function clearFailedItems(): Promise<number> {
  const failedItems = await db.pendingSync.where('status').equals('failed').toArray();
  
  if (failedItems.length === 0) {
    return 0;
  }

  console.log(`🗑️ [Sync] Menghapus ${failedItems.length} item gagal...`);
  
  for (const item of failedItems) {
    await db.pendingSync.delete(item.id!);
  }

  return failedItems.length;
}

/**
 * Dapatkan statistik queue
 */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}> {
  const pending = await db.pendingSync.where('status').equals('pending').count();
  const syncing = await db.pendingSync.where('status').equals('syncing').count();
  const failed = await db.pendingSync.where('status').equals('failed').count();
  
  return {
    pending,
    syncing,
    failed,
    total: pending + syncing + failed,
  };
}