// app/api/ga/checksheet/types/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, slug, name, description, frequency, is_active
      FROM ga_checksheet_types
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching checksheet types:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data jenis checksheet' },
      { status: 500 }
    );
  }
}