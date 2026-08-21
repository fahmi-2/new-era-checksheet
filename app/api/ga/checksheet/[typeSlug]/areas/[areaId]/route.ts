// app/api/ga/checksheet/[typeSlug]/areas/[areaId]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RouteParams = {
  typeSlug: string;
  areaId: string;
};

// ✅ DELETE: Hapus area
export async function DELETE(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const client = await pool.connect();
  
  try {
    const { typeSlug, areaId } = await params;
    
    console.log('🗑️ Deleting area:', areaId, 'for type:', typeSlug);
    
    // Cek type
    const typesResult = await client.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1`,
      [typeSlug]
    );
    
    if (typesResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }
    
    const typeId = typesResult.rows[0].id;
    
    // Cek apakah area ada dan milik type ini
    const areaResult = await client.query(
      `SELECT id, no, name FROM ga_checksheet_areas WHERE id = $1 AND type_id = $2`,
      [areaId, typeId]
    );
    
    if (areaResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Area tidak ditemukan' },
        { status: 404 }
      );
    }
    
    const area = areaResult.rows[0];
    
    // ✅ Mulai transaction
    await client.query('BEGIN');
    
    try {
      // Hapus semua headers dan details terkait area ini
      await client.query(
        `DELETE FROM ga_checksheet_headers WHERE area_id = $1`,
        [areaId]
      );
      
      // Hapus area
      await client.query(
        `DELETE FROM ga_checksheet_areas WHERE id = $1`,
        [areaId]
      );
      
      // ✅ Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Area deleted successfully:', area.name);
      
      return NextResponse.json({
        success: true,
        message: 'Area berhasil dihapus',
        data: { id: area.id, name: area.name }
      });
      
    } catch (error) {
      // ✅ Rollback jika error
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error deleting area:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus data area' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}