// app/status-ga/panel/page.tsx
'use client';
import { Suspense } from 'react';
import { GaPanelContent } from './GaPanelContent';

export default function GAPanelPage() {
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
        Loading Panel Inspection Dashboard...
      </div>
    }>
      <GaPanelContent />
    </Suspense>
  );
}