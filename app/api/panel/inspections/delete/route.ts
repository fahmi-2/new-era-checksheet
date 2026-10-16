// app/api/panel/inspections/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID inspeksi panel wajib disertakan' },
        { status: 400 }
      );
    }

    const checkResult = await pool.query(
      'SELECT id FROM panel_inspections WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Since panel_readings has ON DELETE CASCADE on inspection_id, deleting from panel_inspections will automatically delete panel_readings
    await pool.query('DELETE FROM panel_inspections WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Data inspeksi panel berhasil dihapus',
      id,
    });
  } catch (error) {
    console.error('❌ Delete panel inspection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menghapus data inspeksi panel',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
