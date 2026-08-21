import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Daftar semua kategori checklist
    const categories = [
      { label: 'All Category', value: 'All Category', type: 'all', area: 'all' },
      { label: 'APAR Inspection', value: 'apar', type: 'safety', area: 'safety' },
      { label: 'Fire Alarm Inspection', value: 'fire-alarm', type: 'safety', area: 'safety' },
      { label: 'Emergency Lamp Inspection', value: 'emergency-lamp', type: 'safety', area: 'safety' },
      { label: 'Toilet Inspection', value: 'toilet', type: 'facility', area: 'facility' },
      { label: 'Lift Barang Inspection', value: 'lift-barang', type: 'equipment', area: 'equipment' },
      { label: 'Panel Listrik Inspection', value: 'panel-listrik', type: 'equipment', area: 'equipment' },
      { label: 'Stop Kontak Inspection', value: 'stop-kontak', type: 'electrical', area: 'electrical' },
      { label: 'Tangga Listrik Inspection', value: 'tangga-listrik', type: 'equipment', area: 'equipment' },
    ];

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}