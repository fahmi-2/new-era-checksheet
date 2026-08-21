// app/api/ga/checksheet/[typeSlug]/by-area/[areaId]/[date]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { format } from 'date-fns';

type RouteParams = {
  typeSlug: string;
  areaId: string;
  date: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { typeSlug, areaId, date } = await params;

    console.log('🔍 Fetching checklist for type:', typeSlug, 'area:', areaId, 'date:', date);

    // Validasi date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    // Cek type
    const typesResult = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1`,
      [typeSlug]
    );

    if (typesResult.rows.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;

    // Cek apakah checklist sudah ada
    const headersResult = await pool.query(
      `
      SELECT h.id, h.check_date, h.inspector_id, h.inspector_name, h.status
      FROM ga_checksheet_headers h
      WHERE h.type_id = $1 AND h.area_id = $2 AND h.check_date = $3
      `,
      [typeId, areaId, formattedDate]
    );

    if (headersResult.rows.length === 0) {
      console.log('⚠️ No checklist found for this date');
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'Belum ada data untuk tanggal ini' 
      });
    }

    const headerId = headersResult.rows[0].id;
    console.log('✅ Header ID:', headerId);

    // Ambil detail checklist
    const detailsResult = await pool.query(
      `
      SELECT 
        ci.item_key,
        ci.no,
        ci.item_group,
        ci.item_check,
        ci.method,
        ci.image,
        cd.result,
        cd.finding,
        cd.corrective_action,
        cd.pic,
        cd.due_date,
        cd.verified_by,
        cd.images,
        cd.notes
      FROM ga_checksheet_details cd
      JOIN ga_checksheet_items ci ON cd.item_id = ci.id
      WHERE cd.header_id = $1
      ORDER BY ci.sort_order ASC, ci.no ASC
      `,
      [headerId]
    );

    // Transform data ke format yang sesuai dengan frontend
    const formattedDetails: any = {};
    detailsResult.rows.forEach((detail: any) => {
      formattedDetails[detail.item_key] = {
        date: formattedDate,
        hasilPemeriksaan: detail.result || '',
        keteranganTemuan: detail.finding || '',
        tindakanPerbaikan: detail.corrective_action || '',
        pic: detail.pic || '',
        dueDate: detail.due_date || '',
        verify: detail.verified_by || '',
        inspector: headersResult.rows[0].inspector_name,
        images: detail.images ? detail.images : [], // ✅ PostgreSQL JSONB sudah auto-parse
        notes: detail.notes || ''
      };
    });

    console.log('✅ Found', detailsResult.rows.length, 'details');
    
    return NextResponse.json({ 
      success: true, 
      data: formattedDetails,
      headerInfo: headersResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fetching checklist:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data checklist' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const client = await pool.connect(); // ✅ PostgreSQL: Gunakan client untuk transaction
  
  try {
    const { typeSlug, areaId, date } = await params;
    const body = await request.json();
    const { checklistData, inspectorId, inspectorName, status = 'submitted' } = body;

    console.log('💾 Saving checklist for type:', typeSlug, 'area:', areaId, 'date:', date);

    // Validasi
    if (!checklistData || typeof checklistData !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Data checklist tidak valid' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    // Cek type
    const typesResult = await client.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1`,
      [typeSlug]
    );

    if (typesResult.rows.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;

    // ✅ Mulai transaction PostgreSQL
    await client.query('BEGIN');

    try {
      // Cek atau buat header
      let headersResult = await client.query(
        `
        SELECT id FROM ga_checksheet_headers
        WHERE type_id = $1 AND area_id = $2 AND check_date = $3
        `,
        [typeId, areaId, formattedDate]
      );

      let headerId: number;
      
      if (headersResult.rows.length > 0) {
        headerId = headersResult.rows[0].id;
        // Update header
        console.log('🔄 Updating existing header:', headerId);
        await client.query(
          `
          UPDATE ga_checksheet_headers
          SET inspector_id = $1, inspector_name = $2, status = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          `,
          [inspectorId, inspectorName, status, headerId]
        );
      } else {
        // Insert baru dengan RETURNING (fitur PostgreSQL)
        console.log('➕ Creating new header');
        const insertResult = await client.query(
          `
          INSERT INTO ga_checksheet_headers 
          (type_id, area_id, check_date, inspector_id, inspector_name, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
          `,
          [typeId, areaId, formattedDate, inspectorId, inspectorName, status]
        );
        headerId = insertResult.rows[0].id;
        console.log('✅ New header created with ID:', headerId);
      }

      // Ambil semua item untuk type ini
      const allItemsResult = await client.query(
        `SELECT id, item_key FROM ga_checksheet_items WHERE type_id = $1`,
        [typeId]
      );

      console.log('📝 Processing', Object.keys(checklistData).length, 'items');

      // Insert atau update detail
      for (const [itemKey, itemData] of Object.entries(checklistData)) {
        const item = allItemsResult.rows.find((i: any) => i.item_key === itemKey);
        if (!item) {
          console.warn('⚠️ Item not found:', itemKey);
          continue;
        }

        const detail = itemData as any;
        
        // ✅ PostgreSQL: JSONB bisa langsung JSON.stringify atau object
        const imagesJson = detail.images && Array.isArray(detail.images)
          ? JSON.stringify(detail.images)
          : JSON.stringify([]);


        // Cek apakah sudah ada
        const existingResult = await client.query(
          `
          SELECT id FROM ga_checksheet_details
          WHERE header_id = $1 AND item_id = $2
          `,
          [headerId, item.id]
        );

        if (existingResult.rows.length > 0) {
          // Update
          console.log('🔄 Updating detail for item:', itemKey);
          await client.query(
            `
            UPDATE ga_checksheet_details
            SET 
              result = $1,
              finding = $2,
              corrective_action = $3,
              pic = $4,
              due_date = $5,
              verified_by = $6,
              images = $7,
              notes = $8
            WHERE id = $9
            `,
            [
              detail.hasilPemeriksaan || '',
              detail.keteranganTemuan || '',
              detail.tindakanPerbaikan || '',
              detail.pic || '',
              detail.dueDate || null,
              detail.verify || '',
              imagesJson, // ✅ PostgreSQL auto-handle JSONB
              detail.notes || '',
              existingResult.rows[0].id
            ]
          );
        } else {
          // Insert baru
          console.log('➕ Inserting new detail for item:', itemKey);
          await client.query(
            `
            INSERT INTO ga_checksheet_details
            (header_id, item_id, result, finding, corrective_action, 
             pic, due_date, verified_by, images, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
              headerId,
              item.id,
              detail.hasilPemeriksaan || '',
              detail.keteranganTemuan || '',
              detail.tindakanPerbaikan || '',
              detail.pic || '',
              detail.dueDate || null,
              detail.verify || '',
              imagesJson,
              detail.notes || ''
            ]
          );
        }
      }

      // ✅ Commit transaction
      await client.query('COMMIT');

      console.log('✅ Checklist saved successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Data berhasil disimpan',
        headerId 
      });
      
    } catch (error) {
      // ✅ Rollback jika error
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error saving checklist:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan data checklist' },
      { status: 500 }
    );
  } finally {
    // ✅ Release client kembali ke pool
    client.release();
  }
}