// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();

    try {
        const { username, requestType } = await request.json();
        const reqType: 'password' | 'username' = requestType === 'username' ? 'username' : 'password';

        if (!username?.trim()) {
            return NextResponse.json({ error: "Username wajib diisi!" }, { status: 400 });
        }

        // Cari user berdasarkan username (case-insensitive)
        const userResult = await client.query(
            "SELECT id, username, full_name, role FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true",
            [username.trim()]
        );

        // Demi keamanan, jika user tidak ditemukan, tetap return success agar hacker tidak bisa menebak username
        if (userResult.rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Jika username terdaftar, request reset password telah dikirim ke Admin."
            });
        }

        const user = userResult.rows[0];

        // Cek apakah sudah ada request PENDING dengan tipe yang sama yang belum expired (anti spam)
        let existingRequest;
        try {
            existingRequest = await client.query(
                `SELECT id FROM password_reset_requests 
           WHERE user_id = $1 AND status = 'PENDING' AND expires_at > NOW() AND request_type = $2`,
                [user.id, reqType]
            );
        } catch {
            existingRequest = await client.query(
                `SELECT id FROM password_reset_requests 
           WHERE user_id = $1 AND status = 'PENDING' AND expires_at > NOW()`,
                [user.id]
            );
        }

        if (existingRequest.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: `Request reset ${reqType === 'username' ? 'username' : 'password'} sudah ada dan sedang menunggu konfirmasi Admin.`
            });
        }

        // Buat request baru (expired 24 jam)
        let insertResult;
        try {
            insertResult = await client.query(
                `INSERT INTO password_reset_requests (user_id, status, request_type, expires_at)
           VALUES ($1, 'PENDING', $2, NOW() + INTERVAL '24 HOURS')
           RETURNING id`,
                [user.id, reqType]
            );
        } catch {
            insertResult = await client.query(
                `INSERT INTO password_reset_requests (user_id, status, expires_at)
           VALUES ($1, 'PENDING', NOW() + INTERVAL '24 HOURS')
           RETURNING id`,
                [user.id]
            );
        }

        const requestId = insertResult.rows[0].id;

        // Buat notifikasi untuk Admin
        const notifTitle = reqType === 'username' ? 'Request Reset Username' : 'Request Reset Password';
        const notifMsg = reqType === 'username'
            ? `User ${user.username} (${user.full_name}) meminta reset username/ID.`
            : `User ${user.username} (${user.full_name}) meminta reset password.`;
        await client.query(
            `INSERT INTO admin_notifications (admin_id, type, title, message, reference_id)
       VALUES (NULL, 'RESET_PASSWORD_REQUEST', $1, $2, $3)`,
            [notifTitle, notifMsg, requestId]
        );

        return NextResponse.json({
            success: true,
            message: `Request reset ${reqType === 'username' ? 'username' : 'password'} berhasil dikirim ke Admin. Silakan hubungi Admin untuk konfirmasi.`
        });

    } catch (error: any) {
        console.error("❌ [ForgotPassword] Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    } finally {
        client.release();
    }
}