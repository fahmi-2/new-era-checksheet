// app/api/panel/inspections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaKey = searchParams.get('areaKey') || '';
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';

    const clauses: string[] = [];
    const params: unknown[] = [];

    if (areaKey) {
      params.push(areaKey);
      clauses.push(`area_key = $${params.length}`);
    }
    if (month) {
      params.push(month);
      clauses.push(`month = $${params.length}`);
    }
    if (year) {
      params.push(parseInt(year, 10));
      clauses.push(`year = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const inspRes = await pool.query(
      `SELECT * FROM panel_inspections ${where} ORDER BY saved_at DESC`,
      params
    );

    if (inspRes.rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const inspectionIds = inspRes.rows.map(r => r.id);
    const readingsRes = await pool.query(
      `SELECT * FROM panel_readings WHERE inspection_id = ANY($1) ORDER BY id ASC`,
      [inspectionIds]
    );

    const readingsByInspection = new Map<string, any[]>();
    for (const row of readingsRes.rows) {
      if (!readingsByInspection.has(row.inspection_id)) {
        readingsByInspection.set(row.inspection_id, []);
      }
      readingsByInspection.get(row.inspection_id)!.push({
        panelId: row.panel_id,
        temp: row.temp || '',
        bau: row.bau || '',
        suara: row.suara || '',
        fiveS: row.five_s || '',
        tegOut3Phase: row.teg_out_3_phase || '',
        tegOut1Phase: row.teg_out_1_phase || '',
        arusR: row.arus_r || '',
        arusS: row.arus_s || '',
        arusT: row.arus_t || '',
        catatan: row.catatan || '',
      });
    }

    const data = inspRes.rows.map(rec => {
      const savedTime = rec.saved_at ? new Date(rec.saved_at).getTime() : Date.now();
      const updatedTime = rec.updated_at ? new Date(rec.updated_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\./g, ':') : undefined;

      return {
        id: rec.id,
        areaKey: rec.area_key,
        areaLabel: rec.area_label,
        month: rec.month,
        year: rec.year,
        tgl: rec.tgl,
        picCheck: rec.pic_check,
        savedAt: savedTime,
        updatedAt: updatedTime,
        isEdited: Boolean(rec.is_edited),
        readings: readingsByInspection.get(rec.id) || [],
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching panel inspections:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
