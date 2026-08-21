// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
// Sesuaikan path import
import { generatePasswordData } from "@/lib/password";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const userRole = request.headers.get("x-user-role");
    if (!["admin", "superadmin"].includes(userRole || "")) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      username, fullName, nik, department, role,
      newPassword, isActive, checksheets
    } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex}`);
      values.push(username.trim());
      paramIndex++;
    }
    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(fullName.trim());
      paramIndex++;
    }
    if (nik !== undefined) {
      updates.push(`nik = $${paramIndex}`);
      values.push(nik.trim());
      paramIndex++;
    }
    if (department !== undefined) {
      updates.push(`department = $${paramIndex}`);
      values.push(department);
      paramIndex++;
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    // UPDATE PASSWORD DENGAN HASH & ENCRYPTION BARU
    if (newPassword) {
      const { password_hash, encrypted_password, encryption_iv, encryption_auth_tag } = await generatePasswordData(newPassword);

      updates.push(`password_hash = $${paramIndex}`);
      values.push(password_hash);
      paramIndex++;

      updates.push(`encrypted_password = $${paramIndex}`);
      values.push(encrypted_password);
      paramIndex++;

      updates.push(`encryption_iv = $${paramIndex}`);
      values.push(encryption_iv);
      paramIndex++;

      updates.push(`encryption_auth_tag = $${paramIndex}`);
      values.push(encryption_auth_tag);
      paramIndex++;
    }

    if (checksheets !== undefined) {
      updates.push(`checksheets = $${paramIndex}::text[]`);
      values.push(Array.isArray(checksheets) ? checksheets : []);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diupdate!" }, { status: 400 });
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, username, full_name, nik, department, role, is_active, checksheets
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan!" }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        nik: updatedUser.nik,
        department: updatedUser.department,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        checksheets: updatedUser.checksheets || [],
      }
    });

  } catch (error: any) {
    console.error("❌ [UpdateUser] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate user.", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ... (Fungsi DELETE tetap sama seperti kode Anda)