// app/api/titik-kumpul/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface TitikKumpulItem {
  itemId?: number | null;
  no?: number;
  lokasi: string;
  areaAman: 'OK' | 'NG';
  identitasTitikKumpul: 'OK' | 'NG';
  areaMobilPMK: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface JalurEvakuasiItem {
  itemId?: number | null;
  no?: number;
  pertanyaan: string;
  hasilCek: 'OK' | 'NG';
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
  titikKumpul?: TitikKumpulItem[];
  jalurEvakuasi?: JalurEvakuasiItem[];
  replaceItems?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const isValidStatus = (value: string): value is 'OK' | 'NG' => {
  return ['OK', 'NG'].includes(value.toUpperCase());
};

const validateTitikKumpulItem = (item: TitikKumpulItem, index: number): { valid: boolean; error?: string } => {
  const requiredFields: (keyof TitikKumpulItem)[] = ['lokasi', 'areaAman', 'identitasTitikKumpul', 'areaMobilPMK', 'pic'];
  
  for (const field of requiredFields) {
    const value = item[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, error: `Titik Kumpul #${index + 1}: Field "${field}" wajib diisi` };
    }
  }

  const statusFields: (keyof TitikKumpulItem)[] = ['areaAman', 'identitasTitikKumpul', 'areaMobilPMK'];
  for (const field of statusFields) {
    const value = item[field] as string;
    if (!isValidStatus(value)) {
      return { valid: false, error: `Titik Kumpul #${index + 1}: Status "${field}" harus 'OK' atau 'NG'` };
    }
  }

  return { valid: true };
};

