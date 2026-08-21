// app/status-ga/smoke-detector/page.tsx
import { Suspense } from 'react';
import { GaSmokeDetectorContent } from './GaSmokeDetectorContent';

export default function GaSmokeDetectorPage() {
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
        Loading Smoke Detector Dashboard...
      </div>
    }>
      <GaSmokeDetectorContent />
    </Suspense>
  );
}