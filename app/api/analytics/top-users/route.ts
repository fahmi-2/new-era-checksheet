  // app/api/analytics/top-users/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import pool from '@/lib/db';

  export const runtime = 'nodejs';
  export const dynamic = 'force-dynamic';

  // ═══════════════════════════════════════════════════════════
  // KOLOM TANGGAL & PIC — selaras dengan analytics/route.ts
  // ───────────────────────────────────────────────────────────
  // apar_records             → submitted_at,   checker
  // fire_alarm_records       → submitted_at,   checker
  // emergency_lamp_records   → submitted_at,   checker
  // apd_records              → submitted_at,   checker
  // toilet_inspections       → inspection_date, inspector_name
  // electrical_inspections   → tanggal,         pic
  // exit_lamp_checklists     → checklist_date,  checker_name
  // pintu_darurat_checklists → checklist_date,  checker_name
  // titik_kumpul_checklists  → checklist_date,  checker_name
  // lift_barang_inspections  → inspection_date, inspector
  // ga_checksheet_headers    → check_date,      submitted_by / checker / inspector_name
  // ═══════════════════════════════════════════════════════════

  export async function GET(request: NextRequest) {
    try {
      const sp       = request.nextUrl.searchParams;
      const slug     = (sp.get('slug') ?? '').toLowerCase().trim();
      const dateFrom = sp.get('dateFrom');
      const dateTo   = sp.get('dateTo');

      console.log(`\n👥 TOP-USERS  slug=${slug}  ${dateFrom}→${dateTo}`);

      if (!slug || !dateFrom || !dateTo) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      // ─── safe query helper ──────────────────────────────────
      async function run(sql: string, params: any[], label = ''): Promise<Array<{ name: string; count: number }>> {
        try {
          const r = await pool.query(sql, params);
          console.log(`  ✅ ${label}: ${r.rows.length} users`);
          return r.rows.map((row: any) => ({
            name:  row.name  || 'Unknown',
            count: parseInt(row.count) || 0,
          }));
        } catch (err) {
          console.error(`  ❌ ${label}:`, (err as Error).message);
          return [];
        }
      }

      const P = [dateFrom, dateTo] as any[];

      // ═══════════════════════════════════════════════════════
      // LEGACY QUERY DEFINITIONS
      // ✅ Semua pakai kolom tanggal yang benar (sesuai analytics)
      // ═══════════════════════════════════════════════════════
      const LEGACY: Record<string, () => Promise<Array<{ name: string; count: number }>>> = {

        // ✅ submitted_at — bukan 'date'
        'apar': () => run(`
          SELECT checker AS name, COUNT(DISTINCT id) AS count
          FROM apar_records
          WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            AND checker IS NOT NULL AND checker <> ''
          GROUP BY checker
          ORDER BY count DESC LIMIT 10`, P, 'apar'),

        // ✅ submitted_at — bukan 'date'
        'fire-alarm': () => run(`
          SELECT checker AS name, COUNT(DISTINCT id) AS count
          FROM fire_alarm_records
          WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            AND checker IS NOT NULL AND checker <> ''
          GROUP BY checker
          ORDER BY count DESC LIMIT 10`, P, 'fire-alarm'),

        // ✅ submitted_at — bukan 'date'
        'emergency-lamp': () => run(`
          SELECT checker AS name, COUNT(DISTINCT id) AS count
          FROM emergency_lamp_records
          WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            AND checker IS NOT NULL AND checker <> ''
          GROUP BY checker
          ORDER BY count DESC LIMIT 10`, P, 'emergency-lamp'),

        // ✅ submitted_at — bukan 'date'
        'apd': () => run(`
          SELECT checker AS name, COUNT(DISTINCT id) AS count
          FROM apd_records
          WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            AND checker IS NOT NULL AND checker <> ''
          GROUP BY checker
          ORDER BY count DESC LIMIT 10`, P, 'apd'),

        // ✅ inspection_date — sudah benar
        'toilet': () => run(`
          SELECT inspector_name AS name, COUNT(DISTINCT id) AS count
          FROM toilet_inspections
          WHERE inspection_date BETWEEN $1 AND $2
            AND inspector_name IS NOT NULL AND inspector_name <> ''
          GROUP BY inspector_name
          ORDER BY count DESC LIMIT 10`, P, 'toilet'),

        // ✅ tanggal — sudah benar
        'electrical': () => run(`
          SELECT pic AS name, COUNT(DISTINCT id) AS count
          FROM electrical_inspections
          WHERE tanggal BETWEEN $1 AND $2
            AND pic IS NOT NULL AND pic <> ''
          GROUP BY pic
          ORDER BY count DESC LIMIT 10`, P, 'electrical'),

        // ✅ checklist_date — sudah benar
        'exit-lamp': () => run(`
          SELECT checker_name AS name, COUNT(DISTINCT id) AS count
          FROM exit_lamp_checklists
          WHERE checklist_date BETWEEN $1 AND $2
            AND checker_name IS NOT NULL AND checker_name <> ''
          GROUP BY checker_name
          ORDER BY count DESC LIMIT 10`, P, 'exit-lamp'),

        // ✅ checklist_date — sudah benar
        'pintu-darurat': () => run(`
          SELECT checker_name AS name, COUNT(DISTINCT id) AS count
          FROM pintu_darurat_checklists
          WHERE checklist_date BETWEEN $1 AND $2
            AND checker_name IS NOT NULL AND checker_name <> ''
          GROUP BY checker_name
          ORDER BY count DESC LIMIT 10`, P, 'pintu-darurat'),

        // ✅ checklist_date — sudah benar
        'titik-kumpul': () => run(`
          SELECT checker_name AS name, COUNT(DISTINCT id) AS count
          FROM titik_kumpul_checklists
          WHERE checklist_date BETWEEN $1 AND $2
            AND checker_name IS NOT NULL AND checker_name <> ''
          GROUP BY checker_name
          ORDER BY count DESC LIMIT 10`, P, 'titik-kumpul'),

        // ✅ inspection_date — sudah benar
        'lift-barang': () => run(`
          SELECT inspector AS name, COUNT(DISTINCT id) AS count
          FROM lift_barang_inspections
          WHERE inspection_date BETWEEN $1 AND $2
            AND inspector IS NOT NULL AND inspector <> ''
          GROUP BY inspector
          ORDER BY count DESC LIMIT 10`, P, 'lift-barang'),
      };

      // ═══════════════════════════════════════════════════════
      // GA QUERY
      // ✅ pakai check_date, join by slug
      // ═══════════════════════════════════════════════════════
      const GA_SLUGS = [
        'tg-listrik','inf-jalan','inspeksi-apd',
        'inspeksi-hydrant','selang-hydrant','panel','smoke-detector',
      ];

      // app/api/analytics/top-users/route.ts

function queryGA(gaSlug: string) {
  return run(`
  SELECT
  h.inspector_name AS name,
  COUNT(DISTINCT h.id) AS count
  FROM ga_checksheet_headers h
  INNER JOIN ga_checksheet_types t ON h.type_id = t.id
  WHERE t.slug = $3 AND h.check_date BETWEEN $1 AND $2
  AND h.inspector_name IS NOT NULL
  AND h.inspector_name <> ''
  GROUP BY h.inspector_name
  ORDER BY count DESC LIMIT 10`,
  [dateFrom, dateTo, gaSlug],
  `ga:${gaSlug}`
  );
}

      // ─── aggregate & sort helper ────────────────────────────
      function aggregate(rows: Array<{ name: string; count: number }>, topN = 5) {
        const map = new Map<string, number>();
        for (const r of rows) {
          if (!r.name || r.name === 'Unknown') continue;
          map.set(r.name, (map.get(r.name) ?? 0) + r.count);
        }
        return Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, topN);
      }

      // ═══════════════════════════════════════════════════════
      // ROUTE: ALL CATEGORY
      // ═══════════════════════════════════════════════════════
      if (slug === 'all') {
        const all: Array<{ name: string; count: number }> = [];

        for (const fn of Object.values(LEGACY)) all.push(...(await fn()));
        for (const gs of GA_SLUGS)              all.push(...(await queryGA(gs)));

        const result = aggregate(all, 5);
        console.log(`👥 ALL top users:`, result);
        return NextResponse.json({ success: true, data: result });
      }

      // ═══════════════════════════════════════════════════════
      // ROUTE: SINGLE LEGACY SLUG
      // ═══════════════════════════════════════════════════════
      if (LEGACY[slug]) {
        const rows   = await LEGACY[slug]();
        const result = aggregate(rows, 5);
        console.log(`👥 ${slug} top users:`, result);
        return NextResponse.json({ success: true, data: result });
      }

      // ═══════════════════════════════════════════════════════
      // ROUTE: GA SLUG
      // ═══════════════════════════════════════════════════════
      if (GA_SLUGS.includes(slug)) {
        const rows   = await queryGA(slug);
        const result = aggregate(rows, 5);
        console.log(`👥 GA:${slug} top users:`, result);
        return NextResponse.json({ success: true, data: result });
      }

      return NextResponse.json({ error: `Unknown slug: ${slug}` }, { status: 400 });

    } catch (error) {
      console.error('❌ Top Users API error:', error);
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }