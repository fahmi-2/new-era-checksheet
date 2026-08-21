// app/status-ga/selang-hydrant/page.tsx
import { Suspense } from 'react';
import { GaSelangHydrantContent } from './GaSelangHydrantContent';

export default function GaSelangHydrantPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
        fontSize: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px', color: '#666' }}>Loading Selang Hydrant Dashboard...</p>
        </div>
      </div>
    }>
      <GaSelangHydrantContent />
    </Suspense>
  );
}