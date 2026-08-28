// app/api/toilet-inspections/master/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── DEFAULT VALUES (Fallback) ───────────────────────────────────
export const DEFAULT_INSPECTION_ITEMS = [
  { key: "kebersihanLantai", no: 1, item: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
  { key: "kebersihanDinding", no: 2, item: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
  { key: "bauToilet", no: 3, item: "Bau tidak menyengat / tidak ada bau tidak sedap" },
  { key: "ketersediaanAir", no: 4, item: "Ketersediaan air mencukupi" },
  { key: "klosetBersih", no: 5, item: "Kloset dan Urinoir bersih, tidak mampet, tidak bocor" },
  { key: "wastafel", no: 6, item: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
  { key: "tisuToilet", no: 7, item: "Tisu toilet tersedia" },
  { key: "tempatSampah", no: 8, item: "Tempat sampah tersedia dan tertutup" },
  { key: "ventilasi", no: 9, item: "Ventilasi cukup (tidak pengap)" },
  { key: "perlengkapanLain", no: 10, item: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
  { key: "lampu", no: 11, item: "Lampu penerangan berfungsi baik (tidak mati, tidak berkedip, tidak redup)" },
  { key: "keran", no: 12, item: "Keran air berfungsi baik (tidak bocor, tidak macet, aliran air normal)" },
  { key: "exhaustFan", no: 13, item: "Exhaust fan berfungsi baik (berputar normal, tidak berbunyi kasar, tidak bergetar berlebihan)" },
];

export const DEFAULT_AREAS = [
  { id: "toilet-driver", title: "TOILET - DRIVER", desc: "Toilet umum", type: "general" },
  { id: "toilet-bea-cukai", title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-parkir", title: "TOILET - PARKIR", desc: "Toilet umum", type: "general" },
  { id: "toilet-c2", title: "TOILET - C2", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-c1", title: "TOILET - C1", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-d", title: "TOILET - D", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-auditorium", title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-whs", title: "TOILET - WHS", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-b1", title: "TOILET - B1", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-b2", title: "TOILET - B2", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-genba-b", title: "TOILET - GENBA B", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-a", title: "TOILET - A", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-lobby", title: "TOILET - LOBBY", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-office-main", title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-b", title: "TOILET - B", desc: "Toilet wanita", type: "wanita" },
];

async function ensureChecksheetToiletMaster() {
  // Pastikan tabel master ada jika belum
  await pool.query(`
    CREATE TABLE IF NOT EXISTS toilet_master_config (
      id VARCHAR(50) PRIMARY KEY,
      areas JSONB NOT NULL,
      items JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by VARCHAR(100)
    );
  `);

  // Cek apakah ada record master
  const check = await pool.query('SELECT * FROM toilet_master_config WHERE id = $1', ['default']);
  if (check.rows.length === 0) {
    await pool.query(
      'INSERT INTO toilet_master_config (id, areas, items, updated_by) VALUES ($1, $2, $3, $4)',
      ['default', JSON.stringify(DEFAULT_AREAS), JSON.stringify(DEFAULT_INSPECTION_ITEMS), 'system']
    );
  }
}

// ─── GET MASTER CONFIG ──────────────────────────────────────────
export async function GET() {
  try {
    await ensureChecksheetToiletMaster();

    const res = await pool.query('SELECT * FROM toilet_master_config WHERE id = $1', ['default']);
    if (res.rows.length > 0) {
      const config = res.rows[0];
      return NextResponse.json({
        success: true,
        data: {
          areas: config.areas || DEFAULT_AREAS,
          items: config.items || DEFAULT_INSPECTION_ITEMS,
          updated_at: config.updated_at,
          updated_by: config.updated_by,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        areas: DEFAULT_AREAS,
        items: DEFAULT_INSPECTION_ITEMS,
      }
    });
  } catch (error: any) {
    console.error('❌ Get toilet master error:', error);
    // Fallback gracefully to default values if DB query has issues
    return NextResponse.json({
      success: true,
      data: {
        areas: DEFAULT_AREAS,
        items: DEFAULT_INSPECTION_ITEMS,
      },
      warning: 'Fallback default used: ' + error.message,
    });
  }
}

// ─── POST / UPDATE MASTER CONFIG ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await ensureChecksheetToiletMaster();
    const body = await request.json();
    const { areas, items, updated_by = 'admin' } = body;

    if (!areas && !items) {
      return NextResponse.json(
        { success: false, message: 'Harus menyertakan areas atau items yang akan diupdate' },
        { status: 400 }
      );
    }

    // Ambil data existing
    const currRes = await pool.query('SELECT * FROM toilet_master_config WHERE id = $1', ['default']);
    const curr = currRes.rows[0] || { areas: DEFAULT_AREAS, items: DEFAULT_INSPECTION_ITEMS };

    const newAreas = areas ? areas : curr.areas;
    const newItems = items ? items : curr.items;

    await pool.query(
      `
      INSERT INTO toilet_master_config (id, areas, items, updated_at, updated_by)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      ON CONFLICT (id) DO UPDATE SET
        areas = EXCLUDED.areas,
        items = EXCLUDED.items,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      `,
      ['default', JSON.stringify(newAreas), JSON.stringify(newItems), updated_by]
    );

    return NextResponse.json({
      success: true,
      message: 'Master data checksheet toilet berhasil disimpan',
      data: {
        areas: newAreas,
        items: newItems,
      }
    });
  } catch (error: any) {
    console.error('❌ Save toilet master error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan master data: ' + error.message },
      { status: 500 }
    );
  }
}
