// app/api/fire-alarm/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 60; // Timeout 60 detik untuk upload besar

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const zona = formData.get('zona') as string;
    const lokasi = formData.get('lokasi') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP' },
        { status: 400 }
      );
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar (maksimal 5MB)' },
        { status: 400 }
      );
    }

    // Generate nama file unik
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeZona = zona.replace(/\s+/g, '-').toLowerCase();
    const safeLokasi = lokasi.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const fileName = `fire-alarm-${safeZona}-${safeLokasi}-${Date.now()}-${randomUUID().slice(0, 8)}.${fileExt}`;

    // Path penyimpanan
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'fire-alarm');
    const filePath = join(uploadDir, fileName);

    // Pastikan direktori ada (bisa ditambahkan di next.config.js atau script init)
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Path relatif untuk disimpan di database
    const relativePath = `/uploads/fire-alarm/${fileName}`;

    console.log('✅ Foto berhasil diupload:', relativePath);

    return NextResponse.json({
      success: true,
      message: 'Foto berhasil diupload',
      data: {
        path: relativePath,
        fileName: fileName,
        originalName: file.name,
        size: file.size
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Handle error spesifik
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Direktori upload tidak ditemukan. Pastikan folder /public/uploads/fire-alarm ada',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat upload foto',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}