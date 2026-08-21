// app/api/titik-kumpul/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface TitikKumpulItem {
  lokasi: string;
  areaAman: 'OK' | 'NG';
  identitasTitikKumpul: 'OK' | 'NG';
  areaMobilPMK: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface JalurEvakuasiItem {
  pertanyaan: string;
  no: number;
  hasilCek: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  checker: string;
  nik?: string;
  department?: string;
  titikKumpul: TitikKumpulItem[];
  jalurEvakuasi: JalurEvakuasiItem[];
}

export async function POST(request: NextRequest) {
  try {
    // ✅ DEFINISI VARIABEL 'data' DI AWAL TRY BLOCK
    const requestData: SubmitData = await request.json();
    
    // ✅ GUNAKAN requestData (bukan 'data') untuk menghindari konflik
    const { date, checker, nik, department, titikKumpul, jalurEvakuasi } = requestData;

    // ✅ Validasi dasar
    if (!date || !checker) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal dan checker wajib diisi' },
        { status: 400 }
      );
    }

    if ((!titikKumpul || titikKumpul.length === 0) &&
      (!jalurEvakuasi || jalurEvakuasi.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Data Titik Kumpul atau Jalur Evakuasi harus diisi' },
        { status: 400 }
      );
    }

    // ✅ Cek duplikat tanggal
    const countQuery = `
      SELECT COUNT(*) as total
      FROM titik_kumpul_checklists
      WHERE checklist_date = $1
    `;
    const countResult = await pool.query(countQuery, [date]);
    const total = parseInt(countResult.rows[0].total);
    
    if (total > 0) {
      return NextResponse.json(
        { success: false, message: 'Data untuk tanggal ini sudah ada' },
        { status: 409 }
      );
    }

    // ✅ Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ✅ Insert header ke titik_kumpul_checklists (dengan RETURNING id)
      const headerResult = await client.query(
        `INSERT INTO titik_kumpul_checklists (
          checklist_date, checker_name, checker_nik, checker_dept, submitted_at, created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [date, checker, nik || null, department || null]
      );

      // ✅ DAPATKAN auto-generated ID dari database
      const checklistId = headerResult.rows[0].id;
      console.log('✅ Generated Titik Kumpul ID:', checklistId);

      // ✅ Insert Titik Kumpul items
      if (titikKumpul && titikKumpul.length > 0) {
        for (const item of titikKumpul) {
          // Dapatkan location_id dari tabel locations
          const locResult = await client.query(
            'SELECT id FROM locations WHERE name = $1 AND type = $2',
            [item.lokasi, 'titik-kumpul']
          );
          const locationId = locResult.rows.length > 0 ? locResult.rows[0].id : null;

          await client.query(
            `INSERT INTO titik_kumpul_items (
              checklist_id, location_id, location_name,
              area_aman, identitas_titik_kumpul, area_mobil_pmk,
              keterangan, tindakan_perbaikan, pic, foto_data, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
            [
              checklistId,
              locationId,
              item.lokasi,
              item.areaAman,
              item.identitasTitikKumpul,
              item.areaMobilPMK,
              item.keterangan || '',
              item.tindakanPerbaikan || '',
              item.pic || '',
              item.foto || null
            ]
          );
        }
      }

      // ✅ Insert Jalur Evakuasi items
      if (jalurEvakuasi && jalurEvakuasi.length > 0) {
        for (const item of jalurEvakuasi) {
          // Dapatkan question_id dari tabel jalur_evakuasi_questions
          const qResult = await client.query(
            'SELECT id FROM jalur_evakuasi_questions WHERE question_text = $1',
            [item.pertanyaan]
          );
          const questionId = qResult.rows.length > 0 ? qResult.rows[0].id : null;

          await client.query(
            `INSERT INTO jalur_evakuasi_items (
              checklist_id, question_id, question_text, order_number,
              hasil_cek, keterangan, tindakan_perbaikan, pic, foto_data, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
            [
              checklistId,
              questionId,
              item.pertanyaan,
              item.no,
              item.hasilCek,
              item.keterangan || '',
              item.tindakanPerbaikan || '',
              item.pic || '',
              item.foto || null
            ]
          );
        }
      }

      await client.query('COMMIT');

      // ✅ Cek NG
      const hasNg =
        (titikKumpul?.some(item =>
          item.areaAman === 'NG' ||
          item.identitasTitikKumpul === 'NG' ||
          item.areaMobilPMK === 'NG'
        )) ||
        (jalurEvakuasi?.some(item => item.hasilCek === 'NG'));

      console.log('✅ Titik Kumpul data saved:', { checklistId, hasNg });

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          id: checklistId,
          hasNg
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Submit Titik Kumpul error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 5)
        } : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ Health check endpoint
export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() as time');
    return NextResponse.json({
      status: 'ok',
      time: result.rows[0].time,
      message: 'Titik Kumpul API is running'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    );
  }
}