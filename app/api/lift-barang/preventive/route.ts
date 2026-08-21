// app/api/lift-barang/preventive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Tipe data untuk header
interface HeaderRow {
  id: number;
  inspection_date: string;
  inspector: string;
  inspector_nik: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Tipe data untuk item
interface ItemRow {
  id: number;
  header_id: number;
  item_id: number;
  item_name: string;
  equipment_support: string;
  langkah_kerja: string;
  standar: string;
  status: string;
  keterangan: string | null;
  foto_path: string | null;
  created_at: string;
  updated_at: string;
}

// Fungsi untuk mendapatkan nama item berdasarkan ID
function getItemName(id: number): string {
  const items: Record<number, string> = {
    1: "Hook Lift",
    2: "Sling / Wire Rope",
    3: "Holder Plate / Cantolan Hook",
    4: "Roda Penggerak naik turun",
    5: "Limit Switch"
  };
  return items[id] || `Item ${id}`;
}

// Fungsi untuk mendapatkan detail item berdasarkan ID
function getItemDetails(id: number): {
  item_name: string;
  equipment_support: string;
  langkah_kerja: string;
  standar: string;
} {
  const items: Record<number, {
    item_name: string;
    equipment_support: string;
    langkah_kerja: string;
    standar: string;
  }> = {
    1: {
      item_name: "Hook Lift",
      equipment_support: "Dye Penetrant Test",
      langkah_kerja: "Spray",
      standar: "Tidak ada keretakan"
    },
    2: {
      item_name: "Sling / Wire Rope",
      equipment_support: "Grease wire rope",
      langkah_kerja: "Spray / oles",
      standar: "Terlumasi"
    },
    3: {
      item_name: "Holder Plate / Cantolan Hook",
      equipment_support: "Dye Penetrant Test",
      langkah_kerja: "Spray",
      standar: "Tidak ada keretakan"
    },
    4: {
      item_name: "Roda Penggerak naik turun",
      equipment_support: "Grease",
      langkah_kerja: "Oles",
      standar: "Terlumasi"
    },
    5: {
      item_name: "Limit Switch",
      equipment_support: "Kunci Foding",
      langkah_kerja: "Mengencangkan Baut",
      standar: "Kepekaan Mendeteksi"
    }
  };
  
  return items[id] || {
    item_name: `Item ${id}`,
    equipment_support: "",
    langkah_kerja: "",
    standar: ""
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inspection_date, inspector, inspector_nik, items, additional_notes } = body;

    // Validasi input
    if (!inspection_date || !inspector || !items) {
      return NextResponse.json(
        { success: false, message: 'Inspection date, inspector, and items are required' },
        { status: 400 }
      );
    }

    // Validasi items structure
    if (typeof items !== 'object' || Object.keys(items).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Items must be a non-empty object' },
        { status: 400 }
      );
    }

    // Validasi setiap item
    for (const [key, value] of Object.entries(items)) {
      const item = value as any;
      
      if (!item.status || !['OK', 'NG'].includes(item.status)) {
        return NextResponse.json(
          { success: false, message: `Item ${key}: Status harus 'OK' atau 'NG'` },
          { status: 400 }
        );
      }

      // Validasi keterangan untuk status NG
      if (item.status === 'NG' && (!item.keterangan || !item.keterangan.trim())) {
        return NextResponse.json(
          { success: false, message: `Item ${key}: Keterangan wajib diisi untuk status NG` },
          { status: 400 }
        );
      }
    }

