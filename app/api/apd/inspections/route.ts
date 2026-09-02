// app/api/apd/inspections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';   // YYYY-MM-DD
    const month = searchParams.get('month') || ''; // YYYY-MM

    // ── Ambil header records ────────────────────────────────────────────
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (date) {
      params.push(date);
      clauses.push(`inspection_date = $${params.length}::date`);
    } else if (month) {
      params.push(month);
      clauses.push(`to_char(inspection_date, 'YYYY-MM') = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const recRes = await pool.query(
      `SELECT * FROM apd_inspection_records ${where} ORDER BY submitted_at DESC`,
      params
    );

    if (recRes.rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // ── Ambil rows + nok details (tanpa N+1) ────────────────────────────
    const recordIds = recRes.rows.map(r => r.id);
    const rowsRes = await pool.query(
      `SELECT * FROM apd_inspection_rows
       WHERE record_id = ANY($1)
       ORDER BY record_id, row_order ASC`,
      [recordIds]
    );

    const rowIds = rowsRes.rows.map(r => r.id);
    const nokRes = rowIds.length
      ? await pool.query(
          `SELECT * FROM apd_inspection_nok_details
           WHERE row_id = ANY($1)
           ORDER BY id ASC`,
          [rowIds]
        )
      : { rows: [] as any[] };

    // ── Grouping ────────────────────────────────────────────────────────
    const nokByRow = new Map<number, any[]>();
    for (const n of nokRes.rows) {
      if (!nokByRow.has(n.row_id)) nokByRow.set(n.row_id, []);
      nokByRow.get(n.row_id)!.push(n);
    }

    const rowsByRecord = new Map<string, any[]>();
    for (const r of rowsRes.rows) {
      if (!rowsByRecord.has(r.record_id)) rowsByRecord.set(r.record_id, []);
      rowsByRecord.get(r.record_id)!.push({
        id: String(r.id),
        area: r.area,
        jumlahMP: r.jumlah_mp,
        okCount: r.ok_count,
        nokCount: r.nok_count,
        nokDetails: (nokByRow.get(r.id) || []).map((n: any) => ({
          id: String(n.id),
          nik: n.nik || '',
          finding: n.finding || '',
          findingCustom: n.finding_custom || '',
          tindakan: n.tindakan || '',
          pic: n.pic || '',
        })),
      });
    }

    // ── Bentuk sesuai InspectionEntry di frontend ───────────────────────
    const data = recRes.rows.map(rec => ({
      id: rec.id,
      deptKey: rec.dept_key,
      deptName: rec.dept_name,
      prosesKey: rec.proses_key,
      prosesName: rec.proses_name,
      subName: rec.sub_name,
      areaType: rec.area_type,
      sourceAreaName: rec.source_area_name,
      inspectorId: rec.inspector_id,
      inspectorName: rec.inspector_name,
      scanVerified: rec.scan_verified,
      date: new Date(rec.submitted_at).toISOString(),
      savedAt: new Date(rec.submitted_at).getTime(),
      rows: rowsByRecord.get(rec.id) || [],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Fetch APD Inspections error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data inspeksi APD',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
