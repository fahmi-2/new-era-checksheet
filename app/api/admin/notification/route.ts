// app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
    const client = await pool.connect();

    try {
        const userRole = request.headers.get("x-user-role");
        const adminId = request.headers.get("x-user-id");

        if (!["admin", "superadmin"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized!" }, { status: 403 });
        }

        // Ambil notifikasi yang belum dibaca untuk admin ini atau untuk semua admin (admin_id IS NULL)
        const result = await client.query(
            `SELECT id, type, title, message, reference_id, created_at
       FROM admin_notifications
       WHERE is_read = FALSE AND (admin_id = $1 OR admin_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 20`,
            [adminId]
        );

        return NextResponse.json({
            success: true,
            data: result.rows
        });

    } catch (error: any) {
        console.error("❌ [GetNotifications] Error:", error);
        return NextResponse.json({ error: "Gagal mengambil notifikasi." }, { status: 500 });
    } finally {
        client.release();
    }
}