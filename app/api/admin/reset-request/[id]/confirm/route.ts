// app/api/admin/reset-requests/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const client = await pool.connect();

    try {
        const userRole = request.headers.get("x-user-role");
        const adminId = request.headers.get("x-user-id"); // Pastikan frontend mengirim header ini

        if (!["admin", "superadmin"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized!" }, { status: 403 });
        }

        let effectiveAdminId = adminId;
        if (!effectiveAdminId) {
            const adminRes = await client.query("SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1");
            if (adminRes.rows.length > 0) {
                effectiveAdminId = adminRes.rows[0].id;
            }
        }

        const { id: requestId } = await params;

        // Update status request menjadi CONFIRMED
        const result = await client.query(
            `UPDATE password_reset_requests 
       SET status = 'CONFIRMED', confirmed_by = $2, confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING' AND expires_at > NOW()
       RETURNING user_id`,
            [requestId, effectiveAdminId || null]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({
                error: "Request tidak ditemukan, sudah diproses, atau sudah expired!"
            }, { status: 404 });
        }

        const targetUserId = result.rows[0].user_id;

        // Catat di audit log jika tabel ada
        try {
            await client.query(
                `INSERT INTO password_audit_logs (admin_id, target_user_id, action, ip_address)
           VALUES ($1, $2, 'RESET_CONFIRM', $3)`,
                [effectiveAdminId || targetUserId, targetUserId, request.headers.get("x-forwarded-for") || "unknown"]
            );
        } catch {
            // Abaikan jika tabel audit log belum dibuat
        }

        return NextResponse.json({
            success: true,
            message: "Request berhasil dikonfirmasi oleh Admin!"
        });

    } catch (error: any) {
        console.error("❌ [ConfirmResetRequest] Error:", error);
        return NextResponse.json({ error: "Gagal mengkonfirmasi request." }, { status: 500 });
    } finally {
        client.release();
    }
}