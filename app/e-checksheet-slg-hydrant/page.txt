// app/e-checksheet-selang-hydrant/page.tsx
import { Suspense } from 'react';
import { EChecksheetSelangHydrantForm } from './EChecksheetSelangHydrantForm';

export default function EChecksheetSelangHydrantPage({
  searchParams,
}: {
  searchParams: {
    lokasi?: string;
    zona?: string;
    jenisHydrant?: string;
    pic?: string;
  };
}) {
  const lokasi = searchParams?.lokasi || 'Hydrant Lokasi';
  const zona = searchParams?.zona || 'Zona';
  const jenisHydrant = searchParams?.jenisHydrant || 'Jenis Hydrant';
  const picDefault = searchParams?.pic || 'PIC';

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
        Loading Selang Hydrant inspection form...
      </div>
    }>
      <EChecksheetSelangHydrantForm
        lokasi={lokasi}
        zona={zona}
        jenisHydrant={jenisHydrant}
        picDefault={picDefault}
      />
    </Suspense>
  );
}