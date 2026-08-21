// app/api/toilet-inspections/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────
interface ToiletItem {
  hasil: 'OK' | 'NG';
  keterangan?: string;
  foto?: string;
  tindakan?: string;
  pic?: string;
}

interface EditPayload {
  id: string;                      // ✅ ID inspeksi yang mau diedit
  area_code?: string;
  area_name?: string;
  inspection_date?: string;
  inspection_time?: string;
  toilet_type?: string;
  inspector_name?: string;
  inspector_nik?: string;
  items?: {
    L: Record<number, ToiletItem>;  // ✅ Item Laki-laki (1-10)
    P: Record<number, ToiletItem>;  // ✅ Item Perempuan (1-10)
  };
}

// ─────────────────────────────────────────────────────────────
// 🔧 HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const validateItem = (item: ToiletItem, itemNo: number, type: 'L' | 'P'): { valid: boolean; error?: string } => {
  if (!item.hasil || !['OK', 'NG'].includes(item.hasil)) {
    return { valid: false, error: `Item ${itemNo} (${type}): Hasil harus 'OK' atau 'NG'` };
  }

  if (item.hasil === 'NG' && !item.keterangan?.trim()) {
    return { valid: false, error: `Item ${itemNo} (${type}): Keterangan wajib diisi untuk kondisi NG` };
  }

  return { valid: true };
};

const calculateOverallStatus = (items: { L: Record<number, ToiletItem>; P: Record<number, ToiletItem> }): string => {
  for (let i = 1; i <= 10; i++) {
    if (items.L[i]?.hasil === 'NG' || items.P[i]?.hasil === 'NG') {
      return 'NG';
    }
  }
  return 'OK';
};

// ─────────────────────────────────────────────────────────────
// 🎯 MAIN API HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log(`✏️ [API] === START EDIT TOILET INSPECTION === ${new Date().toISOString()}`);

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
      id: payload.id,
      area_code: payload.area_code,
      hasItems: !!payload.items
    });

    // 🔐 Validasi ID
    if (!payload.id) {
      return NextResponse.json(
        { success: false, message: 'ID inspeksi wajib diisi' },
        { status: 400 }
      );
    }

    // 🔍 Cek keberadaan record
    const recordCheck = await pool.query(
      'SELECT id, area_code, inspection_date, toilet_type FROM toilet_inspections WHERE id = $1',
      [payload.id]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Data dengan ID ${payload.id} tidak ditemukan` },
        { status: 404 }
      );
    }

    // ✅ Validasi items jika ada
    if (payload.items) {
      for (let i = 1; i <= 10; i++) {
        if (payload.items.L[i]) {
          const validation = validateItem(payload.items.L[i], i, 'L');
          if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
          }
        }
        if (payload.items.P[i]) {
          const validation = validateItem(payload.items.P[i], i, 'P');
          if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
          }
        }
      }
    }

    // ─────────────────────────────────────────
    // 📋 BUILD UPDATE QUERY
    // ─────────────────────────────────────────
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Header fields
    if (payload.area_code !== undefined) {
      updateFields.push(`area_code = $${paramIdx++}`);
      params.push(payload.area_code);
    }
    if (payload.area_name !== undefined) {
      updateFields.push(`area_name = $${paramIdx++}`);
      params.push(payload.area_name);
    }
    if (payload.inspection_date !== undefined) {
      updateFields.push(`inspection_date = $${paramIdx++}`);
      params.push(payload.inspection_date);
    }
    if (payload.inspection_time !== undefined) {
      updateFields.push(`inspection_time = $${paramIdx++}`);
      params.push(payload.inspection_time);
    }
    if (payload.toilet_type !== undefined) {
      updateFields.push(`toilet_type = $${paramIdx++}`);
      params.push(payload.toilet_type);
    }
    if (payload.inspector_name !== undefined) {
      updateFields.push(`inspector_name = $${paramIdx++}`);
      params.push(payload.inspector_name);
    }
    if (payload.inspector_nik !== undefined) {
      updateFields.push(`inspector_nik = $${paramIdx++}`);
      params.push(payload.inspector_nik);
    }

    // Items L (1-10)
    if (payload.items?.L) {
      for (let i = 1; i <= 10; i++) {
        if (payload.items.L[i]) {
          updateFields.push(`item_${i}_hasil_l = $${paramIdx++}`);
          params.push(payload.items.L[i].hasil || 'OK');
          updateFields.push(`item_${i}_keterangan_l = $${paramIdx++}`);
          params.push(payload.items.L[i].keterangan || null);
          updateFields.push(`item_${i}_foto_l = $${paramIdx++}`);
          params.push(payload.items.L[i].foto || null);
          updateFields.push(`item_${i}_tindakan_l = $${paramIdx++}`);
          params.push(payload.items.L[i].tindakan || null);
          updateFields.push(`item_${i}_pic_l = $${paramIdx++}`);
          params.push(payload.items.L[i].pic || null);
        }
      }
    }

    // Items P (1-10)
    if (payload.items?.P) {
      for (let i = 1; i <= 10; i++) {
        if (payload.items.P[i]) {
          updateFields.push(`item_${i}_hasil_p = $${paramIdx++}`);
          params.push(payload.items.P[i].hasil || 'OK');
          updateFields.push(`item_${i}_keterangan_p = $${paramIdx++}`);
          params.push(payload.items.P[i].keterangan || null);
          updateFields.push(`item_${i}_foto_p = $${paramIdx++}`);
          params.push(payload.items.P[i].foto || null);
          updateFields.push(`item_${i}_tindakan_p = $${paramIdx++}`);
          params.push(payload.items.P[i].tindakan || null);
          updateFields.push(`item_${i}_pic_p = $${paramIdx++}`);
          params.push(payload.items.P[i].pic || null);
        }
      }
    }

    // Calculate overall status
    const existingData = recordCheck.rows[0];
    const overallStatus = payload.items 
      ? calculateOverallStatus(payload.items)
      : existingData.overall_status;
    
    updateFields.push(`overall_status = $${paramIdx++}`);
    params.push(overallStatus);

    // Updated timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // ID for WHERE clause
    params.push(payload.id);

    const updateQuery = `
      UPDATE toilet_inspections 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIdx}
      RETURNING id, area_code, inspection_date, toilet_type, overall_status
    `;

    console.log('📝 [API] Update query:', updateQuery);
    console.log('📝 [API] Params count:', params.length);

    const result = await pool.query(updateQuery, params);

    console.log(`✅ [API] Updated in ${Date.now() - startTime}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Data Inspeksi Toilet berhasil diupdate',
        data: result.rows[0],
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ [API] === ERROR EDIT TOILET INSPECTION ===');
    console.error('❌ [API] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message
    });

    let userMessage = 'Terjadi kesalahan server saat mengupdate data';
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('duplicate key')) {
        userMessage = 'Data duplikat: Inspeksi untuk tanggal ini sudah ada';
        statusCode = 409;
      } else if (msg.includes('not null')) {
        userMessage = 'Field wajib tidak boleh kosong';
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