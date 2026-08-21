// app/api/admin/show-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { decrypt } from "@/lib/encryption";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();

    try {
        const userRole = request.headers.get("x-user-role");
        const adminId = request.headers.get("x-user-id");

        if (!["admin", "superadmin"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized!" }, { status: 403 });
        }

        if (!adminId) {
            return NextResponse.json({ error: "Admin ID tidak ditemukan di header!" }, { status: 400 });
        }

        const { targetUserId, adminPassword } = await request.json();

        if (!targetUserId || !adminPassword) {
            return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
        }

        // 1. Verifikasi password Admin yang sedang login
        const adminResult = await client.query(
            "SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true",
            [adminId]
        );

        if (adminResult.rows.length === 0) {
            return NextResponse.json({ error: "Admin tidak ditemukan!" }, { status: 404 });
        }

        const admin = adminResult.rows[0];
        const isPasswordValid = await bcrypt.compare(adminPassword, admin.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Password admin salah!" }, { status: 401 });
        }

        // 2. Ambil data password terenkripsi milik target user
        const targetResult = await client.query(
            `SELECT username, encrypted_password, encryption_iv, encryption_auth_tag 
       FROM users WHERE id = $1`,
            [targetUserId]
        );

        if (targetResult.rows.length === 0) {
            return NextResponse.json({ error: "User target tidak ditemukan!" }, { status: 404 });
        }

        const targetUser = targetResult.rows[0];

        if (!targetUser.encrypted_password || !targetUser.encryption_iv || !targetUser.encryption_auth_tag) {
            return NextResponse.json({
                error: "Password user ini belum terenkripsi. User harus reset password atau dibuat ulang agar fitur ini berfungsi."
            }, { status: 400 });
        }

        // 3. Dekripsi password
        let decryptedPassword = "";
        try {
            decryptedPassword = decrypt(
                targetUser.encrypted_password,
                targetUser.encryption_iv,
                targetUser.encryption_auth_tag
            );
        } catch (decryptError) {
            console.error("Decryption failed:", decryptError);
            return NextResponse.json({ error: "Gagal mendekripsi password. Kemungkinan ENCRYPTION_KEY berubah." }, { status: 500 });
        }

        // 4. Catat di Audit Log (SANGAT PENTING untuk keamanan)
        await client.query(
            `INSERT INTO password_audit_logs (admin_id, target_user_id, action, ip_address, user_agent)
       VALUES ($1, $2, 'SHOW_PASSWORD', $3, $4)`,
            [
                adminId,
                targetUserId,
                request.headers.get("x-forwarded-for") || "unknown",
                request.headers.get("user-agent") || "unknown"
            ]
        );

        return NextResponse.json({
            success: true,
            data: {
                username: targetUser.username,
                password: decryptedPassword
            }
        });

    } catch (error: any) {
        console.error("❌ [ShowPassword] Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    } finally {
        client.release();
    }
}