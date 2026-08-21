// app/api/apd/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID diperlukan' },
        { status: 400 }
      );
    }

    // ✅ FIX 1: Use $1 for PostgreSQL parameterized query
    // ✅ FIX 2: Use rowCount instead of affectedRows
    const result = await pool.query(
      `DELETE FROM apd_records WHERE id = $1`,  // ✅ $1 not ?
      [id]
    );

    // ✅ PostgreSQL returns rowCount, not affectedRows
    if (result.rowCount === 0) {  // ✅ rowCount not affectedRows
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Data APD berhasil dihapus'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete APD error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: (error as Error).message  // ✅ Use Error type for safety
      },
      { status: 500 }
    );
  }
}