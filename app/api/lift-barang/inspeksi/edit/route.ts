// app/api/lift-barang/inspeksi/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface InspectionItem {
  itemId?: number | null;      // ✅ ID dari database (untuk update/delete)
  subItemId?: string;
  status: 'OK' | 'NG';
  keterangan?: string;
  solusi?: string;
  foto_path?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditPayload {
  inspectionId: string;         // ✅ ID inspeksi yang mau diedit
  inspection_date?: string;
  inspector?: string;
  inspector_nik?: string | null;
  items?: Record<string, InspectionItem>;  // ✅ Key = subItemId
  replaceItems?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const validateItem = (subItemId: string, item: InspectionItem): { valid: boolean; error?: string } => {
  // Validasi status
  if (!item.status || !['OK', 'NG'].includes(item.status)) {
    return { valid: false, error: `Item ${subItemId}: Status harus 'OK' atau 'NG'` };
  }

  // Jika NG, keterangan dan solusi wajib diisi
  if (item.status === 'NG') {
    const keterangan = item.keterangan?.trim() || '';
    const solusi = item.solusi?.trim() || '';
    
    if (!keterangan || !solusi) {
      return { valid: false, error: `Item ${subItemId}: Untuk status NG, keterangan dan solusi wajib diisi` };
    }
  }

  return { valid: true };
};

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT INSPEKSI LIFT BARANG === ${new Date().toISOString()}`);

  let client;
  
  try {
    // 📥 Parse & Validate Payload
    let payload: EditPayload;
    try {
      const text = await request.text();
      payload = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ [API] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Request body harus berupa JSON yang valid' },
        { status: 400 }
      );
    }

    console.log('📦 [API] Received payload:', {
      inspectionId: payload.inspectionId,
      replaceItems: payload.replaceItems,
      itemsCount: payload.items ? Object.keys(payload.items).length : 0
    });

    // 🔐 Validasi inspectionId
    if (!payload.inspectionId) {
      return NextResponse.json(
        { success: false, message: 'inspectionId wajib diisi' },
        { status: 400 }
      );
    }

    // 🔍 Cek keberadaan record utama
    const recordCheck = await pool.query(
      'SELECT id, inspection_date, inspector, inspector_nik FROM lift_barang_inspections WHERE id = $1 AND inspection_type = $2',
      [payload.inspectionId, 'inspeksi']
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan inspectionId ${payload.inspectionId} tidak ditemukan` },
        { status: 404 }
      );
    }

    // ✅ Validasi items jika ada
    if (payload.items && typeof payload.items === 'object' && Object.keys(payload.items).length > 0) {
      for (const [subItemId, item] of Object.entries(payload.items)) {
        if (item._action === 'delete') continue;
        
        const validation = validateItem(subItemId, item);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, message: validation.error },
            { status: 400 }
          );
        }
      }
    }

    // 🗄️ Mulai Transaction
    client = await pool.connect();
    await client.query('BEGIN');
    console.log(`🔄 [API] Transaction started for inspection: ${payload.inspectionId}`);

    // ─────────────────────────────────────────
    // 📋 UPDATE HEADER
    // ─────────────────────────────────────────
    let headerUpdated = false;
    
    if (
      payload.inspection_date !== undefined || 
      payload.inspector !== undefined || 
      payload.inspector_nik !== undefined
    ) {
      const updateClauses: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (payload.inspection_date !== undefined) {
        updateClauses.push(`inspection_date = $${paramIdx++}`);
        params.push(payload.inspection_date || null);
      }
      if (payload.inspector !== undefined) {
        updateClauses.push(`inspector = $${paramIdx++}`);
        params.push(payload.inspector || null);
      }
      if (payload.inspector_nik !== undefined) {
        updateClauses.push(`inspector_nik = $${paramIdx++}`);
        params.push(payload.inspector_nik);
      }

      updateClauses.push(`submitted_at = CURRENT_TIMESTAMP`);
      params.push(payload.inspectionId);

      await client.query(
        `UPDATE lift_barang_inspections 
         SET ${updateClauses.join(', ')} 
         WHERE id = $${paramIdx}`,
        params
      );
      headerUpdated = true;
      console.log('✅ [API] Header updated');
    }

    // ─────────────────────────────────────────
    // 📦 PROCESS ITEMS
    // ─────────────────────────────────────────
    const itemsResult = { created: 0, updated: 0, deleted: 0 };

    if (payload.items && typeof payload.items === 'object' && Object.keys(payload.items).length > 0) {
      
      // 🗑️ MODE: Replace All Items
      if (payload.replaceItems) {
        console.log('🗑️ [API] Replace mode: Deleting all existing items...');
        await client.query(
          'DELETE FROM lift_barang_inspection_items WHERE inspection_id = $1',
          [payload.inspectionId]
        );

        for (const [subItemId, item] of Object.entries(payload.items)) {
          if (item._action === 'delete') continue;
          
          // Extract itemId from subItemId (e.g., "1A" -> "1")
          const itemIdMatch = subItemId.match(/^(\d+)/);
          const itemId = itemIdMatch ? itemIdMatch[1] : subItemId;

          await client.query(
            `INSERT INTO lift_barang_inspection_items (
              inspection_id, item_id, sub_item_id, status, keterangan, solusi, foto_path, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
              payload.inspectionId,
              itemId,
              subItemId,
              item.status,
              item.status === 'NG' ? (item.keterangan || '') : null,
              item.status === 'NG' ? (item.solusi || '') : null,
              item.foto_path || null
            ]
          );
          itemsResult.created++;
        }
        console.log(`✅ [API] Replaced with ${itemsResult.created} new items`);
        
      } 
      // ✏️ MODE: Incremental Update (Default)
      else {
        console.log('✏️ [API] Incremental mode: Processing items by _action...');
        
        for (const [subItemId, item] of Object.entries(payload.items)) {
          
          // 🗑️ DELETE
          if (item._action === 'delete' && item.itemId) {
            await client.query(
              'DELETE FROM lift_barang_inspection_items WHERE id = $1 AND inspection_id = $2',
              [item.itemId, payload.inspectionId]
            );
            itemsResult.deleted++;
            console.log(`🗑️ [API] Deleted item ID: ${item.itemId} (${subItemId})`);
            continue;
          }
          
          // ✏️ UPDATE
          if (item._action === 'update' && item.itemId) {
            // Extract itemId from subItemId
            const itemIdMatch = subItemId.match(/^(\d+)/);
            const itemId = itemIdMatch ? itemIdMatch[1] : subItemId;

            await client.query(
              `UPDATE lift_barang_inspection_items 
               SET 
                 item_id = $1,
                 sub_item_id = $2,
                 status = $3,
                 keterangan = $4,
                 solusi = $5,
                 foto_path = $6
               WHERE id = $7 AND inspection_id = $8`,
              [
                itemId,
                subItemId,
                item.status,
                item.status === 'NG' ? (item.keterangan || '') : null,
                item.status === 'NG' ? (item.solusi || '') : null,
                item.foto_path || null,
                item.itemId,
                payload.inspectionId
              ]
            );
            itemsResult.updated++;
            console.log(`✏️ [API] Updated item ID: ${item.itemId} (${subItemId})`);
            continue;
          }
          
          // ➕ CREATE (new item or missing itemId)
          if (!item.itemId || item._action === 'create') {
            // Extract itemId from subItemId
            const itemIdMatch = subItemId.match(/^(\d+)/);
            const itemId = itemIdMatch ? itemIdMatch[1] : subItemId;

            await client.query(
              `INSERT INTO lift_barang_inspection_items (
                inspection_id, item_id, sub_item_id, status, keterangan, solusi, foto_path, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
              [
                payload.inspectionId,
                itemId,
                subItemId,
                item.status,
                item.status === 'NG' ? (item.keterangan || '') : null,
                item.status === 'NG' ? (item.solusi || '') : null,
                item.foto_path || null
              ]
            );
            itemsResult.created++;
            console.log(`➕ [API] Created new item: ${subItemId}`);
          }
        }
      }
    }

    // ✅ Commit Transaction
    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`✅ [API] Transaction committed | Duration: ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Data Inspeksi Lift Barang berhasil diupdate',
        data: {
          inspectionId: payload.inspectionId,
          updated: {
            header: headerUpdated,
            items: itemsResult.created + itemsResult.updated + itemsResult.deleted,
            breakdown: itemsResult
          },
          mode: {
            replaceItems: payload.replaceItems || false,
            incremental: !(payload.replaceItems || false)
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 [API] Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ [API] Rollback failed:', rollbackError);
      }
    }

    console.error('❌ [API] === ERROR EDIT INSPEKSI LIFT BARANG ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        userMessage = 'Data duplikat: Item dengan kode yang sama sudah ada';
        statusCode = 409;
      } else if (msg.includes('foreign key') || msg.includes('does not exist')) {
        userMessage = 'Referensi data tidak valid. Periksa ID inspeksi atau item';
        statusCode = 400;
      } else if (msg.includes('null value in column') || msg.includes('not null')) {
        userMessage = 'Field wajib tidak boleh kosong. Periksa kembali input Anda';
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: userMessage,
        error: process.env.NODE_ENV === 'development' ? {
          type: (error as Error).name,
          message: (error as Error).message
        } : undefined
      },
      { status: statusCode }
    );

  } finally {
    if (client) {
      client.release();
      console.log('🔓 [API] Database connection released');
    }
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use PUT to edit data.' },
    { status: 405 }
  );
}

export function POST() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use PUT to edit data.' },
    { status: 405 }
  );
}

export function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use PUT to edit data.' },
    { status: 405 }
  );
}