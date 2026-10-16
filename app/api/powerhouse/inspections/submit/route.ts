// app/api/powerhouse/inspections/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  let client;
  try {
    client = await pool.connect();
    const data = await request.json();

    const {
      id,
      tgl,
      shift,
      pic,
      values,
      ngItems = [],
      scorePercent = 100,
      equipName,
    } = data;

    // Ekstrak equipmentId dari keys values atau dari ID
    // Payload `values` berbentuk: { [equipId]: { [itemId]: value } }
    const equipIds = Object.keys(values || {});
    const equipmentId = equipIds[0] || (id ? id.split('_').pop() : 'UNKNOWN');

    if (!tgl || !pic) {
      return NextResponse.json(
        { success: false, message: 'Tanggal dan PIC wajib diisi' },
        { status: 400 }
      );
    }

    const inspectionId = id || `PH-${Date.now()}-${equipmentId}`;

    // Parsing shift menjadi angka integer jika diperlukan, fallback ke 1 jika string
    let shiftNum = 1;
    if (typeof shift === 'number') {
      shiftNum = shift;
    } else if (typeof shift === 'string') {
      const match = shift.match(/\d+/);
      if (match) {
        shiftNum = parseInt(match[0], 10);
      }
    }
    if (shiftNum < 1 || shiftNum > 3) shiftNum = 1;

    await client.query('BEGIN');

    // 1. Pastikan equipment terdaftar di master equipments agar tidak kena foreign key error
    if (equipmentId && equipmentId !== 'UNKNOWN') {
      await client.query(
        `INSERT INTO equipments (id, nama_alat, area)
         VALUES ($1, $2, 'Power House')
         ON CONFLICT (id) DO UPDATE SET 
            nama_alat = EXCLUDED.nama_alat,
            updated_at = CURRENT_TIMESTAMP`,
        [equipmentId, equipName || equipmentId]
      );
    }

    // 2. Simpan inspeksi peralatan (equipment_inspections)
    await client.query(
      `INSERT INTO equipment_inspections (
        id, equipment_id, tgl, shift, pic, score_percent, status, values_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        score_percent = EXCLUDED.score_percent,
        values_data = EXCLUDED.values_data,
        updated_at = CURRENT_TIMESTAMP`,
      [
        inspectionId,
        equipmentId,
        tgl,
        shiftNum,
        pic,
        scorePercent,
        JSON.stringify(values || {}),
      ]
    );

    // 3. Simpan temuan NG jika ada
    if (Array.isArray(ngItems) && ngItems.length > 0) {
      // Hapus temuan NG lama untuk inspection ini jika upsert
      await client.query(`DELETE FROM inspection_ng_items WHERE inspection_id = $1`, [inspectionId]);

      for (const ng of ngItems) {
        await client.query(
          `INSERT INTO inspection_ng_items (
            inspection_id, field_key, field_label, kondisi_aktual, tindakan_perbaikan
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            inspectionId,
            ng.itemId || 'unknown',
            ng.label || ng.itemId || 'Item Temuan',
            ng.kondisiAktual || 'Kondisi NG terdeteksi',
            ng.tindakanPerbaikan || null,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: `Inspeksi ${equipName || equipmentId} berhasil disimpan ke database.`,
        id: inspectionId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* ignore rollback error */ }
    }
    console.error('❌ Error submitting powerhouse inspection:', error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error)?.message || 'Gagal menyimpan data inspeksi powerhouse',
        error: (error as Error)?.message,
        detail: (error as any)?.detail,
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
