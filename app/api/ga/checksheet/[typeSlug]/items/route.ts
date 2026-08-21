// app/api/ga/checksheet/[typeSlug]/items/route.ts

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

    console.log('🔍 Fetching items for type:', typeSlug);

    const typesResult = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1 AND is_active = TRUE`,
      [typeSlug]
    );

    if (typesResult.rows.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;
    console.log('✅ Type ID:', typeId);

    const itemsResult = await pool.query(
      `
      SELECT id, item_key, no, item_group, item_check, method, image
      FROM ga_checksheet_items
      WHERE type_id = $1 AND is_active = TRUE
      ORDER BY sort_order ASC, no ASC
      `,
      [typeId]
    );

    console.log('✅ Found', itemsResult.rows.length, 'items');
    
    return NextResponse.json({ 
      success: true, 
      data: itemsResult.rows 
    });
  } catch (error) {
    console.error('❌ Error fetching checklist items:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data checklist items' },
      { status: 500 }
    );
  }
}