// app/api/pintu-darurat/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface PintuDaratItem {
  id?: string; // Kode lokasi (contoh: "AUDI-01") - optional karena form tidak mengirim
  lokasi: string; // Nama lokasi (contoh: "Auditorium")
  kondisiPintu: 'OK' | 'NG';
  areaSekitar: 'OK' | 'NG';
  paluAlatBantu: 'OK' | 'NG';
  identitasPintu: 'OK' | 'NG';
  idPeringatan: 'OK' | 'NG';
  doorCloser: 'OK' | 'NG';
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
  items: PintuDaratItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // ✅ Validasi data
    if (!data.date || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal, checker, dan items wajib diisi' },
        { status: 400 }
      );
    }

    // ✅ Validasi setiap item
    for (const item of data.items) {
      if (!item.kondisiPintu || !item.areaSekitar || !item.paluAlatBantu ||
        !item.identitasPintu || !item.idPeringatan || !item.doorCloser) {
        return NextResponse.json(
          { success: false, message: `Item ${item.lokasi} tidak lengkap` },
          { status: 400 }
        );
      }
    }

    // ✅ Cek duplikat tanggal
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pintu_darurat_checklists
      WHERE checklist_date = $1
    `;
    const countResult = await pool.query(countQuery, [data.date]);
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

      // ✅ Insert header ke pintu_darurat_checklists
      const headerResult = await client.query(
        `INSERT INTO pintu_darurat_checklists (
          checklist_date, checker_name, checker_nik, checker_dept, submitted_at, created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [data.date, data.checker, data.nik || null, data.department || null]
      );

      // ✅ DAPATKAN auto-generated ID
      const checklistId = headerResult.rows[0].id;

      // ✅ Insert items ke pintu_darurat_checklist_items
      for (const item of data.items) {
        // ✅ DENGAN BENAR: Gunakan item.lokasi (nama) untuk mencari location_id
        //    Karena form Pintu Darurat TIDAK mengirim field 'id' (kode lokasi)
        const locResult = await client.query(
          'SELECT id FROM locations WHERE name = $1 AND type = $2',
          [item.lokasi, 'pintu-darurat']
        );
        // ✅ GUNAKAN rows.length (bukan rowCount) untuk PostgreSQL
        const locationId = locResult.rows.length > 0 ? locResult.rows[0].id : null;

        await client.query(
          `INSERT INTO pintu_darurat_checklist_items (
            checklist_id, location_id, location_name,
            kondisi_pintu, area_sekitar, palu_alat_bantu,
            identitas_pintu, id_peringatan, door_closer,
            keterangan, tindakan_perbaikan, pic, foto_data, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
          [
            checklistId,
            locationId,
            item.lokasi, // ✅ Simpan nama lokasi yang dikirim dari form
            item.kondisiPintu,
            item.areaSekitar,
            item.paluAlatBantu,
            item.identitasPintu,
            item.idPeringatan,
            item.doorCloser,
            item.keterangan || '',
            item.tindakanPerbaikan || '',
            item.pic || '',
            item.foto || null
          ]
        );
      }

      await client.query('COMMIT');

      // ✅ Cek apakah ada item NG
      const hasNg = data.items.some(
        item => item.kondisiPintu === 'NG' ||
          item.areaSekitar === 'NG' ||
          item.paluAlatBantu === 'NG' ||
          item.identitasPintu === 'NG' ||
          item.idPeringatan === 'NG' ||
          item.doorCloser === 'NG'
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          id: checklistId,
          hasNg,
          itemsCount: data.items.length
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
    console.error('❌ Submit Pintu Darurat error:', error);
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