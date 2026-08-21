// components/ConnectionStatus.tsx
"use client";
import { useConnection } from '@/lib/connection-context';

export function ConnectionStatus() {
  const { isOnline, pendingCount } = useConnection();

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9998,
        padding: '6px 12px',
        borderRadius: '20px',
        background: isOnline ? '#10b981' : '#dc2626',
        color: 'white',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
      {isOnline ? 'Online' : 'Offline'}
      {pendingCount > 0 && (
        <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 10 }}>
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