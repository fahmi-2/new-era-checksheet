// app/api/toilet-inspections/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log(' [API Submit] Payload received:', {
      area_code: payload.area_code,
      toilet_type: payload.toilet_type,
      inspection_date: payload.inspection_date,
    });

    // Validasi required fields
    if (!payload.area_code || !payload.inspection_date || !payload.toilet_type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const {
      area_code,
      area_name,
      inspection_date,
      inspection_time,
      toilet_type,
      user_id,
      inspector_name,
      inspector_nik,
    } = payload;

    // Generate ID unik
    const id = `${area_code}-${inspection_date}-${toilet_type}-${Date.now()}`;

    // Tentukan overall status
    let hasNG = false;
    
    // ✅ LOOP 1-13 (BUKAN 1-10!)
    for (let i = 1; i <= 13; i++) {
      if (toilet_type === 'wanita_only' || toilet_type === 'general') {
        // Cek kolom _p
        const hasil = payload[`item_${i}_hasil_p`] || 'OK';
        if (hasil === 'NG') hasNG = true;
      } else {
        // Mixed: cek _l dan _p
        const hasilL = payload[`item_${i}_hasil_l`] || 'OK';
        const hasilP = payload[`item_${i}_hasil_p`] || 'OK';
        if (hasilL === 'NG' || hasilP === 'NG') hasNG = true;
      }
    }

    const overall_status = hasNG ? 'NG' : 'OK';

    // Build INSERT query
    const columns: string[] = [
      'id', 'user_id', 'area_code', 'area_name',
      'inspection_date', 'inspection_time', 'toilet_type',
      'inspector_name', 'inspector_nik', 'overall_status'
    ];
    
    const values: any[] = [
      id, user_id || '', area_code, area_name || '',
      inspection_date, inspection_time, toilet_type,
      inspector_name, inspector_nik || '', overall_status
    ];

    // ✅ TAMBAHKAN SEMUA ITEM 1-13
    for (let i = 1; i <= 13; i++) {
      if (toilet_type === 'wanita_only' || toilet_type === 'general') {
        // Hanya kolom _p yang diisi, _l = NULL
        columns.push(
          `item_${i}_hasil_p`,
          `item_${i}_keterangan_p`,
          `item_${i}_foto_p`,
          `item_${i}_tindakan_p`,
          `item_${i}_pic_p`,
          `item_${i}_hasil_l`,
          `item_${i}_keterangan_l`,
          `item_${i}_foto_l`,
          `item_${i}_tindakan_l`,
          `item_${i}_pic_l`
        );
        
        values.push(
          payload[`item_${i}_hasil_p`] || 'OK',
          payload[`item_${i}_keterangan_p`] || '',
          payload[`item_${i}_foto_p`] || '',
          payload[`item_${i}_tindakan_p`] || '',
          payload[`item_${i}_pic_p`] || inspector_name || '',
          null, null, null, null, null // Kolom _l kosong untuk general/wanita
        );
      } else {
        // Mixed: isi keduanya
        columns.push(
          `item_${i}_hasil_l`,
          `item_${i}_keterangan_l`,
          `item_${i}_foto_l`,
          `item_${i}_tindakan_l`,
          `item_${i}_pic_l`,
          `item_${i}_hasil_p`,
          `item_${i}_keterangan_p`,
          `item_${i}_foto_p`,
          `item_${i}_tindakan_p`,
          `item_${i}_pic_p`
        );
        
        values.push(
          payload[`item_${i}_hasil_l`] || 'OK',
          payload[`item_${i}_keterangan_l`] || '',
          payload[`item_${i}_foto_l`] || '',
          payload[`item_${i}_tindakan_l`] || '',
          payload[`item_${i}_pic_l`] || inspector_name || '',
          payload[`item_${i}_hasil_p`] || 'OK',
          payload[`item_${i}_keterangan_p`] || '',
          payload[`item_${i}_foto_p`] || '',
          payload[`item_${i}_tindakan_p`] || '',
          payload[`item_${i}_pic_p`] || inspector_name || ''
        );
      }
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO toilet_inspections (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING id, overall_status
    `;

    console.log('📝 [API Submit] Executing query with', values.length, 'params');

    const result = await pool.query(query, values);

    console.log('✅ [API Submit] Success:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Data berhasil disimpan'
    });

  } catch (error: any) {
    console.error('❌ [API Submit] Error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan data',
        error: error.message
      },
      { status: 500 }
    );
  }
}