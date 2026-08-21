import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zona = searchParams.get('zona');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const lokasi = searchParams.get('lokasi');
    const recordId = searchParams.get('record_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!zona) {
      return NextResponse.json(
        { success: false, message: 'Parameter zona diperlukan' },
        { status: 400 }
      );
    }

    // ✅ Build dynamic query dengan filter date yang aman
    let query = `
      SELECT 
        r.id, 
        r.date, 
        r.zona, 
        r.checker, 
        r.checker_nik, 
        r.submitted_at,
        json_agg(json_build_object(
          'id', i.id,
          'no', i.no,
          'zona', i.zona,
          'lokasi', i.lokasi,
          'alarmBell', i.alarm_bell,
          'indicatorLamp', i.indicator_lamp,
          'manualCallPoint', i.manual_call_point,
          'idZona', i.id_zona,
          'kebersihan', i.kebersihan,
          'kondisiNok', i.kondisi_nok,
          'tindakanPerbaikan', i.tindakan_perbaikan,
          'pic', i.pic,
          'foto', i.foto
        )) as items
      FROM fire_alarm_records r
      LEFT JOIN fire_alarm_items i ON r.id = i.record_id
      WHERE r.zona = $1
    `;

    const params: any[] = [zona];
    let paramIndex = 2;

    // ✅ Filter berdasarkan record_id spesifik (untuk edit)
    if (recordId) {
      query += ` AND r.id = $${paramIndex}`;
      params.push(recordId);
      paramIndex++;
    }

    // ✅ Filter date dengan format DATE (tanpa timezone issue)
    if (dateFrom) {
      query += ` AND r.date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND r.date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // ✅ Filter lokasi
    if (lokasi) {
      query += ` AND i.lokasi ILIKE $${paramIndex}`;
      params.push(`%${lokasi}%`);
      paramIndex++;
    }

    query += ` GROUP BY r.id ORDER BY r.date DESC, r.submitted_at DESC`;
    
    // ✅ Pagination (hanya jika tidak query single record)
    if (!recordId) {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);
    
    // ✅ Format response dengan handle null items
    const formattedData = result.rows.map((row: any) => ({
      id: row.id,
      date: row.date ? formatDate(row.date) : '',
      zona: row.zona,
      checker: row.checker,
      checkerNik: row.checker_nik || '',
      submittedAt: row.submitted_at || null,
      items: row.items?.[0] ? row.items.filter((item: any) => item.lokasi !== null) : []
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// ✅ Helper: Format date konsisten YYYY-MM-DD
function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}