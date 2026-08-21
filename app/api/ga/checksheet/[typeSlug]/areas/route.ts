// app/api/ga/checksheet/[typeSlug]/areas/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RouteParams = {
  typeSlug: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { typeSlug } = await params;
    
    if (!typeSlug) {
      return NextResponse.json(
        { success: false, message: 'Type slug tidak ditemukan' },
        { status: 400 }
      );
    }

    const typesResult = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1 AND is_active = TRUE`,
      [typeSlug]
    );

    if (!typesResult.rows || typesResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;

    const areasResult = await pool.query(
      `
      SELECT id, no, name, location
      FROM ga_checksheet_areas
      WHERE type_id = $1 AND is_active = TRUE
      ORDER BY no ASC
      `,
      [typeId]
    );

    return NextResponse.json({
      success: true,
      data: areasResult.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching areas:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data area' },
      { status: 500 }
    );
  }
}

// ✅ POST: Tambah area baru
export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const client = await pool.connect();
  
  try {
    const { typeSlug } = await params;
    const body = await request.json();
    const { no, name, location, type_id, is_active = true } = body;

    // Validasi
    if (!no || !name || !type_id) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Cek type
    const typesResult = await client.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1`,
      [typeSlug]
    );

    if (typesResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;

    // Cek duplikasi (no harus unique per type)
    const existingResult = await client.query(
      `SELECT id FROM ga_checksheet_areas WHERE type_id = $1 AND no = $2`,
      [typeId, no]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Nomor area sudah digunakan' },
        { status: 400 }
      );
    }

    // Insert area baru
    const insertResult = await client.query(
      `
      INSERT INTO ga_checksheet_areas
      (type_id, no, name, location, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, no, name, location
      `,
      [typeId, no, name, location || '', is_active]
    );

    const newArea = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Area berhasil ditambahkan',
      data: newArea
    });
  } catch (error) {
    console.error('❌ Error creating area:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan data area' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}