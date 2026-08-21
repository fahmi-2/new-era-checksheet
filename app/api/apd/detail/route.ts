// app/api/apd/detail/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// Type untuk record APD
interface ApdRecord {
  id: number;
  nama: string;
  nik: string;
  tanggal_pengambilan: string;
  dept_job_desc: string;
  jumlah: number;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

// Type untuk item APD
interface ApdItem {
  id: number;
  record_id: number;
  no: number;
  nama_barang: string;
  keterangan: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID diperlukan' },
        { status: 400 }
      );
    }

    // ⚠️ FIX 1: Jangan destructuring array, akses langsung result
    // ⚠️ FIX 2: Gunakan $1 untuk PostgreSQL, bukan ?
    const recordResult = await pool.query<ApdRecord>(
      `SELECT * FROM apd_records WHERE id = $1`,
      [id]
    );

    // ⚠️ FIX 3: Akses .rows dari QueryResult
    const records = recordResult.rows;
    
    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get items dengan parameterized query PostgreSQL
    const itemsResult = await pool.query<ApdItem>(
      `SELECT * FROM apd_items WHERE record_id = $1 ORDER BY no ASC`,
      [id]
    );

    const items = itemsResult.rows;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...records[0],
          items: items
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get detail error:', error);
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