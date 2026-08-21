// app/api/users/online/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Threshold in seconds to consider user as "online"
const ONLINE_THRESHOLD = 120; // 2 minutes

export async function GET(req: NextRequest) {
  try {
    // Get users who have a heartbeat within the threshold
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        COALESCE(p.last_seen_at, u.updated_at) as last_seen_at,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_seen_at, u.updated_at)))::INTEGER as seconds_ago
      FROM users u
      LEFT JOIN user_presence p ON u.id = p.user_id
      WHERE p.last_seen_at IS NOT NULL 
        AND EXTRACT(EPOCH FROM (NOW() - p.last_seen_at))::INTEGER <= $1
      ORDER BY p.last_seen_at DESC
    `, [ONLINE_THRESHOLD]);

    const users = result.rows.map((user: any) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      last_seen_at: user.last_seen_at,
      seconds_ago: user.seconds_ago,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error('Get online users error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get online users' },
      { status: 500 }
    );
  }
}
