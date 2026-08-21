// app/e-checksheet-ins-apd/page.tsx
'use client';

import { Suspense, use } from 'react';
import { EChecksheetInsApdForm } from './EChecksheetInsApdForm';

export default function EChecksheetInsApdPage({
  searchParams,
}: {
  searchParams: Promise<{
    areaId?: string;
  }>;
}) {
  const params = use(searchParams);
  const areaId = Number(params?.areaId) || 1;

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
        Loading APD inspection form...
      </div>
    }>
      <EChecksheetInsApdForm areaId={areaId} />
    </Suspense>
  );
}