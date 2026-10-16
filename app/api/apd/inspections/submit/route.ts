// app/api/apd/inspections/submit/route.ts
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

interface SubmitData {
  deptKey: string;
  deptName: string;
  prosesKey: string;
  prosesName: string;
  subName: string;
  areaType: string;          // 'predefined-per-sub' | 'cv' | 'none'
  sourceAreaName: string;
  inspectorId: string;
  inspectorName: string;
  scanVerified: boolean;
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

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();
    console.log('📥 Received APD Inspection data:', JSON.stringify(data, null, 2));

    // ── Validasi data utama ─────────────────────────────────────────────
    if (!data.deptKey || !data.deptName || !data.prosesKey || !data.prosesName || !data.subName) {
      console.log('❌ Validation failed: dept/proses/sub tidak lengkap');
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: Departemen, Proses, dan Sub-Proses wajib diisi' },
        { status: 400 }
      );
    }

    if (!data.scanVerified) {
      console.log('❌ Validation failed: belum scan QR');
      return NextResponse.json(
        { success: false, message: 'Scan QR Code wajib dilakukan sebelum menyimpan' },
        { status: 400 }
      );
    }

    // ── Sanitasi rows ───────────────────────────────────────────────────
    let rows = Array.isArray(data.rows) ? [...data.rows] : [];

    // Mode CV: buang baris conveyor kosong, minimal 1 terisi
    if (data.areaType === 'cv') {
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

      // Validasi detail N-OK
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

    // ── Generate ID unik ────────────────────────────────────────────────
    const id = `APD-INS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log('📝 Generated Record ID:', id);

    // ── Test koneksi database ───────────────────────────────────────────
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connection OK');
    } catch (connError) {
      console.error('❌ Database connection failed:', connError);
      return NextResponse.json(
        {
          success: false,
          message: 'Koneksi database gagal',
          error: process.env.NODE_ENV === 'development' ? (connError as Error).message : undefined,
        },
        { status: 500 }
      );
    }

    // ── Check tabel existence ───────────────────────────────────────────
    const tableCheck = await pool.query(`
      SELECT
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apd_inspection_records') AS records_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apd_inspection_rows') AS rows_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apd_inspection_nok_details') AS nok_exists
    `);

    if (!tableCheck.rows[0].records_exists || !tableCheck.rows[0].rows_exists || !tableCheck.rows[0].nok_exists) {
      console.error('❌ Tabel tidak ditemukan:', tableCheck.rows[0]);
      return NextResponse.json(
        {
          success: false,
          message: 'Tabel apd_inspection_* tidak ditemukan',
          hint: 'Jalankan migration SQL untuk membuat tabel',
        },
        { status: 500 }
      );
    }

    // ── Transaction ─────────────────────────────────────────────────────
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      console.log('🔄 Transaction started');

      // Insert header
      await client.query(
        `INSERT INTO apd_inspection_records (
          id, dept_key, dept_name, proses_key, proses_name, sub_name,
          area_type, source_area_name, inspector_id, inspector_name,
          scan_verified, inspection_date, submitted_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          id,
          data.deptKey,
          data.deptName,
          data.prosesKey,
          data.prosesName,
          data.subName,
          data.areaType || 'none',
          data.sourceAreaName || null,
          data.inspectorId || null,
          data.inspectorName || null,
          Boolean(data.scanVerified),
        ]
      );
      console.log('✅ Record inserted:', id);

      // Insert rows + nok details
      let insertedRows = 0;
      let insertedNok = 0;

      for (const [rowIdx, row] of rows.entries()) {
        const jumlah = Number(row.jumlahMP) || 0;
        const nok = Math.min(Number(row.nokCount) || 0, jumlah);
        const ok = jumlah - nok; // server enforce invariant ok + nok = jumlah

        const rowResult = await client.query(
          `INSERT INTO apd_inspection_rows (
            record_id, row_order, area, jumlah_mp, ok_count, nok_count, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP)
          RETURNING id`,
          [id, rowIdx, (row.area || '').trim() || '-', jumlah, ok, nok]
        );
        insertedRows++;
        const rowId = rowResult.rows[0].id;
        console.log(`✅ Row ${insertedRows} inserted (DB ID: ${rowId})`);

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
      console.log(`✅ Transaction committed. Rows: ${insertedRows}, NOK details: ${insertedNok}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Data Inspeksi APD berhasil disimpan',
          id,
          totalRows: insertedRows,
          totalNokDetails: insertedNok,
        },
        { status: 201 }
      );
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);

      if (transactionError instanceof Error) {
        if (transactionError.message.includes('chk_apd_row_counts')) {
          return NextResponse.json(
            { success: false, message: 'Data jumlah MP/OK/N-OK tidak konsisten' },
            { status: 400 }
          );
        }
        if (transactionError.message.includes('violates foreign key constraint')) {
          return NextResponse.json(
            { success: false, message: 'Error relasi database. Periksa record_id/row_id' },
            { status: 500 }
          );
        }
      }
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 Connection released');
    }
  } catch (error) {
    console.error('❌ Submit APD Inspection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server saat menyimpan data',
        error: process.env.NODE_ENV === 'development'
          ? { message: (error as Error).message, stack: (error as Error).stack?.split('\n').slice(0, 5) }
          : undefined,
      },
      { status: 500 }
    );
  }
}
