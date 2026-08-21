// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { generatePasswordData } from "@/lib/password";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();

    try {
        const { username, newPassword, confirmPassword } = await request.json();

        if (!username?.trim() || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: "Semua field wajib diisi!" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password minimal 6 karakter!" }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: "Password dan konfirmasi tidak cocok!" }, { status: 400 });
        }

        // Cari user (case-insensitive)
        const userResult = await client.query(
            "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true",
            [username.trim()]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "Username tidak ditemukan!" }, { status: 404 });
        }

        const userId = userResult.rows[0].id;

        // Cari request reset yang sudah CONFIRMED dan belum expired
        const requestResult = await client.query(
            `SELECT id FROM password_reset_requests 
       WHERE user_id = $1 AND status = 'CONFIRMED' AND expires_at > NOW()
       ORDER BY requested_at DESC LIMIT 1`,
            [userId]
        );

        if (requestResult.rows.length === 0) {
            return NextResponse.json({
                error: "Tidak ada request reset password yang disetujui atau request sudah expired. Silakan request ulang."
            }, { status: 403 });
        }

        const requestId = requestResult.rows[0].id;

        // Generate password baru (Hash & Encrypt)
        const { password_hash, encrypted_password, encryption_iv, encryption_auth_tag } = await generatePasswordData(newPassword);

        // Update password user
        await client.query(
            `UPDATE users 
       SET password_hash = $2, encrypted_password = $3, encryption_iv = $4, encryption_auth_tag = $5
       WHERE id = $1`,
            [userId, password_hash, encrypted_password, encryption_iv, encryption_auth_tag]
        );

        // Update status request menjadi COMPLETED
        await client.query(
            `UPDATE password_reset_requests 
       SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
            [requestId]
        );

        return NextResponse.json({
            success: true,
            message: "Password berhasil diubah! Silakan login dengan password baru."
        });

    } catch (error: any) {
        console.error("❌ [ResetPassword] Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    } finally {
        client.release();
    }
}