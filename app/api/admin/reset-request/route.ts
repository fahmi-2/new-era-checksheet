// app/api/admin/reset-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
    const client = await pool.connect();

    try {
        const userRole = request.headers.get("x-user-role");
        if (!["admin", "superadmin"].includes(userRole || "")) {
            return NextResponse.json({ error: "Unauthorized! Admin access required." }, { status: 403 });
        }

        let result;
        try {
            result = await client.query(
                `SELECT 
             prr.id, prr.status, prr.requested_at, prr.expires_at, prr.request_type,
             u.id as user_id, u.username, u.full_name, u.department, u.role
           FROM password_reset_requests prr
           JOIN users u ON prr.user_id = u.id
           WHERE prr.status IN ('PENDING', 'CONFIRMED')
           ORDER BY prr.requested_at DESC`
            );
        } catch {
            result = await client.query(
                `SELECT 
             prr.id, prr.status, prr.requested_at, prr.expires_at,
             u.id as user_id, u.username, u.full_name, u.department, u.role
           FROM password_reset_requests prr
           JOIN users u ON prr.user_id = u.id
           WHERE prr.status IN ('PENDING', 'CONFIRMED')
           ORDER BY prr.requested_at DESC`
            );
        }

        const requests = result.rows.map(row => ({
            id: row.id,
            status: row.status,
            requestType: row.request_type || 'password',
            requestedAt: row.requested_at,
            expiresAt: row.expires_at,
            userId: row.user_id,
            username: row.username,
            fullName: row.full_name,
            department: row.department,
            userRole: row.role
        }));

        return NextResponse.json({
            success: true,
            data: requests
        });

    } catch (error: any) {
        console.error("❌ [GetResetRequests] Error:", error);
        return NextResponse.json({ error: "Gagal mengambil data request." }, { status: 500 });
    } finally {
        client.release();
    }
}