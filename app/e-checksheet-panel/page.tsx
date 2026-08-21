// app/e-checksheet-panel/page.tsx
'use client';
import { Suspense } from 'react';
import { EChecksheetPanelForm } from './EChecksheetPanelForm';

export default function EChecksheetPanelPage() {
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
        Loading Panel Inspection Form...
      </div>
    }>
      <EChecksheetPanelForm />
    </Suspense>
  );
}