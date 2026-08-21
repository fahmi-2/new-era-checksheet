// app/api/apar/edit/route.ts
declare const process: {
  env: {
    NODE_ENV: string;
    NEXT_PUBLIC_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};

import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface AparItem {
  itemId?: number;
  no: number;
  jenisApar: string;
  lokasi: string;
  noApar: string;
  expDate: string;
  hydrotestDate?: string | null;
  check1: string;
  check2: string;
  check3: string;
  check4: string;
  check5: string;
  check6: string;
  check7: string;
  check8: string;
  check9: string;
  check10: string;
  check11: string;
  check12: string;
  keterangan?: string | null;
  tindakanPerbaikan?: string | null;
  pic: string;
  foto?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditData {
  recordId: string;
  date?: string;
  slug?: string;
  checker?: string;
  checkerNik?: string;
  items?: AparItem[];
  replaceItems?: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ [API] === MULAI EDIT APAR ===');
    const data: EditData = await request.json();
    console.log('✏️ [API] Received APAR EDIT data:', JSON.stringify(data, null, 2));

    if (!data.recordId) {
      console.error('❌ [API] Validasi gagal: recordId wajib diisi');
      return NextResponse.json(
        { success: false, message: 'recordId wajib diisi' },
        { status: 400 }
      );
    }

    const recordCheck = await pool.query(
      'SELECT id, area, checker FROM apar_records WHERE id = $1',
      [data.recordId]
    );

    if (recordCheck.rows.length === 0) {
      console.error(`❌ [API] Record tidak ditemukan: ${data.recordId}`);
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    if (data.items && data.items.length > 0) {
      for (const [index, item] of data.items.entries()) {
        if (item._action === 'delete') continue;
        
        const requiredFields = ['no', 'jenisApar', 'lokasi', 'noApar', 'expDate', 'pic'];
        for (const field of requiredFields) {
          const value = item[field as keyof AparItem];
          if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            console.error(`❌ [API] Item ${index + 1}: Field "${field}" wajib diisi`);
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Field "${field}" wajib diisi` },
              { status: 400 }
            );
          }
        }
        
        for (let i = 1; i <= 12; i++) {
          const checkValue = item[`check${i}` as keyof AparItem] as string;
          if (!checkValue || !['OK', 'NG', 'OBS'].includes(checkValue)) {
            console.error(`❌ [API] Item ${index + 1}: Check${i} harus 'OK', 'NG', atau 'OBS'`);
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Check${i} harus diisi dengan 'OK', 'NG', atau 'OBS'` },
              { status: 400 }
            );
          }
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log(`🔄 [API] Transaction started for editing record: ${data.recordId}`);

      if (data.date || data.slug || data.checker || data.checkerNik !== undefined) {
        const updateFields = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (data.date) {
          updateFields.push(`date = $${paramIndex++}`);
          params.push(data.date);
        }
        if (data.slug) {
          updateFields.push(`area = $${paramIndex++}`);
          params.push(data.slug);
        }
        if (data.checker) {
          updateFields.push(`checker = $${paramIndex++}`);
          params.push(data.checker);
        }
        if (data.checkerNik !== undefined) {
          updateFields.push(`checker_nik = $${paramIndex++}`);
          params.push(data.checkerNik);
        }

        updateFields.push(`submitted_at = CURRENT_TIMESTAMP`);
        params.push(data.recordId);

        await client.query(
          `UPDATE apar_records 
           SET ${updateFields.join(', ')} 
           WHERE id = $${paramIndex}`,
          params
        );
        console.log('✅ [API] Header record updated');
      }

      if (data.items && data.items.length > 0) {
        
        if (data.replaceItems) {
          console.log('🗑️ [API] Replacing all items...');
          
          await client.query(
            'DELETE FROM apar_items WHERE record_id = $1',
            [data.recordId]
          );
          
          for (const item of data.items) {
            if (item._action === 'delete') continue;
            
            await client.query(
              `INSERT INTO apar_items (
                record_id, no, jenis_apar, lokasi, no_apar, exp_date, hydrotest_date,
                check1, check2, check3, check4, check5, check6,
                check7, check8, check9, check10, check11, check12,
                keterangan, tindakan_perbaikan, pic, foto
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23
              )`,
              [
                data.recordId,
                item.no,
                item.jenisApar,
                item.lokasi,
                item.noApar,
                item.expDate,
                item.hydrotestDate || null,
                item.check1,
                item.check2,
                item.check3,
                item.check4,
                item.check5,
                item.check6,
                item.check7,
                item.check8,
                item.check9,
                item.check10,
                item.check11,
                item.check12,
                item.keterangan || null,
                item.tindakanPerbaikan || null,
                item.pic,
                item.foto || null
              ]
            );
          }
          console.log(`✅ [API] Replaced with ${data.items.length} new items`);
        } else {
          for (const item of data.items) {
            
            if (item._action === 'delete' && item.itemId) {
              await client.query(
                'DELETE FROM apar_items WHERE id = $1 AND record_id = $2',
                [item.itemId, data.recordId]
              );
              console.log(`🗑️ [API] Deleted item ID: ${item.itemId}`);
              continue;
            }
            
            if (item._action === 'update' && item.itemId) {
              await client.query(
                `UPDATE apar_items 
                 SET 
                   no = $1, jenis_apar = $2, lokasi = $3, no_apar = $4, exp_date = $5, hydrotest_date = $6,
                   check1 = $7, check2 = $8, check3 = $9, check4 = $10, check5 = $11, check6 = $12,
                   check7 = $13, check8 = $14, check9 = $15, check10 = $16, check11 = $17, check12 = $18,
                   keterangan = $19, tindakan_perbaikan = $20, pic = $21, foto = $22
                 WHERE id = $23 AND record_id = $24`,
                [
                  item.no,
                  item.jenisApar,
                  item.lokasi,
                  item.noApar,
                  item.expDate,
                  item.hydrotestDate || null,
                  item.check1,
                  item.check2,
                  item.check3,
                  item.check4,
                  item.check5,
                  item.check6,
                  item.check7,
                  item.check8,
                  item.check9,
                  item.check10,
                  item.check11,
                  item.check12,
                  item.keterangan || null,
                  item.tindakanPerbaikan || null,
                  item.pic,
                  item.foto || null,
                  item.itemId,
                  data.recordId
                ]
              );
              console.log(`✏️ [API] Updated item ID: ${item.itemId}`);
            } else if (!item.itemId || item._action === 'create') {
              await client.query(
                `INSERT INTO apar_items (
                  record_id, no, jenis_apar, lokasi, no_apar, exp_date, hydrotest_date,
                  check1, check2, check3, check4, check5, check6,
                  check7, check8, check9, check10, check11, check12,
                  keterangan, tindakan_perbaikan, pic, foto
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7,
                  $8, $9, $10, $11, $12, $13,
                  $14, $15, $16, $17, $18, $19,
                  $20, $21, $22, $23
                )`,
                [
                  data.recordId,
                  item.no,
                  item.jenisApar,
                  item.lokasi,
                  item.noApar,
                  item.expDate,
                  item.hydrotestDate || null,
                  item.check1,
                  item.check2,
                  item.check3,
                  item.check4,
                  item.check5,
                  item.check6,
                  item.check7,
                  item.check8,
                  item.check9,
                  item.check10,
                  item.check11,
                  item.check12,
                  item.keterangan || null,
                  item.tindakanPerbaikan || null,
                  item.pic,
                  item.foto || null
                ]
              );
              console.log(`➕ [API] Created new item`);
            }
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ [API] Transaction committed for record: ${data.recordId}`);
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data APAR berhasil diupdate',
          recordId: data.recordId,
          updatedFields: {
            header: !!(data.date || data.slug || data.checker || data.checkerNik !== undefined),
            itemsCount: data.items?.length || 0,
            replaceMode: data.replaceItems || false
          }
        },
        { status: 200 }
      );
      
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ [API] Transaction error:', transactionError);
      
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
          console.error('❌ [API] Kolom tidak ditemukan di tabel');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Struktur tabel tidak sesuai. Periksa kolom di tabel apar_items',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
      }
      
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 [API] Connection released');
    }
    
  } catch (error) {
    console.error('❌ [API] === ERROR EDIT APAR ===');
    console.error('❌ [API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server saat mengupdate data',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 5)
        } : undefined
      },
      { status: 500 }
    );
  }
}