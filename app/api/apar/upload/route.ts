// app/api/apar/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string; // ✅ Gunakan slug
    const lokasi = formData.get('lokasi') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP' },
        { status: 400 }
      );
    }

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB' },
        { status: 400 }
      );
    }

    // Buat filename unik
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const safeLokasi = lokasi.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `apar_${slug}_${safeLokasi}_${timestamp}.${fileExtension}`;
    
    // Path folder upload
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'apar');
    
    // Cek dan buat folder jika belum ada
    try {
      await access(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Folder upload dibuat:', uploadDir);
    }

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    console.log('✅ File berhasil disimpan:', filePath);

    // Validasi file tersimpan
    if (!existsSync(filePath)) {
      console.error('❌ File gagal disimpan:', filePath);
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan file ke server' },
        { status: 500 }
      );
    }

    // Return path relatif
    const relativePath = `/uploads/apar/${filename}`;

    console.log('✅ Upload berhasil:', {
      path: relativePath,
      filename,
      size: file.size,
      type: file.type
    });

    return NextResponse.json(
      {
        success: true,
        message: 'File berhasil diupload',
        data: {
          path: relativePath,
          filename,
          size: file.size,
          type: file.type
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat upload file',
        error: (error as any).message
      },
      { status: 500 }
    );
  }
}