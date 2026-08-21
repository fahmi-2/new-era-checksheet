// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username?.trim() || !password) {
      return NextResponse.json({ error: "Username dan password harus diisi!" }, { status: 400 });
    }

    client = await pool.connect();

    const result = await client.query(
      `SELECT id, username, full_name, nik, department, role, password_hash, is_active, checksheets
      FROM users WHERE LOWER(username) = LOWER($1)`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Username atau password salah!" }, { status: 401 });
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      return NextResponse.json({ error: "Akun tidak aktif! Hubungi administrator." }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Username atau password salah!" }, { status: 401 });
    }

    let checksheets: string[] = [];
    if (user.checksheets) {
      if (Array.isArray(user.checksheets)) {
        checksheets = user.checksheets;
      } else if (typeof user.checksheets === 'string') {
        try {
          const arrayString = user.checksheets.trim();
          if (arrayString !== '{}' && arrayString.length > 0) {
            const inner = arrayString.slice(1, -1);
            if (inner.length > 0) {
              checksheets = inner.split(',').map((s: string) => s.replace(/"/g, '').trim());
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse checksheets');
        }
      }
    }

    await client.query(
      `UPDATE users SET last_login_at = NOW(), total_logins = COALESCE(total_logins, 0) + 1
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        nik: user.nik,
        department: user.department,
        role: user.role,
        checksheets: checksheets,
      }
    });

  } catch (error: any) {
    console.error("❌ [Login] Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}