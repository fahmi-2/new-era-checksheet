// app/ga-smoke-detector/page.tsx
"use client";

import { Suspense, use } from 'react';
import { GaSmokeDetectorContent } from './GaSmokeDetectorContent';

export default function GaSmokeDetectorPage({
  searchParams,
}: {
  searchParams: Promise<{ openArea?: string }>;
}) {
  const params = use(searchParams);
  const openArea = params?.openArea || '';

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
        Loading Smoke & Heat Detector Dashboard...
      </div>
    }>
      <GaSmokeDetectorContent openArea={openArea} />
    </Suspense>
  );
}