    // Mulai transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert ke database - header
      const headerResult = await client.query(
        `INSERT INTO preventive_header 
         (inspection_date, inspector, inspector_nik, additional_notes) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [inspection_date, inspector, inspector_nik || null, additional_notes || null]
      );
      
      const headerId = headerResult.rows[0].id;
      console.log(`✅ Header inserted with ID: ${headerId}`);

      // Insert ke database - items
      const itemPromises = Object.entries(items).map(async ([id, itemData]) => {
        const itemId = Number(id);
        const item = itemData as any;
        const details = getItemDetails(itemId);
        
        await client.query(
          `INSERT INTO preventive_items 
           (header_id, item_id, item_name, equipment_support, langkah_kerja, standar, status, keterangan, foto_path) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            headerId,
            itemId,
            details.item_name,
            details.equipment_support,
            details.langkah_kerja,
            details.standar,
            item.status,
            item.keterangan || '',
            item.foto_path || null
          ]
        );
      });

      await Promise.all(itemPromises);
      console.log(`✅ ${Object.keys(items).length} items inserted`);

      // Commit transaction
      await client.query('COMMIT');
      
      // Ambil data yang baru disimpan
      const headerRows = await client.query(
        'SELECT * FROM preventive_header WHERE id = $1',
        [headerId]
      );

      const headerRecord = headerRows.rows[0] as HeaderRow;

      // Ambil item
      const itemRows = await client.query(
        'SELECT * FROM preventive_items WHERE header_id = $1',
        [headerId]
      );

      // Format data untuk response
      const formattedItems: Record<number, {
        status: string;
        keterangan: string;
        foto_path: string | null;
      }> = {};
      
      itemRows.rows.forEach((item: ItemRow) => {
        formattedItems[item.item_id] = {
          status: item.status,
          keterangan: item.keterangan || '',
          foto_path: item.foto_path
        };
      });

      return NextResponse.json({
        success: true,
        message: 'Preventive maintenance record created successfully',
        data: {
          id: headerRecord.id.toString(),
          date: headerRecord.inspection_date,
          inspector: headerRecord.inspector,
          inspector_nik: headerRecord.inspector_nik,
          items: formattedItems,
          additionalNotes: headerRecord.additional_notes,
          created_at: headerRecord.created_at,
          updated_at: headerRecord.updated_at
        }
      });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);
      
      // Deteksi error spesifik PostgreSQL
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Struktur tabel tidak sesuai. Periksa kolom di tabel preventive_header/preventive_items',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('violates foreign key constraint')) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Error relasi database. Pastikan data referensi valid',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
      }
      
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 Connection released');
    }

  } catch (error) {
    console.error('❌ Error creating preventive record:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 10)
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const inspector = searchParams.get('inspector');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mulai transaction
    const client = await pool.connect();
    try {
      // Query untuk mendapatkan records
      let query = `
        SELECT h.* 
        FROM preventive_header h
        WHERE 1=1
      `;
      const params: any[] = [];

      // Filter by date
      if (date) {
        query += ' AND h.inspection_date = $' + (params.length + 1);
        params.push(date);
      }

      // Filter by inspector
      if (inspector) {
        query += ' AND h.inspector = $' + (params.length + 1);
        params.push(inspector);
      }

      // Order by created_at descending
      query += ' ORDER BY h.created_at DESC';

      // Pagination
      query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const headerRows = await client.query(query, params);
      
      // Ambil total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM preventive_header h
        WHERE 1=1
      `;
      const countParams: any[] = [];

      if (date) {
        countQuery += ' AND h.inspection_date = $' + (countParams.length + 1);
        countParams.push(date);
      }

      if (inspector) {
        countQuery += ' AND h.inspector = $' + (countParams.length + 1);
        countParams.push(inspector);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Ambil item untuk setiap header
      const result: Array<{
        id: string;
        date: string;
        inspector: string;
        inspector_nik: string | null;
        items: Record<number, {
          status: string;
          keterangan: string;
          foto_path: string | null;
        }>;
        additionalNotes: string | null;
        created_at: string;
        updated_at: string;
      }> = [];
      
      for (const header of headerRows.rows) {
        const itemRows = await client.query(
          'SELECT * FROM preventive_items WHERE header_id = $1',
          [header.id]
        );
        
        const items: Record<number, {
          status: string;
          keterangan: string;
          foto_path: string | null;
        }> = {};
        
        itemRows.rows.forEach((item: ItemRow) => {
          items[item.item_id] = {
            status: item.status,
            keterangan: item.keterangan || '',
            foto_path: item.foto_path
          };
        });
        
        result.push({
          id: header.id.toString(),
          date: header.inspection_date,
          inspector: header.inspector,
          inspector_nik: header.inspector_nik,
          items: items,
          additionalNotes: header.additional_notes,
          created_at: header.created_at,
          updated_at: header.updated_at
        });
      }

      return NextResponse.json({
        success: true,
        data: result,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });

    } finally {
      client.release();
      console.log('🔓 Connection released');
    }

  } catch (error) {
    console.error('❌ Error fetching preventive records:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 10)
        } : undefined
      },
      { status: 500 }
    );
  }
}