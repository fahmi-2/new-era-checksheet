// app/api/emergency-lamp/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

export const maxDuration = 60; // Timeout 60 detik

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API] Menerima request upload foto Emergency Lamp');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const area = formData.get('area') as string;
    const lokasi = formData.get('lokasi') as string;

    if (!file) {
      console.error('❌ [API] File tidak ditemukan');
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    console.log('📊 [API] File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [API] Format file tidak didukung:', file.type);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP' 
        },
        { status: 400 }
      );
    }

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ [API] Ukuran file terlalu besar:', file.size);
      return NextResponse.json(
        { 
          success: false, 
          message: `Ukuran file terlalu besar (${Math.round(file.size / 1024)} KB). Maksimal 5MB` 
        },
        { status: 400 }
      );
    }

    // Buat filename unik dengan UUID untuk menghindari duplikasi
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeArea = area.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const safeLokasi = lokasi
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 50);
    
    const filename = `emergency-lamp_${safeArea}_${safeLokasi}_${timestamp}_${randomUUID().slice(0, 8)}.${fileExtension}`;
    
    // Path folder upload
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'emergency-lamp');
    
    // Cek dan buat folder jika belum ada
    try {
      await access(uploadDir);
      console.log('✅ [API] Folder upload sudah ada:', uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ [API] Folder upload dibuat:', uploadDir);
    }

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    
    console.log('💾 [API] Menyimpan file ke:', filePath);
    await writeFile(filePath, buffer);
    console.log('✅ [API] File berhasil disimpan');

    // Cek apakah file benar-benar tersimpan
    const fileExists = existsSync(filePath);
    if (!fileExists) {
      console.error('❌ [API] File gagal disimpan:', filePath);
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan file ke server' },
        { status: 500 }
      );
    }

    // Return path relatif
    const relativePath = `/uploads/emergency-lamp/${filename}`;

    console.log('✅ [API] Upload berhasil:', {
      path: relativePath,
      filename: filename,
      size: file.size,
      type: file.type
    });

    return NextResponse.json(
      {
        success: true,
        message: 'File berhasil diupload',
        data: {
          path: relativePath,
          filename: filename,
          size: file.size,
          type: file.type,
          originalName: file.name
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [API] Upload error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Direktori upload tidak ditemukan. Pastikan folder /public/uploads/emergency-lamp ada',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('EACCES')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Permission denied. Tidak dapat menulis ke direktori upload',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat upload file',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 5)
        } : undefined
      },
      { status: 500 }
    );
  } 
}