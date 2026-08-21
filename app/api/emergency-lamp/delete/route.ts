// app/api/emergency-lamp/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('🗑️ [API] === MULAI DELETE EMERGENCY LAMP ===');
    console.log('🆔 [API] ID yang akan dihapus:', id);

    if (!id) {
      console.error('❌ [API] ID tidak diberikan');
      return NextResponse.json(
        { success: false, message: 'ID diperlukan' },
        { status: 400 }
      );
    }

    // Test koneksi database
    try {
      const testResult = await pool.query('SELECT 1');
      console.log('✅ [API] Database connection OK. Result:', testResult.rows);
    } catch (connError) {
      console.error('❌ [API] Database connection failed:', connError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Koneksi database gagal',
          error: process.env.NODE_ENV === 'development' ? (connError as Error).message : undefined
        },
        { status: 500 }
      );
    }

    // Check apakah record ada
    const recordCheck = await pool.query(
      `SELECT id FROM emergency_lamp_records WHERE id = $1`,
      [id]
    );
    
    if (recordCheck.rowCount === 0) {
      console.warn('⚠️ [API] Record tidak ditemukan:', id);
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Record ditemukan:', id);

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 [API] Transaction started');

      // Ambil semua foto yang akan dihapus
      const itemsResult = await client.query(
        `SELECT foto FROM emergency_lamp_items WHERE record_id = $1 AND foto IS NOT NULL`,
        [id]
      );

      console.log(`📸 [API] Menemukan ${itemsResult.rows.length} foto yang akan dihapus`);

      // Hapus file foto dari storage
      let deletedFiles = 0;
      let failedFiles = 0;
      
      for (const item of itemsResult.rows) {
        if (item.foto) {
          try {
            // Extract path dari URL (hapus base URL jika ada)
            const fotoPath = item.foto.replace(process.env.NEXT_PUBLIC_BASE_URL || '', '');
            const filePath = join(process.cwd(), 'public', fotoPath);
            
            console.log(`🗑️ [API] Menghapus file: ${filePath}`);
            
            // Cek apakah file ada
            try {
              await unlink(filePath);
              deletedFiles++;
              console.log(`✅ [API] File berhasil dihapus: ${fotoPath}`);
            } catch (fileError) {
              console.warn(`⚠️ [API] File tidak ditemukan atau gagal dihapus: ${fotoPath}`, fileError);
              failedFiles++;
              // Lanjutkan meskipun gagal hapus file
            }
          } catch (err) {
            console.warn(`⚠️ [API] Gagal menghapus file ${item.foto}:`, err);
            failedFiles++;
            // Lanjutkan meskipun gagal hapus file
          }
        }
      }

      console.log(`✅ [API] Berhasil menghapus ${deletedFiles} file foto`);
      if (failedFiles > 0) {
        console.warn(`⚠️ [API] Gagal menghapus ${failedFiles} file foto`);
      }

      // Delete items terlebih dahulu
      const deleteItemsResult = await client.query(
        `DELETE FROM emergency_lamp_items WHERE record_id = $1`,
        [id]
      );

      console.log(`✅ [API] Menghapus ${deleteItemsResult.rowCount} items`);

      // Delete record
      const deleteRecordResult = await client.query(
        `DELETE FROM emergency_lamp_records WHERE id = $1`,
        [id]
      );

      console.log(`✅ [API] Menghapus ${deleteRecordResult.rowCount} record`);

      await client.query('COMMIT');
      console.log(`✅ [API] Transaction committed`);
      
      console.log('✅ [API] === DELETE BERHASIL ===');
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data Emergency Lamp berhasil dihapus',
          deletedItems: deleteItemsResult.rowCount,
          deletedFiles: deletedFiles,
          failedFiles: failedFiles
        },
        { status: 200 }
      );
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ [API] Transaction error:', transactionError);
      
      // Deteksi error spesifik PostgreSQL
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('violates foreign key constraint')) {
          console.error('❌ [API] Foreign key constraint error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Error relasi database. Pastikan tidak ada data yang terkait.',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('could not serialize access')) {
          console.error('❌ [API] Transaction serialization error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Konflik transaksi. Coba lagi.',
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
    console.error('❌ [API] === ERROR DELETE EMERGENCY LAMP ===');
    console.error('❌ [API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server saat menghapus data',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 10)
        } : undefined
      },
      { status: 500 }
    );
  }
}