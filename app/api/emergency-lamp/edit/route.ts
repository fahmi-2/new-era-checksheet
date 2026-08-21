// app/api/emergency-lamp/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface EmergencyItem {
  itemId?: number;
  no: number;
  lokasi: string;
  id?: string;
  lampId?: string;
  kondisiLampu: string;
  indicatorLamp: string;
  batteryCharger: string;
  idNumber: string;
  kebersihan: string;
  kondisiKabel: string;
  keterangan?: string | null;
  tindakanPerbaikan?: string | null;
  pic: string;
  foto?: string | null;
  _action?: 'create' | 'update' | 'delete';
}

interface EditData {
  recordId: string;
  date?: string;
  area?: string;
  checker?: string;
  checkerNik?: string;
  items?: EmergencyItem[];
  replaceItems?: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ [API] === MULAI EDIT EMERGENCY LAMP ===');
    const data = await request.json();
    console.log('✏️ [API] Received Emergency Lamp EDIT data:', JSON.stringify(data, null, 2));

    if (!data.recordId) {
      console.error('❌ [API] Validasi gagal: recordId wajib diisi');
      return NextResponse.json(
        { success: false, message: 'recordId wajib diisi' },
        { status: 400 }
      );
    }

    const recordCheck = await pool.query(
      'SELECT id, area, checker FROM emergency_lamp_records WHERE id = $1',
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
        
        const lampId = item.lampId || item.id || '';
        
        const requiredFields = {
          no: item.no,
          lokasi: item.lokasi,
          lampId: lampId,
          kondisiLampu: item.kondisiLampu,
          indicatorLamp: item.indicatorLamp,
          batteryCharger: item.batteryCharger,
          idNumber: item.idNumber,
          kebersihan: item.kebersihan,
          kondisiKabel: item.kondisiKabel,
          pic: item.pic
        };

        for (const [fieldName, value] of Object.entries(requiredFields)) {
          if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            console.error(`❌ [API] Item ${index + 1}: Field "${fieldName}" wajib diisi`);
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Field "${fieldName}" wajib diisi` },
              { status: 400 }
            );
          }
        }
        
        const statusFields = ['kondisiLampu', 'indicatorLamp', 'batteryCharger', 'idNumber', 'kebersihan', 'kondisiKabel'];
        for (const field of statusFields) {
          const value = item[field as keyof EmergencyItem] as string;
          if (value && !['OK', 'NG'].includes(value)) {
            console.error(`❌ [API] Item ${index + 1}: Status "${field}" harus OK atau NG`);
            return NextResponse.json(
              { success: false, message: `Item ${index + 1}: Status "${field}" harus OK atau NG` },
              { status: 400 }
            );
          }
        }
        
        const hasNg = statusFields.some(field => item[field as keyof EmergencyItem] === 'NG');
        if (hasNg && (!item.keterangan || item.keterangan.trim() === '')) {
          console.error(`❌ [API] Item ${index + 1}: Keterangan wajib diisi untuk item NG`);
          return NextResponse.json(
            { success: false, message: `Item ${index + 1}: Keterangan wajib diisi untuk item dengan status NG` },
            { status: 400 }
          );
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log(`🔄 [API] Transaction started for editing record: ${data.recordId}`);

      if (data.date || data.area || data.checker || data.checkerNik !== undefined) {
        const updateFields = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (data.date) {
          updateFields.push(`date = $${paramIndex++}`);
          params.push(data.date);
        }
        if (data.area) {
          updateFields.push(`area = $${paramIndex++}`);
          params.push(data.area);
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
          `UPDATE emergency_lamp_records 
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
            'DELETE FROM emergency_lamp_items WHERE record_id = $1',
            [data.recordId]
          );
          
          for (const item of data.items) {
            if (item._action === 'delete') continue;
            
            const lampIdValue = item.lampId || item.id || '';
            
            await client.query(
              `INSERT INTO emergency_lamp_items (
                record_id, no, lokasi, id_lamp, kondisi_lampu, indicator_lamp, 
                battery_charger, id_number, kebersihan, kondisi_kabel, keterangan, 
                tindakan_perbaikan, pic, foto, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)`,
              [
                data.recordId,
                item.no,
                item.lokasi,
                lampIdValue,
                item.kondisiLampu,
                item.indicatorLamp,
                item.batteryCharger,
                item.idNumber,
                item.kebersihan,
                item.kondisiKabel,
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
                'DELETE FROM emergency_lamp_items WHERE id = $1 AND record_id = $2',
                [item.itemId, data.recordId]
              );
              console.log(`🗑️ [API] Deleted item ID: ${item.itemId}`);
              continue;
            }
            
            if (item._action === 'update' && item.itemId) {
              const lampIdValue = item.lampId || item.id || '';
              
              await client.query(
                `UPDATE emergency_lamp_items 
                 SET 
                   no = $1, lokasi = $2, id_lamp = $3, kondisi_lampu = $4, 
                   indicator_lamp = $5, battery_charger = $6, id_number = $7, 
                   kebersihan = $8, kondisi_kabel = $9, keterangan = $10, 
                   tindakan_perbaikan = $11, pic = $12, foto = $13
                 WHERE id = $14 AND record_id = $15`,
                [
                  item.no,
                  item.lokasi,
                  lampIdValue,
                  item.kondisiLampu,
                  item.indicatorLamp,
                  item.batteryCharger,
                  item.idNumber,
                  item.kebersihan,
                  item.kondisiKabel,
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
              const lampIdValue = item.lampId || item.id || '';
              
              await client.query(
                `INSERT INTO emergency_lamp_items (
                  record_id, no, lokasi, id_lamp, kondisi_lampu, indicator_lamp, 
                  battery_charger, id_number, kebersihan, kondisi_kabel, keterangan, 
                  tindakan_perbaikan, pic, foto, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)`,
                [
                  data.recordId,
                  item.no,
                  item.lokasi,
                  lampIdValue,
                  item.kondisiLampu,
                  item.indicatorLamp,
                  item.batteryCharger,
                  item.idNumber,
                  item.kebersihan,
                  item.kondisiKabel,
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
          message: 'Data Emergency Lamp berhasil diupdate',
          recordId: data.recordId,
          updatedFields: {
            header: !!(data.date || data.area || data.checker || data.checkerNik !== undefined),
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
              message: 'Struktur tabel tidak sesuai. Periksa kolom di tabel emergency_lamp_items',
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
    console.error('❌ [API] === ERROR EDIT EMERGENCY LAMP ===');
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