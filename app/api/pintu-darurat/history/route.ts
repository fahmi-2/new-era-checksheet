// app/api/pintu-darurat/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const location = searchParams.get('location');

    let query = `
      SELECT
        c.id,
        c.checklist_date as "date",
        c.checker_name as "checker",
        c.checker_nik as "nik",
        c.checker_dept as "department",
        c.submitted_at as "submittedAt",
        i.id as "itemId",              -- ✅ WAJIB: Return actual database ID
        i.location_name as "lokasi",
        i.kondisi_pintu as "kondisiPintu",
        i.area_sekitar as "areaSekitar",
        i.palu_alat_bantu as "paluAlatBantu",
        i.identitas_pintu as "identitasPintu",
        i.id_peringatan as "idPeringatan",
        i.door_closer as "doorCloser",
        i.keterangan,
        i.tindakan_perbaikan as "tindakanPerbaikan",
        i.pic,
        i.foto_data as "foto"
      FROM pintu_darurat_checklists c
      JOIN pintu_darurat_checklist_items i ON c.id = i.checklist_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND c.checklist_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (location) {
      query += ` AND i.location_name = $${paramIndex}`;
      params.push(location);
      paramIndex++;
    }

    query += ' ORDER BY c.checklist_date DESC, i.id ASC';

    const result = await pool.query(query, params);
    const rows = result.rows;

    // ✅ Group by checklist
    const grouped: any = {};
    rows.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,                    // ✅ Checklist ID
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          items: []
        };
      }
      grouped[row.date].items.push({
        itemId: row.itemId,              // ✅ Item ID dari database (16, 17, 18...)
        no: row.itemId,                  // ✅ Gunakan actual ID untuk no
        lokasi: row.lokasi,
        kondisiPintu: row.kondisiPintu,
        areaSekitar: row.areaSekitar,
        paluAlatBantu: row.paluAlatBantu,
        identitasPintu: row.identitasPintu,
        idPeringatan: row.idPeringatan,
        doorCloser: row.doorCloser,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    const resultArray = Object.values(grouped) as Array<{ items: any[] }>;

    console.log('✅ History data loaded:', {
      totalRecords: resultArray.length,
      sample: resultArray[0]?.items?.slice(0, 2)  // 🔍 Debug: lihat itemId
    });

    return NextResponse.json(resultArray);
  } catch (error) {
    console.error('❌ Pintu Darurat history error:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal memuat riwayat',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}