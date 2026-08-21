// app/api/auth/reset-username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();

    try {
        const { username, newUsername } = await request.json();

        if (!username?.trim() || !newUsername?.trim()) {
            return NextResponse.json({ error: "Semua field wajib diisi!" }, { status: 400 });
        }

        const trimmedNew = newUsername.trim().toLowerCase();

        if (trimmedNew.length < 3) {
            return NextResponse.json({ error: "Username minimal 3 karakter!" }, { status: 400 });
        }

        if (!/^[a-z0-9_.-]+$/.test(trimmedNew)) {
            return NextResponse.json({
                error: "Username hanya boleh mengandung huruf kecil, angka, underscore, titik, atau tanda hubung!"
            }, { status: 400 });
        }

        // Cari user berdasarkan username saat ini
        const userResult = await client.query(
            "SELECT id FROM users WHERE username = $1 AND is_active = true",
            [username.trim()]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "Username tidak ditemukan!" }, { status: 404 });
        }

        const userId = userResult.rows[0].id;

        // Cek apakah username baru sudah digunakan orang lain
        const existingUsername = await client.query(
            "SELECT id FROM users WHERE username = $1 AND id != $2",
            [trimmedNew, userId]
        );

        if (existingUsername.rows.length > 0) {
            return NextResponse.json({ error: "Username tersebut sudah digunakan oleh akun lain!" }, { status: 409 });
        }

        // Cari request reset username yang sudah CONFIRMED dan belum expired
        const requestResult = await client.query(
            `SELECT id FROM password_reset_requests 
       WHERE user_id = $1 AND status = 'CONFIRMED' AND request_type = 'username' AND expires_at > NOW()
       ORDER BY requested_at DESC LIMIT 1`,
            [userId]
        );

        if (requestResult.rows.length === 0) {
            return NextResponse.json({
                error: "Tidak ada request reset username yang disetujui atau request sudah expired. Silakan request ulang."
            }, { status: 403 });
        }

        const requestId = requestResult.rows[0].id;

        // Update username user
        await client.query(
            `UPDATE users SET username = $2 WHERE id = $1`,
            [userId, trimmedNew]
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
            newUsername: trimmedNew,
            message: "Username berhasil diubah! Silakan login dengan username baru.",
        });

    } catch (error: any) {
        console.error("❌ [ResetUsername] Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    } finally {
        client.release();
    }
}
