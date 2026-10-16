// app/api/powerhouse/inspections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const equipmentId = searchParams.get('equipmentId');

    let query = `
      SELECT 
        i.id,
        i.equipment_id,
        e.nama_alat as equip_name,
        TO_CHAR(i.tgl, 'YYYY-MM-DD') as tgl,
        i.shift,
        i.pic,
        i.score_percent,
        i.values_data as values,
        i.status,
        i.created_at,
        i.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ng.id,
              'itemId', ng.field_key,
              'label', ng.field_label,
              'kondisiAktual', ng.kondisi_aktual,
              'tindakanPerbaikan', ng.tindakan_perbaikan,
              'isResolved', ng.is_resolved
            )
          ) FILTER (WHERE ng.id IS NOT NULL),
          '[]'
        ) as ng_items
      FROM equipment_inspections i
      LEFT JOIN equipments e ON i.equipment_id = e.id
      LEFT JOIN inspection_ng_items ng ON i.id = ng.inspection_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (year) {
      query += ` AND EXTRACT(YEAR FROM i.tgl) = $${paramIndex++}`;
      params.push(parseInt(year, 10));
    }

    if (month) {
      query += ` AND EXTRACT(MONTH FROM i.tgl) = $${paramIndex++}`;
      params.push(parseInt(month, 10));
    }

    if (equipmentId) {
      query += ` AND i.equipment_id = $${paramIndex++}`;
      params.push(equipmentId);
    }

    query += `
      GROUP BY i.id, e.nama_alat
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query, params);

    // Map database rows ke format InspectionSession yang diharapkan frontend
    const sessions = result.rows.map((row) => ({
      id: row.id,
      tgl: row.tgl,
      shift: `Shift ${row.shift}`,
      pic: row.pic,
      values: typeof row.values === 'string' ? JSON.parse(row.values) : row.values,
      ngItems: row.ng_items || [],
      scorePercent: parseFloat(row.score_percent) || 0,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      editedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      equipName: row.equip_name || row.equipment_id,
    }));

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('❌ Error fetching powerhouse inspections:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memuat data inspeksi powerhouse',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
