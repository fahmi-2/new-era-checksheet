// app/api/pintu-darurat/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface PintuDaruratItem {
  itemId?: number | null;
  no?: number;
  lokasi: string;
  kondisiPintu: 'OK' | 'NG';
  areaSekitar: 'OK' | 'NG';
  paluAlatBantu: 'OK' | 'NG';
  identitasPintu: 'OK' | 'NG';
  idPeringatan: 'OK' | 'NG';
  doorCloser: 'OK' | 'NG';
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
  items?: PintuDaruratItem[];
  replaceItems?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const isValidStatus = (value: string): value is 'OK' | 'NG' => {
  return ['OK', 'NG'].includes(value.toUpperCase());
};

const validateItem = (item: PintuDaruratItem, index: number): { valid: boolean; error?: string } => {
  const requiredFields: (keyof PintuDaruratItem)[] = ['lokasi', 'kondisiPintu', 'areaSekitar', 'paluAlatBantu', 'identitasPintu', 'idPeringatan', 'doorCloser', 'pic'];
  
  for (const field of requiredFields) {
    const value = item[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, error: `Item #${index + 1}: Field "${field}" wajib diisi` };
    }
  }

  const statusFields: (keyof PintuDaruratItem)[] = ['kondisiPintu', 'areaSekitar', 'paluAlatBantu', 'identitasPintu', 'idPeringatan', 'doorCloser'];
  for (const field of statusFields) {
    const value = item[field] as string;
    if (!isValidStatus(value)) {
      return { valid: false, error: `Item #${index + 1}: Status "${field}" harus 'OK' atau 'NG'` };
    }
  }

  return { valid: true };
};

const getLocationId = async (client: any, name: string, type: string): Promise<number | null> => {
  try {
    const result = await client.query(
      'SELECT id FROM locations WHERE name = $1 AND type = $2 LIMIT 1',
      [name, type]
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
};

const insertItem = async (client: any, checklistId: number, item: PintuDaruratItem) => {
  const locationId = await getLocationId(client, item.lokasi, 'pintu-darurat');
  
  await client.query(
    `INSERT INTO pintu_darurat_checklist_items (
      checklist_id, location_id, location_name,
      kondisi_pintu, area_sekitar, palu_alat_bantu,
      identitas_pintu, id_peringatan, door_closer,
      keterangan, tindakan_perbaikan, pic, foto_data, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
    [
      checklistId,
      locationId,
      item.lokasi,
      item.kondisiPintu.toUpperCase(),
      item.areaSekitar.toUpperCase(),
      item.paluAlatBantu.toUpperCase(),
      item.identitasPintu.toUpperCase(),
      item.idPeringatan.toUpperCase(),
      item.doorCloser.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null
    ]
  );
};

const updateItem = async (client: any, checklistId: number, itemId: number, item: PintuDaruratItem) => {
  const locationId = await getLocationId(client, item.lokasi, 'pintu-darurat');
  
  await client.query(
    `UPDATE pintu_darurat_checklist_items 
     SET 
       location_id = $1,
       location_name = $2,
       kondisi_pintu = $3,
       area_sekitar = $4,
       palu_alat_bantu = $5,
       identitas_pintu = $6,
       id_peringatan = $7,
       door_closer = $8,
       keterangan = $9,
       tindakan_perbaikan = $10,
       pic = $11,
       foto_data = $12
     WHERE id = $13 AND checklist_id = $14`,
    [
      locationId,
      item.lokasi,
      item.kondisiPintu.toUpperCase(),
      item.areaSekitar.toUpperCase(),
      item.paluAlatBantu.toUpperCase(),
      item.identitasPintu.toUpperCase(),
      item.idPeringatan.toUpperCase(),
      item.doorCloser.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null,
      itemId,
      checklistId
    ]
  );
};

const deleteItem = async (client: any, checklistId: number, itemId: number) => {
  await client.query(
    'DELETE FROM pintu_darurat_checklist_items WHERE id = $1 AND checklist_id = $2',
    [itemId, checklistId]
  );
};

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT PINTU DARURAT === ${new Date().toISOString()}`);

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

    console.log('📦 [API] Received payload:', {
      checklistId: payload.checklistId,
      replaceItems: payload.replaceItems,
      itemsCount: payload.items?.length
    });

    if (!payload.checklistId) {
      return NextResponse.json(
        { success: false, message: 'checklistId wajib diisi' },
        { status: 400 }
      );
    }

    const checklistId = typeof payload.checklistId === 'string' 
      ? parseInt(payload.checklistId, 10) 
      : Number(payload.checklistId);

    if (isNaN(checklistId)) {
      return NextResponse.json(
        { success: false, message: 'checklistId harus berupa angka' },
        { status: 400 }
      );
    }

    const replaceItems = payload.replaceItems === true;
    console.log('🔄 [API] replaceItems normalized:', replaceItems);

    const recordCheck = await pool.query(
      'SELECT id, checklist_date, checker_name FROM pintu_darurat_checklists WHERE id = $1',
      [checklistId]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan checklistId ${checklistId} tidak ditemukan` },
        { status: 404 }
      );
    }

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
        `UPDATE pintu_darurat_checklists 
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
      
      if (replaceItems) {
        console.log('🗑️ [API] Replace mode: Deleting all existing items...');
        await client.query(
          'DELETE FROM pintu_darurat_checklist_items WHERE checklist_id = $1',
          [checklistId]
        );

        for (const item of payload.items) {
          if (item._action === 'delete') continue;
          await insertItem(client, checklistId, item);
          itemsResult.created++;
        }
        console.log(`✅ [API] Replaced with ${itemsResult.created} new items`);
        
      } else {
        console.log('✏️ [API] Incremental mode: Processing items by _action...');
        
        for (const item of payload.items) {
          
          if (item._action === 'delete' && item.itemId) {
            await deleteItem(client, checklistId, item.itemId);
            itemsResult.deleted++;
            console.log(`🗑️ [API] Deleted item ID: ${item.itemId}`);
            continue;
          }
          
          if (item._action === 'update' && item.itemId) {
            await updateItem(client, checklistId, item.itemId, item);
            itemsResult.updated++;
            console.log(`✏️ [API] Updated item ID: ${item.itemId}`);
            continue;
          }
          
          if (!item.itemId || item._action === 'create') {
            await insertItem(client, checklistId, item);
            itemsResult.created++;
            console.log(`➕ [API] Created new item: ${item.lokasi}`);
          }
        }
      }
      
      itemsProcessed = itemsResult.created + itemsResult.updated + itemsResult.deleted;
    }

    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`✅ [API] Transaction committed | Duration: ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Data Pintu Darurat berhasil diupdate',
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

    console.error('❌ [API] === ERROR EDIT PINTU DARURAT ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        userMessage = 'Data duplikat: Item dengan lokasi yang sama sudah ada';
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