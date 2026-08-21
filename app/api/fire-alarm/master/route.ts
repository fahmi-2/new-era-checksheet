// app/api/fire-alarm/master/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zona = searchParams.get('zona');

    if (!zona) {
      return NextResponse.json(
        { success: false, message: 'Parameter zona diperlukan' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // LANGKAH 1: Cari record_id TERBARU untuk zona ini
    // Ini adalah kunci utama — kita ambil 1 record paling baru dulu,
    // lalu ambil semua item dari record tersebut.
    // Ini LEBIH ANDAL daripada DISTINCT ON karena kita yakin semua
    // item berasal dari satu snapshot waktu yang sama.
    // ─────────────────────────────────────────────────────────────────
    const latestRecordQuery = `
      SELECT id, submitted_at
      FROM fire_alarm_records
      WHERE zona = $1
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    const latestRecordResult = await pool.query(latestRecordQuery, [zona]);

    if (latestRecordResult.rows.length === 0) {
      // Belum ada data sama sekali untuk zona ini
      return NextResponse.json({
        success: true,
        data: [],
        source: 'empty',
        message: `Belum ada data untuk zona ${zona}`
      });
    }

    const latestRecordId = latestRecordResult.rows[0].id;
    const latestSubmittedAt = latestRecordResult.rows[0].submitted_at;

    // ─────────────────────────────────────────────────────────────────
    // LANGKAH 2: Ambil semua item dari record terbaru tersebut,
    // diurutkan berdasarkan nomor urut
    // ─────────────────────────────────────────────────────────────────
    const itemsQuery = `
      SELECT
        i.no,
        i.zona,
        i.lokasi,
        i.alarm_bell,
        i.indicator_lamp,
        i.manual_call_point,
        i.id_zona,
        i.kebersihan,
        i.kondisi_nok,
        i.tindakan_perbaikan,
        i.pic,
        i.foto
      FROM fire_alarm_items i
      WHERE i.record_id = $1
      ORDER BY i.no ASC
    `;

    const itemsResult = await pool.query(itemsQuery, [latestRecordId]);

    if (itemsResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        source: 'empty',
        message: `Record ditemukan tapi tidak ada item untuk zona ${zona}`
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // LANGKAH 3: Format data
    // - Pertahankan: no, zona, lokasi, id_zona, pic (sebagai default)
    // - Reset ke OK: semua status (alarm_bell, indicator_lamp, dll)
    // - Kosongkan: kondisi_nok, tindakan_perbaikan, foto
    //   (karena ini template untuk checksheet BARU)
    // ─────────────────────────────────────────────────────────────────
    const formattedData = itemsResult.rows.map((row: any) => ({
      no: row.no,
      zona: row.zona || zona,
      lokasi: row.lokasi || '',
      alarmBell: 'OK',           // reset — user isi ulang
      indicatorLamp: 'OK',       // reset — user isi ulang
      manualCallPoint: 'OK',     // reset — user isi ulang
      idZona: row.id_zona || '', // tetap — ini label/nama ID zona
      kebersihan: 'OK',          // reset — user isi ulang
      kondisiNok: '',             // kosong — user isi ulang
      tindakanPerbaikan: '',      // kosong — user isi ulang
      pic: row.pic || '',         // tetap sebagai default PIC
      foto: null                  // kosong — foto baru
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: formattedData.length,
      source: 'latest_record',
      lastRecordId: latestRecordId,
      lastSubmittedAt: latestSubmittedAt
    });

  } catch (error: any) {
    console.error('Master API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}