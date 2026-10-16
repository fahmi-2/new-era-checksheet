import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { aparDataBySlug, AparDataItem } from '@/lib/apar-data';

export const dynamic = 'force-dynamic';

export const DEFAULT_AREA_NAMES: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM",
  "area-training-dining-mtc": "AREA TRAINING & DINING ROOM",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (GENBA A)",
  "power-house-genba-c": "POWER HOUSE (GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE & WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

export const DEFAULT_CHECK_ITEMS = [
  { label: "Masa Berlaku", short: "Masa", help: "Lihat identitas APAR apakah masih berlaku" },
  { label: "Tekanan", short: "Tekanan", help: "Jarum tekanan di warna hijau" },
  { label: "Isi Tabung", short: "Isi", help: "Isi APAR tidak menggumpal" },
  { label: "Selang", short: "Selang", help: "Selang tidak rusak" },
  { label: "Segel", short: "Segel", help: "Segel terkunci" },
  { label: "Kondisi Tabung", short: "Tabung", help: "Area APAR tidak terhalang" },
  { label: "Gantungan", short: "Gantung", help: "Gantungan tidak rusak" },
  { label: "Lay out", short: "Layout", help: "APAR ada lay out" },
  { label: "Papan Petunjuk", short: "Papan", help: "Terpasang dan mudah dilihat" },
  { label: "OS & C/S", short: "OS/CS", help: "Terpasang rapi dan update" },
  { label: "Area Sekitar", short: "Area", help: "Akses APAR mudah" },
  { label: "Posisi APAR", short: "Posisi", help: "APAR tidak bergeser" },
];

async function ensureAparMasterConfig() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS apar_master_config (
      id VARCHAR(50) PRIMARY KEY,
      areas JSONB NOT NULL,
      check_items JSONB NOT NULL,
      area_items JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by VARCHAR(100)
    );
  `);

  const check = await pool.query('SELECT * FROM apar_master_config WHERE id = $1', ['default']);
  if (check.rows.length === 0) {
    await pool.query(
      'INSERT INTO apar_master_config (id, areas, check_items, area_items, updated_by) VALUES ($1, $2, $3, $4, $5)',
      [
        'default',
        JSON.stringify(DEFAULT_AREA_NAMES),
        JSON.stringify(DEFAULT_CHECK_ITEMS),
        JSON.stringify(aparDataBySlug),
        'system'
      ]
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAparMasterConfig();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const full = searchParams.get('full');

    const configRes = await pool.query('SELECT * FROM apar_master_config WHERE id = $1', ['default']);
    const config = configRes.rows[0] || {
      areas: DEFAULT_AREA_NAMES,
      check_items: DEFAULT_CHECK_ITEMS,
      area_items: aparDataBySlug
    };

    const areas: Record<string, string> = config.areas || DEFAULT_AREA_NAMES;
    const checkItems = config.check_items || DEFAULT_CHECK_ITEMS;
    const areaItems: Record<string, AparDataItem[]> = config.area_items || aparDataBySlug;

    // Jika parameter `full=true`, kembalikan seluruh bundle konfigurasi
    if (full === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          areas,
          checkItems,
          areaItems,
          updated_at: config.updated_at,
          updated_by: config.updated_by
        }
      });
    }

    // Jika tanpa slug, kembalikan summary count per area
    if (!slug) {
      const areaCounts: Record<string, number> = {};
      Object.keys(areas).forEach((areaSlug) => {
        const items = areaItems[areaSlug] || aparDataBySlug[areaSlug] || [];
        areaCounts[areaSlug] = items.length;
      });

      return NextResponse.json({
        success: true,
        areas,
        checkItems,
        countsByArea: areaCounts,
        totalApar: Object.values(areaCounts).reduce((a, b) => a + b, 0)
      });
    }

    // Ambil master items untuk spesifik slug
    const itemsForSlug = areaItems[slug] || aparDataBySlug[slug] || [];

    return NextResponse.json({
      success: true,
      data: itemsForSlug,
      checkItems,
      areaName: areas[slug] || slug.toUpperCase(),
      count: itemsForSlug.length
    });

  } catch (error) {
    console.error('Get APAR master data error:', error);
    // Graceful fallback
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const fallbackItems = aparDataBySlug[slug] || [];
      return NextResponse.json({
        success: true,
        data: fallbackItems,
        checkItems: DEFAULT_CHECK_ITEMS,
        areaName: DEFAULT_AREA_NAMES[slug] || slug.toUpperCase(),
        count: fallbackItems.length,
        warning: 'Fallback static used: ' + (error as Error).message
      });
    }

    return NextResponse.json({
      success: true,
      areas: DEFAULT_AREA_NAMES,
      checkItems: DEFAULT_CHECK_ITEMS,
      countsByArea: Object.fromEntries(Object.entries(aparDataBySlug).map(([k, v]) => [k, v.length])),
      totalApar: Object.values(aparDataBySlug).reduce((a, b) => a + b.length, 0),
      warning: 'Fallback static used: ' + (error as Error).message
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAparMasterConfig();
    const body = await request.json();
    const { areas, checkItems, areaItems, slug, itemsForSlug, updated_by = 'admin' } = body;

    const currRes = await pool.query('SELECT * FROM apar_master_config WHERE id = $1', ['default']);
    const curr = currRes.rows[0] || {
      areas: DEFAULT_AREA_NAMES,
      check_items: DEFAULT_CHECK_ITEMS,
      area_items: aparDataBySlug
    };

    let newAreas = areas ? areas : curr.areas;
    let newCheckItems = checkItems ? checkItems : curr.check_items;
    let newAreaItems = areaItems ? areaItems : { ...curr.area_items };

    // Jika menyimpan item spesifik untuk 1 slug
    if (slug && itemsForSlug) {
      newAreaItems[slug] = itemsForSlug;
    }

    await pool.query(
      `
      INSERT INTO apar_master_config (id, areas, check_items, area_items, updated_at, updated_by)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      ON CONFLICT (id) DO UPDATE SET
        areas = EXCLUDED.areas,
        check_items = EXCLUDED.check_items,
        area_items = EXCLUDED.area_items,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      `,
      [
        'default',
        JSON.stringify(newAreas),
        JSON.stringify(newCheckItems),
        JSON.stringify(newAreaItems),
        updated_by
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Master konfigurasi APAR berhasil disimpan',
      data: {
        areas: newAreas,
        checkItems: newCheckItems,
        areaItems: newAreaItems
      }
    });

  } catch (error: any) {
    console.error('Save APAR master error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan master data APAR: ' + error.message },
      { status: 500 }
    );
  }
}
