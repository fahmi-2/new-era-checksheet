// app/api/auth/user-reset-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username query parameter required" }, { status: 400 });
    }

    // Cari user berdasarkan username (case-insensitive)
    const userResult = await client.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true",
      [username.trim()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ hasConfirmedRequest: false });
    }

    const userId = userResult.rows[0].id;

    // Cek apakah ada request reset dengan status CONFIRMED yang belum expired
    // Menggunakan try/fallback query jika kolom request_type belum ada di DB
    let requestResult;
    let requestType = 'password';

    try {
      requestResult = await client.query(
        `SELECT id, request_type FROM password_reset_requests 
         WHERE user_id = $1 AND status = 'CONFIRMED' AND expires_at > NOW()
         ORDER BY requested_at DESC LIMIT 1`,
        [userId]
      );
      if (requestResult.rows.length > 0 && requestResult.rows[0].request_type) {
        requestType = requestResult.rows[0].request_type;
      }
    } catch {
      // Fallback jika kolom request_type belum ada di DB
      requestResult = await client.query(
        `SELECT id FROM password_reset_requests 
         WHERE user_id = $1 AND status = 'CONFIRMED' AND expires_at > NOW()
         ORDER BY requested_at DESC LIMIT 1`,
        [userId]
      );
    }

    const hasConfirmedRequest = requestResult.rows.length > 0;

    return NextResponse.json({
      success: true,
      hasConfirmedRequest,
      requestId: hasConfirmedRequest ? requestResult.rows[0].id : null,
      requestType: hasConfirmedRequest ? requestType : null,
    });
  } catch (error: any) {
    console.error("❌ [UserResetStatus] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
