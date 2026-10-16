// app/api/panel/inspections/edit/route.ts
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

interface EditPanelData {
  id: string;
  readings: PanelReadingInput[];
}

export async function PUT(request: NextRequest) {
  const client = await pool.connect();
  try {
    const data: EditPanelData = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { success: false, message: 'ID inspeksi wajib diisi' },
        { status: 400 }
      );
    }

    const check = await client.query('SELECT id FROM panel_inspections WHERE id = $1', [data.id]);
    if (check.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE panel_inspections
       SET updated_at = CURRENT_TIMESTAMP, is_edited = TRUE
       WHERE id = $1`,
      [data.id]
    );

    // Delete existing readings and re-insert updated readings
    await client.query('DELETE FROM panel_readings WHERE inspection_id = $1', [data.id]);

    const readings = Array.isArray(data.readings) ? data.readings : [];
    let readingIdx = 0;
    for (const r of readings) {
      const readingId = `${data.id}-${r.panelId || readingIdx++}`;
      await client.query(
        `INSERT INTO panel_readings (
          id, inspection_id, panel_id, temp, bau, suara, five_s,
          teg_out_3_phase, teg_out_1_phase, arus_r, arus_s, arus_t, catatan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          readingId,
          data.id,
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

    return NextResponse.json({
      success: true,
      message: 'Data inspeksi panel berhasil diperbarui',
      id: data.id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error editing panel inspection:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat memperbarui data inspeksi panel',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
