// app/api/exit-lamp/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface ExitLampItem {
  itemId?: number | null;
  no?: number;
  id: string;
  lokasi: string;
  kondisiLampu: 'OK' | 'NG';
  indikatorLampu: 'OK' | 'NG';
  kebersihan: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditPayload {
  checklistId: number;
  date?: string;
  checker?: string;
  nik?: string | null;
  department?: string | null;
  items?: ExitLampItem[];
  replaceItems?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Validasi status field hanya menerima 'OK' atau 'NG'
 */
const isValidStatus = (value: string): value is 'OK' | 'NG' => {
  return ['OK', 'NG'].includes(value.toUpperCase());
};

/**
 * Validasi item wajib lengkap sebelum diproses
 */
const validateItem = (item: ExitLampItem, index: number): { valid: boolean; error?: string } => {
  const requiredFields: (keyof ExitLampItem)[] = ['id', 'lokasi', 'kondisiLampu', 'indikatorLampu', 'kebersihan', 'pic'];
  
  for (const field of requiredFields) {
    const value = item[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, error: `Item #${index + 1}: Field "${field}" wajib diisi` };
    }
  }

  const statusFields: (keyof ExitLampItem)[] = ['kondisiLampu', 'indikatorLampu', 'kebersihan'];
  for (const field of statusFields) {
    const value = item[field] as string;
    if (!isValidStatus(value)) {
      return { valid: false, error: `Item #${index + 1}: Status "${field}" harus 'OK' atau 'NG'` };
    }
  }

  return { valid: true };
};

/**
 * Lookup location_id dari tabel locations
 */
