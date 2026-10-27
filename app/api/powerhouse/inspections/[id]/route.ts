// app/api/powerhouse/inspections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  let client;

  try {
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID inspeksi diperlukan' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(`DELETE FROM inspection_ng_items WHERE inspection_id = $1`, [id]);
    const result = await client.query(`DELETE FROM equipment_inspections WHERE id = $1`, [id]);
    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data inspeksi berhasil dihapus',
    });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    }
    console.error('❌ Error deleting powerhouse inspection:', error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error)?.message || 'Gagal menghapus data inspeksi',
        error: (error as Error)?.message,
        detail: (error as any)?.detail,
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  let client;

  try {
    const body = await request.json();
    const { values, scorePercent, ngItems } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID inspeksi diperlukan' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query('BEGIN');

    let query = `UPDATE equipment_inspections SET updated_at = CURRENT_TIMESTAMP`;
    const paramsList: any[] = [];
    let pIndex = 1;

    if (values !== undefined) {
      query += `, values_data = $${pIndex++}`;
      paramsList.push(JSON.stringify(values));
    }

    if (scorePercent !== undefined) {
      query += `, score_percent = $${pIndex++}`;
      paramsList.push(scorePercent);
    }

    query += ` WHERE id = $${pIndex} RETURNING *`;
    paramsList.push(id);

    const result = await client.query(query, paramsList);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Sinkronisasi tabel inspection_ng_items jika ngItems dikirim
    if (Array.isArray(ngItems)) {
      await client.query(`DELETE FROM inspection_ng_items WHERE inspection_id = $1`, [id]);

      for (const ng of ngItems) {
        await client.query(
          `INSERT INTO inspection_ng_items (
            inspection_id, field_key, field_label, kondisi_aktual, tindakan_perbaikan
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            ng.itemId || 'unknown',
            ng.label || ng.itemId || 'Item Temuan',
            ng.kondisiAktual || 'Kondisi NG terdeteksi',
            ng.tindakanPerbaikan || null,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Data inspeksi berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    }
    console.error('❌ Error updating powerhouse inspection:', error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error)?.message || 'Gagal memperbarui data inspeksi',
        error: (error as Error)?.message,
        detail: (error as any)?.detail,
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
