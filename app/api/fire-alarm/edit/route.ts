// app/api/fire-alarm/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface FireAlarmItem {
  id?: number;
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok?: string | null;
  tindakanPerbaikan?: string | null;
  pic: string;
  foto?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditData {
  recordId: string;
  date?: string;
  zona?: string;
  checker?: string;
  checkerNik?: string;
  items?: FireAlarmItem[];
  replaceItems?: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    const data: EditData = await request.json();
    console.log('✏️ Received Fire Alarm EDIT data:', JSON.stringify(data, null, 2));

    // Validasi: recordId wajib ada
    if (!data.recordId) {
      return NextResponse.json(
        { success: false, message: 'recordId wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah record exists
    const recordCheck = await pool.query(
      'SELECT id, zona, checker FROM fire_alarm_records WHERE id = $1',
      [data.recordId]
    );

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi items jika dikirim
    if (data.items && data.items.length > 0) {
      for (const [index, item] of data.items.entries()) {
        if (item._action === 'delete') continue;
        
        const requiredFields = ['no', 'zona', 'lokasi', 'alarmBell', 'indicatorLamp', 'manualCallPoint', 'idZona', 'kebersihan', 'pic'];
        for (const field of requiredFields) {
          if (item[field as keyof FireAlarmItem] === undefined || item[field as keyof FireAlarmItem] === null) {
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Field "${field}" wajib diisi` },
              { status: 400 }
            );
          }
        }
        // Validasi status fields harus OK/NG
        const statusFields = ['alarmBell', 'indicatorLamp', 'manualCallPoint', 'kebersihan'];
        for (const field of statusFields) {
          const value = item[field as keyof FireAlarmItem];
          if (value && !['OK', 'NG'].includes(value as string)) {
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Status "${field}" harus OK atau NG` },
              { status: 400 }
            );
          }
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log(`🔄 Transaction started for editing record: ${data.recordId}`);

      // ─────────────────────────────────────────────────────
      // 1. UPDATE HEADER RECORD
      // ─────────────────────────────────────────────────────
      if (data.date || data.zona || data.checker || data.checkerNik !== undefined) {
        const updateFields = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (data.date) {
          updateFields.push(`date = $${paramIndex++}`);
          params.push(data.date);
        }
        if (data.zona) {
          updateFields.push(`zona = $${paramIndex++}`);
          params.push(data.zona);
        }
        if (data.checker) {
          updateFields.push(`checker = $${paramIndex++}`);
          params.push(data.checker);
        }
        if (data.checkerNik !== undefined) {
          updateFields.push(`checker_nik = $${paramIndex++}`);
          params.push(data.checkerNik);
        }

        // Update updated_at di header (asumsi tabel records memiliki kolom ini)
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        params.push(data.recordId);

        await client.query(
          `UPDATE fire_alarm_records 
           SET ${updateFields.join(', ')} 
           WHERE id = $${paramIndex}`,
          params
        );
        console.log('✅ Header record updated');
      }

      // ─────────────────────────────────────────────────────
      // 2. HANDLE ITEMS UPDATE
      // ─────────────────────────────────────────────────────
      if (data.items && data.items.length > 0) {
        
        // Opsi A: Replace semua items
        if (data.replaceItems) {
          console.log('🗑️ Replacing all items...');
          
          await client.query(
            'DELETE FROM fire_alarm_items WHERE record_id = $1',
            [data.recordId]
          );
          
          for (const item of data.items) {
            if (item._action === 'delete') continue;
            
            await client.query(
              `INSERT INTO fire_alarm_items (
                record_id, no, zona, lokasi, alarm_bell, indicator_lamp, 
                manual_call_point, id_zona, kebersihan, kondisi_nok, 
                tindakan_perbaikan, pic, foto, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
              [
                data.recordId,
                item.no,
                item.zona,
                item.lokasi,
                item.alarmBell,
                item.indicatorLamp,
                item.manualCallPoint,
                item.idZona,
                item.kebersihan,
                item.kondisiNok || null,
                item.tindakanPerbaikan || null,
                item.pic,
                item.foto || null
              ]
            );
          }
          console.log(`✅ Replaced with ${data.items.length} new items`);
        } 
        // Opsi B: Update granular
        else {
          for (const item of data.items) {
            
            // ➖ DELETE item
            if (item._action === 'delete' && item.id) {
              await client.query(
                'DELETE FROM fire_alarm_items WHERE id = $1 AND record_id = $2',
                [item.id, data.recordId]
              );
              console.log(`🗑️ Deleted item ID: ${item.id}`);
              continue;
            }
            
            // ✏️ UPDATE existing item
            if (item._action === 'update' && item.id) {
              // ⚠️ PERBAIKAN: Hapus updated_at karena kolom ini mungkin tidak ada di tabel items
              await client.query(
                `UPDATE fire_alarm_items 
                 SET 
                   no = $1, zona = $2, lokasi = $3, alarm_bell = $4, 
                   indicator_lamp = $5, manual_call_point = $6, id_zona = $7, 
                   kebersihan = $8, kondisi_nok = $9, tindakan_perbaikan = $10, 
                   pic = $11, foto = $12
                 WHERE id = $13 AND record_id = $14`,
                [
                  item.no,
                  item.zona,
                  item.lokasi,
                  item.alarmBell,
                  item.indicatorLamp,
                  item.manualCallPoint,
                  item.idZona,
                  item.kebersihan,
                  item.kondisiNok || null,
                  item.tindakanPerbaikan || null,
                  item.pic,
                  item.foto || null,
                  item.id,
                  data.recordId
                ]
              );
              console.log(`✏️ Updated item ID: ${item.id}`);
            } 
            // ➕ CREATE new item
            else if (!item.id || item._action === 'create') {
              await client.query(
                `INSERT INTO fire_alarm_items (
                  record_id, no, zona, lokasi, alarm_bell, indicator_lamp, 
                  manual_call_point, id_zona, kebersihan, kondisi_nok, 
                  tindakan_perbaikan, pic, foto, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
                [
                  data.recordId,
                  item.no,
                  item.zona,
                  item.lokasi,
                  item.alarmBell,
                  item.indicatorLamp,
                  item.manualCallPoint,
                  item.idZona,
                  item.kebersihan,
                  item.kondisiNok || null,
                  item.tindakanPerbaikan || null,
                  item.pic,
                  item.foto || null
                ]
              );
              console.log(`➕ Created new item`);
            }
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Transaction committed for record: ${data.recordId}`);
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data Fire Alarm berhasil diupdate',
          recordId: data.recordId,
          updatedFields: {
            header: !!(data.date || data.zona || data.checker || data.checkerNik !== undefined),
            itemsCount: data.items?.length || 0,
            replaceMode: data.replaceItems || false
          }
        },
        { status: 200 }
      );
      
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);
      
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Struktur tabel tidak sesuai. Periksa kolom di tabel fire_alarm_items',
              error: transactionError.message,
              hint: 'Pastikan kolom: no, zona, lokasi, alarm_bell, indicator_lamp, manual_call_point, id_zona, kebersihan, kondisi_nok, tindakan_perbaikan, pic, foto, created_at ada di tabel'
            },
            { status: 500 }
          );
        }
      }
      
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 Connection released');
    }
    
  } catch (error) {
    console.error('❌ Edit Fire Alarm error:', error);
    
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