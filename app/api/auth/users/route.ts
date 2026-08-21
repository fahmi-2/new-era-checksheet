// app/api/users/route.ts
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
      return NextResponse.json(
        { error: "Unauthorized! Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const department = searchParams.get("department");

    let query = `
      SELECT 
        id, 
        username, 
        full_name, 
        nik, 
        department, 
        role, 
        is_active,
        checksheets,
        created_at,
        last_login_at,
        total_logins
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR nik ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (department) {
      query += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const result = await client.query(query, params);

    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      nik: user.nik,
      department: user.department,
      role: user.role,
      isActive: user.is_active,
      checksheets: user.checksheets || [],
      createdAt: user.created_at,
      lastLogin: user.last_login_at,
      totalLogins: user.total_logins || 0,
    }));

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    });

  } catch (error: any) {
    console.error("❌ [FetchUsers] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data users.", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}