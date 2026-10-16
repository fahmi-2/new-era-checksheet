// app/api/apd/inspections/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface NokDetailInput {
  nik: string;
  finding: string;
  findingCustom: string;
  tindakan: string;
  pic: string;
}

interface RowInput {
  area: string;
  jumlahMP: number;
  okCount: number;
  nokCount: number;
  nokDetails: NokDetailInput[];
}

interface EditData {
  id: string;
  rows: RowInput[];
}

const FINDING_OPTIONS = [
  'Rusak / tdk layak pakai',
  'Belum dapat APD',
  'APD hilang',
  'Spesifikasi APD tidak sesuai standar, size tidak ada',
  'Tidak pakai tanpa alasan',
  'Cara pakai APD tidak sesuai standar',
  'Lain-lain',
];

export async function PUT(request: NextRequest) {
  try {
    const data: EditData = await request.json();
    console.log('📝 Received APD Inspection edit data:', JSON.stringify(data, null, 2));

    if (!data.id) {
      return NextResponse.json(
        { success: false, message: 'ID record wajib diisi' },
        { status: 400 }
      );
    }

    // ── Cek Record di database ──────────────────────────────────────────
    const existing = await pool.query(
      'SELECT id, area_type FROM apd_inspection_records WHERE id = $1',
      [data.id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    const areaType = existing.rows[0].area_type;

    // ── Sanitasi rows ───────────────────────────────────────────────────
    let rows = Array.isArray(data.rows) ? [...data.rows] : [];

    if (areaType === 'cv') {
      rows = rows.filter(r => (r.area || '').trim() !== '');
      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Isi minimal satu nama Conveyor' },
          { status: 400 }
        );
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Belum ada baris inspeksi area' },
        { status: 400 }
      );
    }

    // ── Validasi per row ────────────────────────────────────────────────
    for (const [index, row] of rows.entries()) {
      const jumlah = Number(row.jumlahMP) || 0;
      const nok = Number(row.nokCount) || 0;

      if (jumlah < 0 || jumlah > 100000) {
        return NextResponse.json(
          { success: false, message: `Baris ${index + 1}: Jumlah MP tidak valid` },
          { status: 400 }
        );
      }
      if (nok < 0 || nok > jumlah) {
        return NextResponse.json(
          { success: false, message: `Baris ${index + 1}: N-OK tidak boleh melebihi Jumlah MP` },
          { status: 400 }
        );
      }

      const details = Array.isArray(row.nokDetails) ? row.nokDetails : [];
      for (const [ni, n] of details.entries()) {
        if (n.finding && !FINDING_OPTIONS.includes(n.finding)) {
          return NextResponse.json(
            { success: false, message: `Baris ${index + 1}, NIK ${ni + 1}: Temuan tidak valid` },
            { status: 400 }
          );
        }
        if (n.finding === 'Lain-lain' && !(n.findingCustom || '').trim()) {
          return NextResponse.json(
            { success: false, message: `Baris ${index + 1}, NIK ${ni + 1}: Temuan "Lain-lain" wajib diisi keterangan` },
            { status: 400 }
          );
        }
      }
    }

    // ── Transaksi Database ──────────────────────────────────────────────
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update updated_at pada record
      await client.query(
        `UPDATE apd_inspection_records 
         SET updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [data.id]
      );

      // 2. Ambil row_id lama untuk hapus detail N-OK
      const oldRows = await client.query(
        'SELECT id FROM apd_inspection_rows WHERE record_id = $1',
        [data.id]
      );
      const oldRowIds = oldRows.rows.map(r => r.id);

      if (oldRowIds.length > 0) {
        await client.query(
          'DELETE FROM apd_inspection_nok_details WHERE row_id = ANY($1)',
          [oldRowIds]
        );
      }

      // 3. Hapus rows lama
      await client.query(
        'DELETE FROM apd_inspection_rows WHERE record_id = $1',
        [data.id]
      );

      // 4. Insert rows baru + detail NOK
      let insertedRows = 0;
      let insertedNok = 0;

      for (const [rowIdx, row] of rows.entries()) {
        const jumlah = Number(row.jumlahMP) || 0;
        const nok = Math.min(Number(row.nokCount) || 0, jumlah);
        const ok = jumlah - nok;

        const rowResult = await client.query(
          `INSERT INTO apd_inspection_rows (
            record_id, row_order, area, jumlah_mp, ok_count, nok_count, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP)
          RETURNING id`,
          [data.id, rowIdx, (row.area || '').trim() || '-', jumlah, ok, nok]
        );
        insertedRows++;
        const rowId = rowResult.rows[0].id;

        const details = Array.isArray(row.nokDetails) ? row.nokDetails : [];
        for (const n of details) {
          await client.query(
            `INSERT INTO apd_inspection_nok_details (
              row_id, nik, finding, finding_custom, tindakan, pic, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP)`,
            [
              rowId,
              (n.nik || '').trim() || null,
              (n.finding || '').trim() || null,
              (n.finding || '') === 'Lain-lain' ? (n.findingCustom || '').trim() : ((n.findingCustom || '').trim() || null),
              (n.tindakan || '').trim() || null,
              (n.pic || '').trim() || null,
            ]
          );
          insertedNok++;
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Inspection ${data.id} updated successfully.`);

      return NextResponse.json({
        success: true,
        message: 'Data inspeksi APD berhasil diperbarui',
        id: data.id,
        totalRows: insertedRows,
        totalNokDetails: insertedNok,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Edit APD Inspection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat memperbarui data inspeksi',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
