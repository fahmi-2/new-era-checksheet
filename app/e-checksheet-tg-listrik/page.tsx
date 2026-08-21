// app/e-checksheet-tg-listrik/page.tsx
'use client';

import { Suspense, use } from 'react';
import { EChecksheetTgListrikForm } from './EChecksheetTgListrikForm';

export default function EChecksheetTgListrikPage({
  searchParams,
}: {
  searchParams: Promise<{
    areaName?: string;
    lokasi?: string;
  }>;
}) {
  const params = use(searchParams);
  const areaName = params?.areaName || 'Tangga Listrik';
  const lokasi = params?.lokasi || 'Lokasi';

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
        Loading Tangga Listrik inspection form...
      </div>
    }>
      <EChecksheetTgListrikForm
        areaName={areaName}
        lokasi={lokasi}
      />
    </Suspense>
  );
}