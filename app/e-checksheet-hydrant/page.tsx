// app/e-checksheet-hydrant/page.tsx
"use client";
import { Suspense, use } from 'react';
import { EChecksheetHydrantForm } from './EChecksheetHydrantForm';

export default function EChecksheetHydrantPage({
  searchParams,
}: {
  searchParams: Promise<{
    no?: string;
    lokasi?: string;
    zona?: string;
    jenisHydrant?: string;
  }>;
}) {
  const params = use(searchParams);
  
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5', fontSize: '16px' }}>
        Loading inspection form...
      </div>
    }>
      <EChecksheetHydrantForm />
    </Suspense>
  );
}