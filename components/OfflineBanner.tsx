// components/OfflineBanner.tsx
"use client";
import { useConnection } from '@/lib/connection-context';
import { WifiOff, Wifi, RefreshCw, CloudUpload } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useConnection();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '10px 16px',
        background: isOnline
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      {isOnline ? (
        <>
          <CloudUpload size={18} />
          <span>{pendingCount} data menunggu sync</span>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: isSyncing ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Sekarang'}
          </button>
        </>
      ) : (
        <>
          <WifiOff size={18} />
          <span>Mode Offline — Data akan otomatis tersimpan</span>
          <span style={{ opacity: 0.85, fontSize: '12px' }}>
            ({pendingCount} antrian)
          </span>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}