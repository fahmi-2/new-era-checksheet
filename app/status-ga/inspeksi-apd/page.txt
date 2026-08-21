// app/ga-inspeksi-apd/page.tsx
import { Suspense } from 'react';
import { GaInspeksiApdContent } from './GaInspeksiApdContent';

export default function GaInspeksiApdPage({
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
        Loading APD Inspection Dashboard...
      </div>
    }>
      <GaInspeksiApdContent />
    </Suspense>
  );
}