const validateJalurEvakuasiItem = (item: JalurEvakuasiItem, index: number): { valid: boolean; error?: string } => {
  const requiredFields: (keyof JalurEvakuasiItem)[] = ['pertanyaan', 'hasilCek', 'pic'];
  
  for (const field of requiredFields) {
    const value = item[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, error: `Jalur Evakuasi #${index + 1}: Field "${field}" wajib diisi` };
    }
  }

  if (!isValidStatus(item.hasilCek)) {
    return { valid: false, error: `Jalur Evakuasi #${index + 1}: Status "hasilCek" harus 'OK' atau 'NG'` };
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

const getQuestionId = async (client: any, questionText: string): Promise<number | null> => {
  try {
    const result = await client.query(
      'SELECT id FROM jalur_evakuasi_questions WHERE question_text = $1 LIMIT 1',
      [questionText]
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
};

const insertTitikKumpulItem = async (client: any, checklistId: number, item: TitikKumpulItem) => {
  const locationId = await getLocationId(client, item.lokasi, 'titik-kumpul');
  
  await client.query(
    `INSERT INTO titik_kumpul_items (
      checklist_id, location_id, location_name,
      area_aman, identitas_titik_kumpul, area_mobil_pmk,
      keterangan, tindakan_perbaikan, pic, foto_data, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
    [
      checklistId,
      locationId,
      item.lokasi,
      item.areaAman.toUpperCase(),
      item.identitasTitikKumpul.toUpperCase(),
      item.areaMobilPMK.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null
    ]
  );
};

const updateTitikKumpulItem = async (client: any, checklistId: number, itemId: number, item: TitikKumpulItem) => {
  const locationId = await getLocationId(client, item.lokasi, 'titik-kumpul');
  
  await client.query(
    `UPDATE titik_kumpul_items 
     SET 
       location_id = $1,
       location_name = $2,
       area_aman = $3,
       identitas_titik_kumpul = $4,
       area_mobil_pmk = $5,
       keterangan = $6,
       tindakan_perbaikan = $7,
       pic = $8,
       foto_data = $9
     WHERE id = $10 AND checklist_id = $11`,
    [
      locationId,
      item.lokasi,
      item.areaAman.toUpperCase(),
      item.identitasTitikKumpul.toUpperCase(),
      item.areaMobilPMK.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null,
      itemId,
      checklistId
    ]
  );
};

const insertJalurEvakuasiItem = async (client: any, checklistId: number, item: JalurEvakuasiItem) => {
  const questionId = await getQuestionId(client, item.pertanyaan);
  
  await client.query(
    `INSERT INTO jalur_evakuasi_items (
      checklist_id, question_id, question_text, order_number,
      hasil_cek, keterangan, tindakan_perbaikan, pic, foto_data, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
    [
      checklistId,
      questionId,
      item.pertanyaan,
      item.no || 0,
      item.hasilCek.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null
    ]
  );
};

const updateJalurEvakuasiItem = async (client: any, checklistId: number, itemId: number, item: JalurEvakuasiItem) => {
  const questionId = await getQuestionId(client, item.pertanyaan);
  
  await client.query(
    `UPDATE jalur_evakuasi_items 
     SET 
       question_id = $1,
       question_text = $2,
       order_number = $3,
       hasil_cek = $4,
       keterangan = $5,
       tindakan_perbaikan = $6,
       pic = $7,
       foto_data = $8
     WHERE id = $9 AND checklist_id = $10`,
    [
      questionId,
      item.pertanyaan,
      item.no || 0,
      item.hasilCek.toUpperCase(),
      item.keterangan?.trim() || '',
      item.tindakanPerbaikan?.trim() || '',
      item.pic.trim(),
      item.foto?.trim() || null,
      itemId,
      checklistId
    ]
  );
};

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT TITIK KUMPUL === ${new Date().toISOString()}`);

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
      titikKumpulCount: payload.titikKumpul?.length,
      jalurEvakuasiCount: payload.jalurEvakuasi?.length
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

    // ✅ CEK DUPLIKAT TANGGAL (EXCLUDE RECORD YANG SEDANG DIEDIT)
    if (payload.date) {
      const duplicateCheck = await pool.query(
        `SELECT id FROM titik_kumpul_checklists 
         WHERE checklist_date = $1 AND id != $2`,
        [payload.date, checklistId]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Data untuk tanggal ${payload.date} sudah ada.` 
          },
          { status: 409 }
        );
      }
    }

    const recordCheck = await pool.query(
      'SELECT id, checklist_date, checker_name FROM titik_kumpul_checklists WHERE id = $1',
      [checklistId]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan checklistId ${checklistId} tidak ditemukan` },
        { status: 404 }
      );
    }

    // Validasi Titik Kumpul items
    if (payload.titikKumpul && Array.isArray(payload.titikKumpul) && payload.titikKumpul.length > 0) {
      for (let i = 0; i < payload.titikKumpul.length; i++) {
        const item = payload.titikKumpul[i];
        if (item._action === 'delete') continue;
        
        const validation = validateTitikKumpulItem(item, i);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, message: validation.error },
            { status: 400 }
          );
        }
      }
    }

    // Validasi Jalur Evakuasi items
    if (payload.jalurEvakuasi && Array.isArray(payload.jalurEvakuasi) && payload.jalurEvakuasi.length > 0) {
      for (let i = 0; i < payload.jalurEvakuasi.length; i++) {
        const item = payload.jalurEvakuasi[i];
        if (item._action === 'delete') continue;
        
        const validation = validateJalurEvakuasiItem(item, i);
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

      // Add checklistId as final parameter
      updateClauses.push(`submitted_at = CURRENT_TIMESTAMP`);
      params.push(checklistId);
      
      const sql = `UPDATE titik_kumpul_checklists 
         SET ${updateClauses.join(', ')} 
         WHERE id = $${paramIdx}`;

      console.log('📝 [API] Header update SQL:', sql);
      console.log('📝 [API] Header update params:', params);

      await client.query(sql, params);
      headerUpdated = true;
      console.log('✅ [API] Header updated');
    }

    // ─────────────────────────────────────────
    // 📦 PROCESS TITIK KUMPUL ITEMS
    // ─────────────────────────────────────────
    const tkResult = { created: 0, updated: 0, deleted: 0 };

    if (payload.titikKumpul && Array.isArray(payload.titikKumpul) && payload.titikKumpul.length > 0) {
      
      if (replaceItems) {
        await client.query(
          'DELETE FROM titik_kumpul_items WHERE checklist_id = $1',
          [checklistId]
        );

        for (const item of payload.titikKumpul) {
          if (item._action === 'delete') continue;
          await insertTitikKumpulItem(client, checklistId, item);
          tkResult.created++;
        }
        
      } else {
        for (const item of payload.titikKumpul) {
          
          if (item._action === 'delete' && item.itemId) {
            await client.query(
              'DELETE FROM titik_kumpul_items WHERE id = $1 AND checklist_id = $2',
              [item.itemId, checklistId]
            );
            tkResult.deleted++;
            continue;
          }
          
          if (item._action === 'update' && item.itemId) {
            await updateTitikKumpulItem(client, checklistId, item.itemId, item);
            tkResult.updated++;
            continue;
          }
          
          if (!item.itemId || item._action === 'create') {
            await insertTitikKumpulItem(client, checklistId, item);
            tkResult.created++;
          }
        }
      }
    }

    // ─────────────────────────────────────────
    // 📦 PROCESS JALUR EVAKUASI ITEMS
    // ─────────────────────────────────────────
    const jeResult = { created: 0, updated: 0, deleted: 0 };

    if (payload.jalurEvakuasi && Array.isArray(payload.jalurEvakuasi) && payload.jalurEvakuasi.length > 0) {
      
      if (replaceItems) {
        await client.query(
          'DELETE FROM jalur_evakuasi_items WHERE checklist_id = $1',
          [checklistId]
        );

        for (const item of payload.jalurEvakuasi) {
          if (item._action === 'delete') continue;
          await insertJalurEvakuasiItem(client, checklistId, item);
          jeResult.created++;
        }
        
      } else {
        for (const item of payload.jalurEvakuasi) {
          
          if (item._action === 'delete' && item.itemId) {
            await client.query(
              'DELETE FROM jalur_evakuasi_items WHERE id = $1 AND checklist_id = $2',
              [item.itemId, checklistId]
            );
            jeResult.deleted++;
            continue;
          }
          
          if (item._action === 'update' && item.itemId) {
            await updateJalurEvakuasiItem(client, checklistId, item.itemId, item);
            jeResult.updated++;
            continue;
          }
          
          if (!item.itemId || item._action === 'create') {
            await insertJalurEvakuasiItem(client, checklistId, item);
            jeResult.created++;
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
        message: 'Data Titik Kumpul & Jalur Evakuasi berhasil diupdate',
        data: {
          checklistId: checklistId,
          updated: {
            header: headerUpdated,
            titikKumpul: tkResult.created + tkResult.updated + tkResult.deleted,
            jalurEvakuasi: jeResult.created + jeResult.updated + jeResult.deleted
          },
          breakdown: {
            titikKumpul: tkResult,
            jalurEvakuasi: jeResult
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

    console.error('❌ [API] === ERROR EDIT TITIK KUMPUL ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        userMessage = 'Data duplikat: Item dengan lokasi/pertanyaan yang sama sudah ada';
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