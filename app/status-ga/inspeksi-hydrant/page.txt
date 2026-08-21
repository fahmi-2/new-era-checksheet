// app/ga-inspeksi-hydrant/page.tsx
import { Suspense } from 'react';
import { GaInspeksiHydrantContent } from './GaInspeksiHydrantContent';

export default function GaInspeksiHydrantPage({
  searchParams,
}: {
  searchParams: {
    // Tidak ada params yang digunakan di halaman ini, tapi tetap terima untuk konsistensi
  };
}) {
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
        Loading Hydrant Dashboard...
      </div>
    }>
      <GaInspeksiHydrantContent />
    </Suspense>
  );
}