// app/api/electrical_inspections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Tipe data untuk header
interface HeaderRow {
  id: number;
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Tipe data untuk item
interface ItemRow {
  id: number;
  inspection_id: number;
  item_no: number;
  item_name: string;
  item_detail: string | null;
  hasil: string;
  keterangan: string | null;
  foto_path: string | null;
  created_at: string;
}

// Type helper untuk params (Next.js 15+)
type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // ⚠️ Await params karena bertipe Promise di Next.js 15+
    const { id } = await params;
    
    // Validasi ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const numericId = Number(id);

    // Get header
    const headerResult = await pool.query<HeaderRow>(
      'SELECT * FROM electrical_inspections WHERE id = $1',
      [numericId]
    );

    if (headerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    const header = headerResult.rows[0];

    // Get items
    const itemResult = await pool.query<ItemRow>(
      'SELECT * FROM electrical_inspection_details WHERE inspection_id = $1 ORDER BY item_no ASC',
      [numericId]
    );

    // Format data untuk response
    const items: Record<number, {
      hasil: string;
      keterangan: string;
      foto_path: string | null;
    }> = {};
    
    itemResult.rows.forEach((item: ItemRow) => {
      items[item.item_no] = {
        hasil: item.hasil,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: header.id.toString(),
        type: header.type,
        tanggal: header.tanggal,
        area: header.area,
        pic: header.pic,
        items: items,
        additionalNotes: header.additional_notes,
        createdAt: header.created_at,
        updatedAt: header.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching inspection record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // ⚠️ Await params karena bertipe Promise di Next.js 15+
    const { id } = await params;
    
    // Validasi ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const numericId = Number(id);

    // Delete dari database
    const result = await pool.query(
      'DELETE FROM electrical_inspections WHERE id = $1',
      [numericId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting inspection record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}