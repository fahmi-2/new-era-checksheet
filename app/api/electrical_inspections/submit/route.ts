// app/api/electrical_inspections/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface ElectricalInspectionItem {
  hasil: string;
  keterangan?: string;
  foto_path?: string;
}

interface SubmitData {
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  additional_notes?: string;
  items: Record<string, ElectricalInspectionItem>;
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    console.log('📥 Received submit request');
    
    // ✅ FIX 1: Deklarasikan variable data dengan benar
    const body: SubmitData = await request.json();

    console.log('📦 Parsed data:', JSON.stringify(body, null, 2));

    // Validasi data
    if (!body.type || !body.tanggal || !body.area || !body.pic || !body.items || Object.keys(body.items).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data tidak lengkap. Required: type, tanggal, area, pic, items' 
        },
        { status: 400 }
      );
    }

    // ✅ FIX 2: Tambahkan type annotation pada Object.entries
    for (const [itemNo, itemData] of Object.entries(body.items) as [string, ElectricalInspectionItem][]) {
      if (!itemData.hasil || (itemData.hasil !== 'OK' && itemData.hasil !== 'NOK')) {
        return NextResponse.json(
          { success: false, message: `Hasil item ${itemNo} tidak valid. Harus OK atau NOK` },
          { status: 400 }
        );
      }
    }

    await client.query('BEGIN');
    console.log('🔄 Transaction started');

    // Insert ke electrical_inspections
    const headerResult = await client.query(
      `INSERT INTO electrical_inspections (type, tanggal, area, pic, additional_notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [body.type, body.tanggal, body.area, body.pic, body.additional_notes || null]
    );

    const inspectionId = headerResult.rows[0].id;
    console.log('✅ Header inserted, ID:', inspectionId);

    // ✅ FIX 3: Tambahkan type annotation pada loop items
    let itemsInserted = 0;
    for (const [itemNo, itemData] of Object.entries(body.items) as [string, ElectricalInspectionItem][]) {
      await client.query(
        `INSERT INTO electrical_inspection_details (
          inspection_id, item_no, item_name, item_detail, hasil, keterangan, foto_path, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          inspectionId,
          parseInt(itemNo),
          `Item ${itemNo}`,
          '',
          itemData.hasil,
          itemData.keterangan || null,
          itemData.foto_path || null
        ]
      );
      itemsInserted++;
    }
    console.log(`✅ ${itemsInserted} items inserted`);

    await client.query('COMMIT');
    console.log('✅ Transaction committed');

    return NextResponse.json(
      {
        success: true,
        message: 'Data inspeksi listrik berhasil disimpan',
        id: inspectionId
      },
      { status: 201 }
    );
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan database',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
    console.log('🔓 Connection released');
  }
}