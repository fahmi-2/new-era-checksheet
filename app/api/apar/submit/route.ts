import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface AparItem {
  no: number;
  jenisApar: string;
  lokasi: string;
  noApar: string;
  expDate: string;
  hydrotestDate?: string;
  check1: string; check2: string; check3: string; check4: string;
  check5: string; check6: string; check7: string; check8: string;
  check9: string; check10: string; check11: string; check12: string;
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  slug: string;
  checker: string;
  checkerNik?: string;
  items: AparItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();
    
    // Validasi data wajib
    if (!data.date || !data.slug || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: date, slug, checker, dan items wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi nilai check1-12
    for (const [index, item] of data.items.entries()) {
      for (let i = 1; i <= 12; i++) {
        const checkValue = item[`check${i}` as keyof AparItem] as string;
        if (!checkValue || !['OK', 'NG', 'OBS'].includes(checkValue)) {
          return NextResponse.json(
            { success: false, message: `Check item ${i} pada baris ${index + 1} harus diisi dengan 'OK', 'NG', atau 'OBS'` },
            { status: 400 }
          );
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const recordId = `apar-${data.slug}-${Date.now()}`;

      // Insert ke apar_records
      await client.query(
        `INSERT INTO apar_records (id, date, area, checker, checker_nik, submitted_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [recordId, data.date, data.slug, data.checker, data.checkerNik || null]
      );

      // Insert ke apar_items
      for (const item of data.items) {
        await client.query(
          `INSERT INTO apar_items (
            record_id, no, jenis_apar, lokasi, no_apar, exp_date, hydrotest_date,
            check1, check2, check3, check4, check5, check6,
            check7, check8, check9, check10, check11, check12,
            keterangan, tindakan_perbaikan, pic, foto
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19,
            $20, $21, $22, $23
          )`,
          [
            recordId,
            item.no,
            item.jenisApar,
            item.lokasi,
            item.noApar,
            item.expDate,
            item.hydrotestDate || null,
            item.check1, item.check2, item.check3, item.check4, item.check5, item.check6,
            item.check7, item.check8, item.check9, item.check10, item.check11, item.check12,
            item.keterangan || null,
            item.tindakanPerbaikan || null,
            item.pic,
            item.foto || null
          ]
        );
      }

      await client.query('COMMIT');

      // Cek apakah ada nilai NG
      const hasNg = data.items.some((item) =>
        Object.entries(item).some(
          ([key, value]) => key.startsWith('check') && value === 'NG'
        )
      );

      return NextResponse.json(
        { success: true, message: 'Data berhasil disimpan', data: { id: recordId, hasNg } },
        { status: 201 }
      );

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Submit APAR error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}