// app/api/users/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'user_id is required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Use UPSERT to insert or update user presence
    const query = `
      INSERT INTO user_presence (user_id, last_seen_at, is_online, ip_address, user_agent, updated_at)
      VALUES ($1, NOW(), true, $2, $3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        last_seen_at = NOW(),
        is_online = true,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
      RETURNING id, user_id, last_seen_at
    `;

    const result = await pool.query(query, [user_id, ip, userAgent]);

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        last_seen_at: result.rows[0].last_seen_at,
      },
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}
