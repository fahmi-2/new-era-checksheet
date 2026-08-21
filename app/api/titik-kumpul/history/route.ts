// app/api/titik-kumpul/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const location = searchParams.get('location');

    // ✅ Query Titik Kumpul
    let queryTK = `
      SELECT
        c.id,
        c.checklist_date as "date",
        c.checker_name as "checker",
        c.checker_nik as "nik",
        c.checker_dept as "department",
        c.submitted_at as "submittedAt",
        i.id as "itemId",              -- ✅ WAJIB: Actual database ID (7, 8, 9...)
        i.location_name as "lokasi",
        i.area_aman as "areaAman",
        i.identitas_titik_kumpul as "identitasTitikKumpul",
        i.area_mobil_pmk as "areaMobilPMK",
        i.keterangan,
        i.tindakan_perbaikan as "tindakanPerbaikan",
        i.pic,
        i.foto_data as "foto"
      FROM titik_kumpul_checklists c
      JOIN titik_kumpul_items i ON c.id = i.checklist_id
      WHERE 1=1
    `;

    // ✅ Query Jalur Evakuasi
    let queryJE = `
      SELECT
        c.id,
        c.checklist_date as "date",
        c.checker_name as "checker",
        c.checker_nik as "nik",
        c.checker_dept as "department",
        c.submitted_at as "submittedAt",
        i.id as "itemId",              -- ✅ WAJIB: Actual database ID
        i.question_text as "pertanyaan",
        i.order_number as "no",
        i.hasil_cek as "hasilCek",
        i.keterangan,
        i.tindakan_perbaikan as "tindakanPerbaikan",
        i.pic,
        i.foto_data as "foto"
      FROM titik_kumpul_checklists c
      JOIN jalur_evakuasi_items i ON c.id = i.checklist_id
      WHERE 1=1
    `;

    const paramsTK: any[] = [];
    const paramsJE: any[] = [];
    let paramIndexTK = 1;
    let paramIndexJE = 1;

    if (date) {
      queryTK += ` AND c.checklist_date = $${paramIndexTK}`;
      queryJE += ` AND c.checklist_date = $${paramIndexJE}`;
      paramsTK.push(date);
      paramsJE.push(date);
      paramIndexTK++;
      paramIndexJE++;
    }

    if (location) {
      queryTK += ` AND i.location_name = $${paramIndexTK}`;
      paramsTK.push(location);
    }

    queryTK += ' ORDER BY c.checklist_date DESC, i.id ASC';
    queryJE += ' ORDER BY c.checklist_date DESC, i.order_number ASC';

    const [resultTK, resultJE] = await Promise.all([
      pool.query(queryTK, paramsTK),
      pool.query(queryJE, paramsJE)
    ]);

    const rowsTK = resultTK.rows;
    const rowsJE = resultJE.rows;

    // ✅ Group by date
    const grouped: any = {};

    // Process Titik Kumpul
    rowsTK.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          titikKumpul: [],
          jalurEvakuasi: []
        };
      }
      grouped[row.date].titikKumpul.push({
        // ✅ WAJIB: Ambil itemId dari database (7, 8, 9...)
        itemId: row.itemId,
        no: row.itemId,                  // ✅ Gunakan actual ID untuk no
        lokasi: row.lokasi,
        areaAman: row.areaAman,
        identitasTitikKumpul: row.identitasTitikKumpul,
        areaMobilPMK: row.areaMobilPMK,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    // Process Jalur Evakuasi
    rowsJE.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          titikKumpul: [],
          jalurEvakuasi: []
        };
      }
      grouped[row.date].jalurEvakuasi.push({
        // ✅ WAJIB: Ambil itemId dari database
        itemId: row.itemId,
        no: row.no,
        pertanyaan: row.pertanyaan,
        hasilCek: row.hasilCek,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    const result = Object.values(grouped);

    // 🔍 Debug log
    console.log('✅ Titik Kumpul history loaded:', {
      totalRecords: result.length,
      sample: result[0] ? { ...result[0], titikKumpul: (result[0] as any).titikKumpul?.slice(0, 2) } : null  // 🔍 Lihat itemId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Titik Kumpul history error:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal memuat riwayat',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}