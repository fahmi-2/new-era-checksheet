// app/api/panel/inspections/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface PanelReadingInput {
  panelId: string;
  temp?: string;
  bau?: string;
  suara?: string;
  fiveS?: string;
  tegOut3Phase?: string;
  tegOut1Phase?: string;
  arusR?: string;
  arusS?: string;
  arusT?: string;
  catatan?: string;
}

interface SubmitPanelData {
  id?: string;
  areaKey: string;
  areaLabel: string;
  month: string;
  year: number;
  tgl: string;
  picCheck: string;
  readings: PanelReadingInput[];
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const data: SubmitPanelData = await request.json();

    if (!data.areaKey || !data.areaLabel || !data.month || !data.year || !data.tgl || !data.picCheck) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: area, bulan, tahun, tanggal, dan PIC wajib diisi' },
        { status: 400 }
      );
    }

    const inspectionId = data.id || `PANEL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO panel_inspections (
        id, area_key, area_label, month, year, tgl, pic_check, saved_at, updated_at, is_edited
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)`,
      [
        inspectionId,
        data.areaKey,
        data.areaLabel,
        data.month,
        data.year,
        data.tgl,
        data.picCheck,
      ]
    );

    const readings = Array.isArray(data.readings) ? data.readings : [];
    let readingIdx = 0;
    for (const r of readings) {
      const readingId = `${inspectionId}-${r.panelId || readingIdx++}`;
      await client.query(
        `INSERT INTO panel_readings (
          id, inspection_id, panel_id, temp, bau, suara, five_s,
          teg_out_3_phase, teg_out_1_phase, arus_r, arus_s, arus_t, catatan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          readingId,
          inspectionId,
          r.panelId || `PANEL-${readingIdx}`,
          r.temp || null,
          r.bau || null,
          r.suara || null,
          r.fiveS || null,
          r.tegOut3Phase || null,
          r.tegOut1Phase || null,
          r.arusR || null,
          r.arusS || null,
          r.arusT || null,
          r.catatan || null,
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: 'Data inspeksi panel berhasil disimpan',
        id: inspectionId,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error submitting panel inspection:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menyimpan data inspeksi panel',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
