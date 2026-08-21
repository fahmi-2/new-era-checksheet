// app/api/debug/test/route.ts - Endpoint minimal untuk testing
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log('🧪 [DEBUG] /api/debug/test HIT at', new Date().toISOString());
  console.log('🧪 [DEBUG] Request URL:', request.url);
  console.log('🧪 [DEBUG] Headers:', Object.fromEntries(request.headers.entries()));
  
  return new NextResponse(
    JSON.stringify({ 
      ok: true, 
      message: "Hello from /api/debug/test",
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Debug': 'test-response',
      },
    }
  );
}