// app/api/lift-barang/preventive/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface HeaderRow {
  id: number;
  inspection_date: string;
  inspector: string;
  inspector_nik: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const headerRows = await pool.query(
      'SELECT * FROM preventive_header WHERE id = $1',
      [Number(id)]
    );

    if (headerRows.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    const header = headerRows.rows[0] as HeaderRow;

    const itemRows = await pool.query(
      'SELECT * FROM preventive_items WHERE header_id = $1',
      [Number(id)]
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

    return NextResponse.json({
      success: true,
      data: {
        id: header.id.toString(),
        date: header.inspection_date,
        inspector: header.inspector,
        inspector_nik: header.inspector_nik,
        items: items,
        additionalNotes: header.additional_notes,
        created_at: header.created_at,
        updated_at: header.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error fetching preventive record:', error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items, additional_notes } = body;

    if (items) {
      if (typeof items !== 'object') {
        return NextResponse.json(
          { success: false, message: 'Items must be an object' },
          { status: 400 }
        );
      }

      for (const [key, value] of Object.entries(items)) {
        const item = value as any;

        if (item.status && !['OK', 'NG'].includes(item.status)) {
          return NextResponse.json(
            { success: false, message: `Item ${key}: Status harus 'OK' atau 'NG'` },
            { status: 400 }
          );
        }

        if (item.status === 'NG' && (!item.keterangan || !item.keterangan.trim())) {
          return NextResponse.json(
            { success: false, message: `Item ${key}: Keterangan wajib diisi untuk status NG` },
            { status: 400 }
          );
        }
      }
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let updateHeaderQuery = `
        UPDATE preventive_header
        SET updated_at = CURRENT_TIMESTAMP
      `;
      const updateHeaderParams: any[] = [];

      if (additional_notes !== undefined) {
        updateHeaderQuery += ', additional_notes = $' + (updateHeaderParams.length + 1);
        updateHeaderParams.push(additional_notes);
      }

      updateHeaderQuery += ' WHERE id = $' + (updateHeaderParams.length + 1);
      updateHeaderParams.push(Number(id));

      const headerResult = await client.query(updateHeaderQuery, updateHeaderParams);

      if (headerResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Record not found' },
          { status: 404 }
        );
      }

      if (items) {
        const itemUpdates = Object.entries(items).map(async ([itemKey, itemData]) => {
          const item = itemData as any;

          return client.query(
            `UPDATE preventive_items
             SET status = $1, keterangan = $2, foto_path = $3
             WHERE header_id = $4 AND item_id = $5`,
            [
              item.status,
              item.keterangan || '',
              item.foto_path || null,
              Number(id),
              Number(itemKey)
            ]
          );
        });

        await Promise.all(itemUpdates);
      }

      await client.query('COMMIT');

      const headerRows = await client.query(
        'SELECT * FROM preventive_header WHERE id = $1',
        [Number(id)]
      );

      const headerRecord = headerRows.rows[0] as HeaderRow;

      const itemRows = await client.query(
        'SELECT * FROM preventive_items WHERE header_id = $1',
        [Number(id)]
      );

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
        message: 'Record updated successfully',
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
    console.error('❌ Error updating preventive record:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        'DELETE FROM preventive_items WHERE header_id = $1',
        [Number(id)]
      );

      const deleteResult = await client.query(
        'DELETE FROM preventive_header WHERE id = $1',
        [Number(id)]
      );

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Record not found' },
          { status: 404 }
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Record deleted successfully',
        data: { id }
      });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);

      if (transactionError instanceof Error) {
        if (transactionError.message.includes('violates foreign key constraint')) {
          return NextResponse.json(
            {
              success: false,
              message: 'Error relasi database. Pastikan tidak ada data yang terkait.',
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
    console.error('❌ Error deleting preventive record:', error);
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