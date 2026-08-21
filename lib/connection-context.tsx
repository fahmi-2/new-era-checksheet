// lib/connection-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getPendingCount, PendingSync } from './offline-db';
import { syncQueue } from './sync-manager';

interface ConnectionState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

interface ConnectionContextType extends ConnectionState {
  refreshPendingCount: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // ─── Deteksi status online/offline ───
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 [Connection] Online');
      setIsOnline(true);
      // Auto-sync saat online
      triggerSync();
    };

    const handleOffline = () => {
      console.log('🔴 [Connection] Offline');
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Polling pending count setiap 5 detik ───
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // ─── Trigger sync manual ───
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncQueue();
      setLastSyncTime(Date.now());
      await refreshPendingCount();
    } catch (err) {
      console.error('❌ Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncTime,
        refreshPendingCount,
        triggerSync,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}