const getLocationId = async (client: any, code: string, type: string): Promise<number | null> => {
  try {
    const result = await client.query(
      'SELECT id FROM locations WHERE code = $1 AND type = $2 LIMIT 1',
      [code, type]
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
};

/**
 * Insert item baru ke database
 */
const insertItem = async (client: any, checklistId: number, item: ExitLampItem) => {
  const locationId = await getLocationId(client, item.id, 'exit-lamp');
  
  await client.query(
    `INSERT INTO exit_lamp_checklist_items (
      checklist_id, location_id, location_code, location_name,
      kondisi_lampu, indikator_lampu, kebersihan,
      keterangan, tindakan_perbaikan, pic, foto_data, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
    [
      checklistId,
      locationId,
      item.id,
      item.lokasi,
      item.kondisiLampu.toUpperCase(),
      item.indikatorLampu.toUpperCase(),
      item.kebersihan.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null
    ]
  );
};

/**
 * Update item existing di database
 */
// Di fungsi updateItem, hapus baris ini:
// updated_at = CURRENT_TIMESTAMP

// Atau biarkan tapi handle error jika kolom tidak ada:
const updateItem = async (client: any, checklistId: number, itemId: number, item: ExitLampItem) => {
  const locationId = await getLocationId(client, item.id, 'exit-lamp');
  
  // Cek apakah kolom updated_at ada
  const hasUpdatedAt = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'exit_lamp_checklist_items' 
      AND column_name = 'updated_at'
    )
  `);
  
  const updatedAtClause = hasUpdatedAt.rows[0].exists 
    ? ', updated_at = CURRENT_TIMESTAMP' 
    : '';
  
  await client.query(
    `UPDATE exit_lamp_checklist_items 
     SET 
       location_id = $1,
       location_code = $2,
       location_name = $3,
       kondisi_lampu = $4,
       indikator_lampu = $5,
       kebersihan = $6,
       keterangan = $7,
       tindakan_perbaikan = $8,
       pic = $9,
       foto_data = $10
       ${updatedAtClause}
     WHERE id = $11 AND checklist_id = $12`,
    [
      locationId,
      item.id,
      item.lokasi,
      item.kondisiLampu.toUpperCase(),
      item.indikatorLampu.toUpperCase(),
      item.kebersihan.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null,
      itemId,
      checklistId
    ]
  );
};
/**
 * Delete item dari database
 */
const deleteItem = async (client: any, checklistId: number, itemId: number) => {
  await client.query(
    'DELETE FROM exit_lamp_checklist_items WHERE id = $1 AND checklist_id = $2',
    [itemId, checklistId]
  );
};

// app/api/exit-lamp/edit/route.ts

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT EXIT LAMP === ${new Date().toISOString()}`);

  let client;
  
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

    // 🔍 Debug log
    console.log('📦 [API] Received payload:', {
      checklistId: payload.checklistId,
      replaceItems: payload.replaceItems,
      replaceItemsType: typeof payload.replaceItems,
      itemsCount: payload.items?.length
    });

    // 🔐 Validasi checklistId - TERIMA STRING ATAU NUMBER
    if (!payload.checklistId) {
      return NextResponse.json(
        { success: false, message: 'checklistId wajib diisi' },
        { status: 400 }
      );
    }

    // Konversi ke number jika string
    const checklistId = typeof payload.checklistId === 'string' 
      ? parseInt(payload.checklistId, 10) 
      : Number(payload.checklistId);

    if (isNaN(checklistId)) {
      return NextResponse.json(
        { success: false, message: 'checklistId harus berupa angka' },
        { status: 400 }
      );
    }

    // ✅ NORMALISASI replaceItems (pastikan boolean)
    const replaceItems = payload.replaceItems === true;
    
    console.log('🔄 [API] replaceItems normalized:', replaceItems);

    // 🔍 Cek keberadaan record utama
    const recordCheck = await pool.query(
      'SELECT id, checklist_date, checker_name FROM exit_lamp_checklists WHERE id = $1',
      [checklistId]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan checklistId ${checklistId} tidak ditemukan` },
        { status: 404 }
      );
    }

    // ✅ Validasi items jika ada
    if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
      for (let i = 0; i < payload.items.length; i++) {
        const item = payload.items[i];
        if (item._action === 'delete') continue;
        
        const validation = validateItem(item, i);
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
    console.log(`🔄 [API] Transaction started for checklist: ${checklistId}`);

    // ─────────────────────────────────────────
    // 📋 UPDATE HEADER
    // ─────────────────────────────────────────
    let headerUpdated = false;
    
    if (
      payload.date !== undefined || 
      payload.checker !== undefined || 
      payload.nik !== undefined || 
      payload.department !== undefined
    ) {
      const updateClauses: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (payload.date !== undefined) {
        updateClauses.push(`checklist_date = $${paramIdx++}`);
        params.push(payload.date || null);
      }
      if (payload.checker !== undefined) {
        updateClauses.push(`checker_name = $${paramIdx++}`);
        params.push(payload.checker || null);
      }
      if (payload.nik !== undefined) {
        updateClauses.push(`checker_nik = $${paramIdx++}`);
        params.push(payload.nik);
      }
      if (payload.department !== undefined) {
        updateClauses.push(`checker_dept = $${paramIdx++}`);
        params.push(payload.department);
      }

      updateClauses.push(`submitted_at = CURRENT_TIMESTAMP`);
      params.push(checklistId);

      await client.query(
        `UPDATE exit_lamp_checklists 
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
    let itemsProcessed = 0;
    const itemsResult = { created: 0, updated: 0, deleted: 0 };

    if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
      
      // 🗑️ MODE: Replace All Items
      if (replaceItems) {
        console.log('🗑️ [API] Replace mode: Deleting all existing items...');
        await client.query(
          'DELETE FROM exit_lamp_checklist_items WHERE checklist_id = $1',
          [checklistId]
        );

        for (const item of payload.items) {
          if (item._action === 'delete') continue;
          await insertItem(client, checklistId, item);
          itemsResult.created++;
        }
        console.log(`✅ [API] Replaced with ${itemsResult.created} new items`);
        
      } 
      // ✏️ MODE: Incremental Update (Default)
      else {
        console.log('✏️ [API] Incremental mode: Processing items by _action...');
        
        for (const item of payload.items) {
          
          // 🗑️ DELETE
          if (item._action === 'delete' && item.itemId) {
            await deleteItem(client, checklistId, item.itemId);
            itemsResult.deleted++;
            console.log(`🗑️ [API] Deleted item ID: ${item.itemId}`);
            continue;
          }
          
          // ✏️ UPDATE
          if (item._action === 'update' && item.itemId) {
            await updateItem(client, checklistId, item.itemId, item);
            itemsResult.updated++;
            console.log(`✏️ [API] Updated item ID: ${item.itemId}`);
            continue;
          }
          
          // ➕ CREATE (new item or missing itemId)
          if (!item.itemId || item._action === 'create') {
            await insertItem(client, checklistId, item);
            itemsResult.created++;
            console.log(`➕ [API] Created new item: ${item.id}`);
          }
        }
      }
      
      itemsProcessed = itemsResult.created + itemsResult.updated + itemsResult.deleted;
    }

    // ✅ Commit Transaction
    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`✅ [API] Transaction committed | Duration: ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Data Exit Lamp berhasil diupdate',
        data: {
          checklistId: checklistId,
          updated: {
            header: headerUpdated,
            items: itemsProcessed,
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
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 [API] Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ [API] Rollback failed:', rollbackError);
      }
    }

    console.error('❌ [API] === ERROR EDIT EXIT LAMP ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        userMessage = 'Data duplikat: Item dengan kode/lokasi yang sama sudah ada';
        statusCode = 409;
      } else if (msg.includes('foreign key') || msg.includes('does not exist')) {
        userMessage = 'Referensi data tidak valid. Periksa ID lokasi atau checklist';
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
// ─────────────────────────────────────────────────────────────
// 🛡️ OPTIONAL: Add method not allowed handler
// ─────────────────────────────────────────────────────────────
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