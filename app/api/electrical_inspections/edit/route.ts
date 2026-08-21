// app/api/electrical_inspections/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface InspectionItem {
  itemId?: number | null;      // ✅ ID dari database (untuk update/delete)
  itemNo?: number;
  hasil: 'OK' | 'NOK';
  keterangan?: string;
  foto_path?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditPayload {
  inspectionId: number;
  type?: string;
  tanggal?: string;
  area?: string;
  pic?: string;
  additional_notes?: string | null;
  items?: Record<string, InspectionItem>;  // ✅ Key = itemNo
  replaceItems?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const validateItem = (itemNo: string, item: InspectionItem): { valid: boolean; error?: string } => {
  if (!item.hasil || !['OK', 'NOK'].includes(item.hasil)) {
    return { valid: false, error: `Item ${itemNo}: Hasil harus 'OK' atau 'NOK'` };
  }

  return { valid: true };
};

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT ELECTRICAL INSPECTION === ${new Date().toISOString()}`);

  const client = await pool.connect();
  
  try {
    let payload: EditPayload;
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error('❌ [API] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Request body harus berupa JSON yang valid' },
        { status: 400 }
      );
    }

    console.log('📦 [API] Received payload:', {
      inspectionId: payload.inspectionId,
      type: payload.type,
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

    const inspectionId = typeof payload.inspectionId === 'string' 
      ? parseInt(payload.inspectionId, 10) 
      : Number(payload.inspectionId);

    if (isNaN(inspectionId)) {
      return NextResponse.json(
        { success: false, message: 'inspectionId harus berupa angka' },
        { status: 400 }
      );
    }

    // 🔍 Cek keberadaan record utama
    const recordCheck = await client.query(
      'SELECT id, type, tanggal, area, pic FROM electrical_inspections WHERE id = $1',
      [inspectionId]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan inspectionId ${inspectionId} tidak ditemukan` },
        { status: 404 }
      );
    }

    // ✅ Validasi items jika ada
    if (payload.items && typeof payload.items === 'object' && Object.keys(payload.items).length > 0) {
      for (const [itemNo, item] of Object.entries(payload.items)) {
        if (item._action === 'delete') continue;
        
        const validation = validateItem(itemNo, item);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, message: validation.error },
            { status: 400 }
          );
        }
      }
    }

    await client.query('BEGIN');
    console.log(`🔄 [API] Transaction started for inspection: ${inspectionId}`);

    // ─────────────────────────────────────────
    // 📋 UPDATE HEADER
    // ─────────────────────────────────────────
    let headerUpdated = false;
    
    if (
      payload.type !== undefined || 
      payload.tanggal !== undefined || 
      payload.area !== undefined || 
      payload.pic !== undefined ||
      payload.additional_notes !== undefined
    ) {
      const updateClauses: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (payload.type !== undefined) {
        updateClauses.push(`type = $${paramIdx++}`);
        params.push(payload.type || null);
      }
      if (payload.tanggal !== undefined) {
        updateClauses.push(`tanggal = $${paramIdx++}`);
        params.push(payload.tanggal || null);
      }
      if (payload.area !== undefined) {
        updateClauses.push(`area = $${paramIdx++}`);
        params.push(payload.area || null);
      }
      if (payload.pic !== undefined) {
        updateClauses.push(`pic = $${paramIdx++}`);
        params.push(payload.pic || null);
      }
      if (payload.additional_notes !== undefined) {
        updateClauses.push(`additional_notes = $${paramIdx++}`);
        params.push(payload.additional_notes);
      }

      updateClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(inspectionId);

      await client.query(
        `UPDATE electrical_inspections 
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
    const replaceItems = payload.replaceItems === true;

    if (payload.items && typeof payload.items === 'object' && Object.keys(payload.items).length > 0) {
      
      // 🗑️ MODE: Replace All Items
      if (replaceItems) {
        console.log('🗑️ [API] Replace mode: Deleting all existing items...');
        await client.query(
          'DELETE FROM electrical_inspection_details WHERE inspection_id = $1',
          [inspectionId]
        );

        for (const [itemNo, item] of Object.entries(payload.items)) {
          if (item._action === 'delete') continue;
          
          await client.query(
            `INSERT INTO electrical_inspection_details (
              inspection_id, item_no, item_name, item_detail, hasil, keterangan, foto_path, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
              inspectionId,
              parseInt(itemNo),
              `Item ${itemNo}`,
              '',
              item.hasil,
              item.keterangan || null,
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
        
        for (const [itemNo, item] of Object.entries(payload.items)) {
          
          // 🗑️ DELETE
          if (item._action === 'delete' && item.itemId) {
            await client.query(
              'DELETE FROM electrical_inspection_details WHERE id = $1 AND inspection_id = $2',
              [item.itemId, inspectionId]
            );
            itemsResult.deleted++;
            console.log(`🗑️ [API] Deleted item ID: ${item.itemId} (Item ${itemNo})`);
            continue;
          }
          
          // ✏️ UPDATE
          if (item._action === 'update' && item.itemId) {
            await client.query(
              `UPDATE electrical_inspection_details 
               SET 
                 item_no = $1,
                 item_name = $2,
                 item_detail = $3,
                 hasil = $4,
                 keterangan = $5,
                 foto_path = $6,
                 updated_at = CURRENT_TIMESTAMP
               WHERE id = $7 AND inspection_id = $8`,
              [
                parseInt(itemNo),
                `Item ${itemNo}`,
                '',
                item.hasil,
                item.keterangan || null,
                item.foto_path || null,
                item.itemId,
                inspectionId
              ]
            );
            itemsResult.updated++;
            console.log(`✏️ [API] Updated item ID: ${item.itemId} (Item ${itemNo})`);
            continue;
          }
          
          // ➕ CREATE (new item or missing itemId)
          if (!item.itemId || item._action === 'create') {
            await client.query(
              `INSERT INTO electrical_inspection_details (
                inspection_id, item_no, item_name, item_detail, hasil, keterangan, foto_path, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
              [
                inspectionId,
                parseInt(itemNo),
                `Item ${itemNo}`,
                '',
                item.hasil,
                item.keterangan || null,
                item.foto_path || null
              ]
            );
            itemsResult.created++;
            console.log(`➕ [API] Created new item: Item ${itemNo}`);
          }
        }
      }
    }

    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`✅ [API] Transaction committed | Duration: ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Data Inspeksi Listrik berhasil diupdate',
        data: {
          inspectionId: inspectionId,
          updated: {
            header: headerUpdated,
            items: itemsResult.created + itemsResult.updated + itemsResult.deleted,
            breakdown: itemsResult
          },
          mode: {
            replaceItems: replaceItems,
            incremental: !replaceItems
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.log('🔄 [API] Transaction rolled back');

    console.error('❌ [API] === ERROR EDIT ELECTRICAL INSPECTION ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        userMessage = 'Data duplikat: Item dengan nomor yang sama sudah ada';
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
    client.release();
    console.log('🔓 [API] Database connection released');
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