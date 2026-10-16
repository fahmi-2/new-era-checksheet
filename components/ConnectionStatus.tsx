// components/ConnectionStatus.tsx
"use client";
import { useEffect, useState, useRef } from 'react';
import { useConnection } from '@/lib/connection-context';

export function ConnectionStatus() {
  const { isOnline, pendingCount } = useConnection();
  const [visible, setVisible] = useState(false);
  const prevOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Jika offline: selalu tampilkan notifikasi offline
    if (!isOnline) {
      setVisible(true);
      prevOnlineRef.current = false;
      return;
    }

    // Jika online:
    // Jika baru saja beralih dari offline -> online, atau ada pending sync yang aktif
    if (prevOnlineRef.current === false || pendingCount > 0) {
      setVisible(true);
      // Notifikasi online muncul beberapa detik saja (misal 3.5 detik) lalu close pop-up
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3500);
      prevOnlineRef.current = true;
      return () => clearTimeout(timer);
    }

    // Kondisi inisial saat aplikasi pertama buka dan sudah online tanpa antrian
    if (prevOnlineRef.current === null) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      prevOnlineRef.current = true;
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        padding: '6px 14px',
        borderRadius: '20px',
        background: isOnline ? '#10b981' : '#dc2626',
        color: 'white',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'white',
          animation: isOnline ? 'none' : 'pulse 1.5s infinite',
        }}
      />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      {pendingCount > 0 && (
        <span style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: 10 }}>
          {pendingCount}
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}