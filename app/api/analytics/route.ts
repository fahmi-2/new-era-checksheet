// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// HELPER: Unified query untuk tabel ga_checksheet_*
// ============================================================
async function runUnifiedQuery(
  typeSlug: string,
  dateFrom: string,
  dateTo: string
) {
  console.log(`📊 Querying [unified] ${typeSlug}...`);

  const query = `
    SELECT
      TO_CHAR(h.check_date, 'YYYY-MM-DD') AS date,
      COUNT(DISTINCT h.id)                AS total,
      COUNT(DISTINCT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM ga_checksheet_details d
          WHERE d.header_id = h.id
            AND (d.result = 'NG' OR d.result = 'NOK')
        ) THEN h.id END)                  AS ok_count,
      COUNT(DISTINCT CASE
        WHEN EXISTS (
          SELECT 1 FROM ga_checksheet_details d
          WHERE d.header_id = h.id
            AND (d.result = 'NG' OR d.result = 'NOK')
        ) THEN h.id END)                  AS ng_count
    FROM ga_checksheet_headers h
    INNER JOIN ga_checksheet_types t ON h.type_id = t.id
    WHERE t.slug    = $1
      AND h.check_date >= $2
      AND h.check_date <= $3
    GROUP BY h.check_date
    ORDER BY h.check_date ASC
  `;

  const result = await pool.query(query, [typeSlug, dateFrom, dateTo]);

  const formattedData = result.rows.flatMap((row: any) => {
    const date = row.date as string;
    const ok   = parseInt(row.ok_count) || 0;
    const ng   = parseInt(row.ng_count) || 0;
    const data = [];
    if (ok > 0) data.push({ date, status: 'OK', count: ok });
    if (ng > 0) data.push({ date, status: 'NG', count: ng });
    return data;
  });

  console.log(`📊 [unified] ${typeSlug} formattedData:`, formattedData);
  return formattedData;
}

// ============================================================
// HELPER: Format rows → [{ date, status, count }]
// ============================================================
function formatRows(rows: any[]) {
  return rows.flatMap((row: any) => {
    const date = row.date as string;
    const ok   = parseInt(row.ok_count) || 0;
    const ng   = parseInt(row.ng_count) || 0;
    const data = [];
    if (ok > 0) data.push({ date, status: 'OK', count: ok });
    if (ng > 0) data.push({ date, status: 'NG', count: ng });
    return data;
  });
}

// ============================================================
// GET /api/analytics
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug     = searchParams.get('slug');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    console.log('\n📊 === ANALYTICS API CALLED ===');
    console.log('📊 Slug:', slug);
    console.log('📊 Date range:', dateFrom, 'to', dateTo);

    if (!slug || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const key = slug.toLowerCase();

    // ────────────────────────────────────────────────────────
    // 1. APAR
    // ────────────────────────────────────────────────────────
    if (key === 'apar') {
      console.log('📊 Querying APAR...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT r.id) AS total,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM apar_items i
              WHERE i.record_id = r.id
                AND (i.check1='X' OR i.check2='X' OR i.check3='X' OR i.check4='X'
                  OR i.check5='X' OR i.check6='X' OR i.check7='X' OR i.check8='X'
                  OR i.check9='X' OR i.check10='X' OR i.check11='X' OR i.check12='X')
            ) THEN r.id END) AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM apar_items i
              WHERE i.record_id = r.id
                AND (i.check1='X' OR i.check2='X' OR i.check3='X' OR i.check4='X'
                  OR i.check5='X' OR i.check6='X' OR i.check7='X' OR i.check8='X'
                  OR i.check9='X' OR i.check10='X' OR i.check11='X' OR i.check12='X')
            ) THEN r.id END) AS ng_count
        FROM apar_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 2. FIRE ALARM
    // ────────────────────────────────────────────────────────
    if (key === 'fire-alarm') {
      console.log('📊 Querying Fire Alarm...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT r.id) AS total,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM fire_alarm_items i
              WHERE i.record_id = r.id
                AND (i.alarm_bell='NG' OR i.indicator_lamp='NG'
                  OR i.manual_call_point='NG' OR i.kebersihan='NG')
            ) THEN r.id END) AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM fire_alarm_items i
              WHERE i.record_id = r.id
                AND (i.alarm_bell='NG' OR i.indicator_lamp='NG'
                  OR i.manual_call_point='NG' OR i.kebersihan='NG')
            ) THEN r.id END) AS ng_count
        FROM fire_alarm_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 3. EMERGENCY LAMP
    // ────────────────────────────────────────────────────────
    if (key === 'emergency-lamp') {
      console.log('📊 Querying Emergency Lamp...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT r.id) AS total,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM emergency_lamp_items i
              WHERE i.record_id = r.id
                AND (i.kondisi_lampu='NG' OR i.indicator_lamp='NG'
                  OR i.battery_charger='NG' OR i.id_number='NG'
                  OR i.kebersihan='NG' OR i.kondisi_kabel='NG')
            ) THEN r.id END) AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM emergency_lamp_items i
              WHERE i.record_id = r.id
                AND (i.kondisi_lampu='NG' OR i.indicator_lamp='NG'
                  OR i.battery_charger='NG' OR i.id_number='NG'
                  OR i.kebersihan='NG' OR i.kondisi_kabel='NG')
            ) THEN r.id END) AS ng_count
        FROM emergency_lamp_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 4. APD  (semua submission = OK, tidak ada NG)
    // ────────────────────────────────────────────────────────
    if (key === 'apd') {
      console.log('📊 Querying APD (all OK)...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT r.id) AS ok_count
        FROM apd_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC`,
        [dateFrom, dateTo]
      );

      const data = result.rows.flatMap((row: any) => {
        const ok = parseInt(row.ok_count) || 0;
        return ok > 0 ? [{ date: row.date, status: 'OK', count: ok }] : [];
      });

      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 5. TOILET INSPECTION
    // ────────────────────────────────────────────────────────
    if (key === 'toilet') {
      console.log('📊 Querying Toilet Inspection...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(inspection_date, 'YYYY-MM-DD')                          AS date,
          COUNT(DISTINCT CASE WHEN overall_status='OK' THEN id END)       AS ok_count,
          COUNT(DISTINCT CASE WHEN overall_status='NG' THEN id END)       AS ng_count
        FROM toilet_inspections
        WHERE inspection_date BETWEEN $1 AND $2
        GROUP BY inspection_date
        ORDER BY inspection_date ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 6. ELECTRICAL INSTALLATION
    // ────────────────────────────────────────────────────────
    if (key === 'electrical') {
      console.log('📊 Querying Electrical Installation...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(r.tanggal, 'YYYY-MM-DD')                                AS date,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM electrical_inspection_details d
              WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
            ) THEN r.id END)                                               AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM electrical_inspection_details d
              WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
            ) THEN r.id END)                                               AS ng_count
        FROM electrical_inspections r
        WHERE r.tanggal BETWEEN $1 AND $2
        GROUP BY r.tanggal
        ORDER BY r.tanggal ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 7. LIFT BARANG  (inspeksi biasa + preventive)
    // ────────────────────────────────────────────────────────
    if (key === 'lift-barang') {
      console.log('📊 Querying Lift Barang...');

      const inspectionType =
        searchParams.get('inspectionType') || searchParams.get('formType');
      console.log('📊 inspectionType/formType filter:', inspectionType);

      // — Preventive Maintenance —
      if (inspectionType?.toLowerCase() === 'preventive') {
        console.log('📊 Using PREVENTIVE tables...');

        try {
          const result = await pool.query(
            `SELECT
              TO_CHAR(h.inspection_date, 'YYYY-MM-DD')                    AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM preventive_items i
                  WHERE i.header_id = h.id AND i.status = 'NG'
                ) THEN h.id END)                                           AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM preventive_items i
                  WHERE i.header_id = h.id AND i.status = 'NG'
                ) THEN h.id END)                                           AS ng_count
            FROM preventive_header h
            WHERE h.inspection_date BETWEEN $1 AND $2
            GROUP BY h.inspection_date
            ORDER BY h.inspection_date ASC`,
            [dateFrom, dateTo]
          );

          return NextResponse.json({ success: true, data: formatRows(result.rows) });
        } catch (error) {
          console.error('❌ Preventive query error:', error);
          return NextResponse.json({ success: true, data: [] });
        }
      }

      // — Inspeksi Biasa —
      console.log('📊 Using INSPEKSI tables...');

      const typeCondition =
        inspectionType && inspectionType !== 'preventive'
          ? `AND r.inspection_type = '${inspectionType}'`
          : '';

      const result = await pool.query(
        `SELECT
          TO_CHAR(r.inspection_date, 'YYYY-MM-DD')                        AS date,
          r.inspection_type                                                AS type,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM lift_barang_inspection_items i
              WHERE i.inspection_id = r.id AND i.status = 'NG'
            ) THEN r.id END)                                               AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM lift_barang_inspection_items i
              WHERE i.inspection_id = r.id AND i.status = 'NG'
            ) THEN r.id END)                                               AS ng_count
        FROM lift_barang_inspections r
        WHERE r.inspection_date BETWEEN $1 AND $2
          ${typeCondition}
        GROUP BY r.inspection_date, r.inspection_type
        ORDER BY r.inspection_date ASC`,
        [dateFrom, dateTo]
      );

      return NextResponse.json({ success: true, data: formatRows(result.rows) });
    }

    // ────────────────────────────────────────────────────────
    // 8. EXIT LAMP
    // ────────────────────────────────────────────────────────
    if (key === 'exit-lamp') {
      console.log('📊 Querying Exit Lamp...');

      try {
        const result = await pool.query(
          `SELECT
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
            COUNT(DISTINCT CASE
              WHEN NOT EXISTS (
                SELECT 1 FROM exit_lamp_checklist_items i
                WHERE i.checklist_id = r.id
                  AND (i.kondisi_lampu='NG' OR i.indikator_lampu='NG'
                    OR i.kebersihan='NG')
              ) THEN r.id END)                                             AS ok_count,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM exit_lamp_checklist_items i
                WHERE i.checklist_id = r.id
                  AND (i.kondisi_lampu='NG' OR i.indikator_lampu='NG'
                    OR i.kebersihan='NG')
              ) THEN r.id END)                                             AS ng_count
          FROM exit_lamp_checklists r
          WHERE r.checklist_date BETWEEN $1 AND $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC`,
          [dateFrom, dateTo]
        );

        return NextResponse.json({ success: true, data: formatRows(result.rows) });
      } catch (error) {
        console.error('❌ Exit Lamp error:', error);
        return NextResponse.json(
          { success: false, error: (error as Error).message },
          { status: 500 }
        );
      }
    }

    // ────────────────────────────────────────────────────────
    // 9. PINTU DARURAT
    // ────────────────────────────────────────────────────────
    if (key === 'pintu-darurat') {
      console.log('📊 Querying Pintu Darurat...');

      try {
        const result = await pool.query(
          `SELECT
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
            COUNT(DISTINCT CASE
              WHEN NOT EXISTS (
                SELECT 1 FROM pintu_darurat_checklist_items i
                WHERE i.checklist_id = r.id
                  AND (i.kondisi_pintu='NG' OR i.area_sekitar='NG'
                    OR i.palu_alat_bantu='NG' OR i.identitas_pintu='NG'
                    OR i.id_peringatan='NG' OR i.door_closer='NG')
              ) THEN r.id END)                                             AS ok_count,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM pintu_darurat_checklist_items i
                WHERE i.checklist_id = r.id
                  AND (i.kondisi_pintu='NG' OR i.area_sekitar='NG'
                    OR i.palu_alat_bantu='NG' OR i.identitas_pintu='NG'
                    OR i.id_peringatan='NG' OR i.door_closer='NG')
              ) THEN r.id END)                                             AS ng_count
          FROM pintu_darurat_checklists r
          WHERE r.checklist_date BETWEEN $1 AND $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC`,
          [dateFrom, dateTo]
        );

        return NextResponse.json({ success: true, data: formatRows(result.rows) });
      } catch (error) {
        console.error('❌ Pintu Darurat error:', error);
        return NextResponse.json(
          { success: false, error: (error as Error).message },
          { status: 500 }
        );
      }
    }

    // ────────────────────────────────────────────────────────
    // 10. TITIK KUMPUL
    // ────────────────────────────────────────────────────────
    if (key === 'titik-kumpul') {
      console.log('📊 Querying Titik Kumpul...');

      try {
        const result = await pool.query(
          `SELECT
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
            COUNT(DISTINCT CASE
              WHEN NOT EXISTS (
                SELECT 1 FROM titik_kumpul_items i
                WHERE i.checklist_id = r.id
                  AND (i.area_aman='NG' OR i.identitas_titik_kumpul='NG'
                    OR i.area_mobil_pmk='NG')
              )
              AND NOT EXISTS (
                SELECT 1 FROM jalur_evakuasi_items j
                WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
              )
              THEN r.id END)                                               AS ok_count,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM titik_kumpul_items i
                WHERE i.checklist_id = r.id
                  AND (i.area_aman='NG' OR i.identitas_titik_kumpul='NG'
                    OR i.area_mobil_pmk='NG')
              )
              OR EXISTS (
                SELECT 1 FROM jalur_evakuasi_items j
                WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
              )
              THEN r.id END)                                               AS ng_count
          FROM titik_kumpul_checklists r
          WHERE r.checklist_date BETWEEN $1 AND $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC`,
          [dateFrom, dateTo]
        );

        return NextResponse.json({ success: true, data: formatRows(result.rows) });
      } catch (error) {
        console.error('❌ Titik Kumpul error:', error);
        return NextResponse.json(
          { success: false, error: (error as Error).message },
          { status: 500 }
        );
      }
    }

    // ────────────────────────────────────────────────────────
    // 11. TANGGA LISTRIK (AWP)  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'tg-listrik') {
      const data = await runUnifiedQuery('tg-listrik', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 12. INFRASTRUKTUR JALAN  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'inf-jalan') {
      const data = await runUnifiedQuery('inf-jalan', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 13. INSPEKSI APD  — unified GA table (semua OK)
    // ────────────────────────────────────────────────────────
    if (key === 'inspeksi-apd') {
      console.log('📊 Querying Inspeksi APD (all OK)...');

      const result = await pool.query(
        `SELECT
          TO_CHAR(h.check_date, 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT h.id)                AS ok_count
        FROM ga_checksheet_headers h
        INNER JOIN ga_checksheet_types t ON h.type_id = t.id
        WHERE t.slug = $1
          AND h.check_date BETWEEN $2 AND $3
        GROUP BY h.check_date
        ORDER BY h.check_date ASC`,
        ['inspeksi-apd', dateFrom, dateTo]
      );

      const data = result.rows.flatMap((row: any) => {
        const ok = parseInt(row.ok_count) || 0;
        return ok > 0 ? [{ date: row.date, status: 'OK', count: ok }] : [];
      });

      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 14. INSPEKSI HYDRANT  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'inspeksi-hydrant') {
      const data = await runUnifiedQuery('inspeksi-hydrant', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 15. SELANG HYDRANT  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'selang-hydrant') {
      const data = await runUnifiedQuery('selang-hydrant', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 16. PANEL LISTRIK  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'panel') {
      const data = await runUnifiedQuery('panel', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 17. SMOKE DETECTOR  — unified GA table
    // ────────────────────────────────────────────────────────
    if (key === 'smoke-detector') {
      const data = await runUnifiedQuery('smoke-detector', dateFrom, dateTo);
      return NextResponse.json({ success: true, data });
    }

    // ────────────────────────────────────────────────────────
    // 18. ALL — aggregate semua form (legacy + GA tables)
    // ────────────────────────────────────────────────────────
    if (key === 'all') {
      console.log('📊 Querying ALL checksheets...');

      const p: any[] = [dateFrom, dateTo];

      // ── Query 1: Legacy tables (per-tabel) ──────────────────
      type LegacyQuery = { name: string; sql: string };
      const legacyQueries: LegacyQuery[] = [
        // APAR
        {
          name: 'apar',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM apar_items i
                  WHERE i.record_id = r.id
                    AND (i.check1='X' OR i.check2='X' OR i.check3='X' OR i.check4='X'
                      OR i.check5='X' OR i.check6='X' OR i.check7='X' OR i.check8='X'
                      OR i.check9='X' OR i.check10='X' OR i.check11='X' OR i.check12='X')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM apar_items i
                  WHERE i.record_id = r.id
                    AND (i.check1='X' OR i.check2='X' OR i.check3='X' OR i.check4='X'
                      OR i.check5='X' OR i.check6='X' OR i.check7='X' OR i.check8='X'
                      OR i.check9='X' OR i.check10='X' OR i.check11='X' OR i.check12='X')
                ) THEN r.id END) AS ng_count
            FROM apar_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')`
        },
        // FIRE ALARM
        {
          name: 'fire-alarm',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM fire_alarm_items i
                  WHERE i.record_id = r.id
                    AND (i.alarm_bell='NG' OR i.indicator_lamp='NG'
                      OR i.manual_call_point='NG' OR i.kebersihan='NG')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM fire_alarm_items i
                  WHERE i.record_id = r.id
                    AND (i.alarm_bell='NG' OR i.indicator_lamp='NG'
                      OR i.manual_call_point='NG' OR i.kebersihan='NG')
                ) THEN r.id END) AS ng_count
            FROM fire_alarm_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')`
        },
        // EMERGENCY LAMP
        {
          name: 'emergency-lamp',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM emergency_lamp_items i
                  WHERE i.record_id = r.id
                    AND (i.kondisi_lampu='NG' OR i.indicator_lamp='NG'
                      OR i.battery_charger='NG' OR i.id_number='NG'
                      OR i.kebersihan='NG' OR i.kondisi_kabel='NG')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM emergency_lamp_items i
                  WHERE i.record_id = r.id
                    AND (i.kondisi_lampu='NG' OR i.indicator_lamp='NG'
                      OR i.battery_charger='NG' OR i.id_number='NG'
                      OR i.kebersihan='NG' OR i.kondisi_kabel='NG')
                ) THEN r.id END) AS ng_count
            FROM emergency_lamp_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')`
        },
        // APD (semua OK)
        {
          name: 'apd',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM apd_items i
                  WHERE i.record_id = r.id
                    AND (i.keterangan IS NOT NULL AND i.keterangan <> '')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM apd_items i
                  WHERE i.record_id = r.id
                    AND (i.keterangan IS NOT NULL AND i.keterangan <> '')
                ) THEN r.id END) AS ng_count
            FROM apd_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')`
        },
        // TOILET
        {
          name: 'toilet',
          sql: `
            SELECT
              TO_CHAR(inspection_date, 'YYYY-MM-DD')                        AS date,
              COUNT(DISTINCT CASE WHEN overall_status='OK' THEN id END)     AS ok_count,
              COUNT(DISTINCT CASE WHEN overall_status='NG' THEN id END)     AS ng_count
            FROM toilet_inspections
            WHERE inspection_date BETWEEN $1 AND $2
            GROUP BY inspection_date`
        },
        // ELECTRICAL
        {
          name: 'electrical',
          sql: `
            SELECT
              TO_CHAR(r.tanggal, 'YYYY-MM-DD')                              AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM electrical_inspection_details d
                  WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM electrical_inspection_details d
                  WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
                ) THEN r.id END) AS ng_count
            FROM electrical_inspections r
            WHERE r.tanggal BETWEEN $1 AND $2
            GROUP BY r.tanggal`
        },
        // EXIT LAMP
        {
          name: 'exit-lamp',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM exit_lamp_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_lampu='NG' OR i.indikator_lampu='NG'
                      OR i.kebersihan='NG')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM exit_lamp_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_lampu='NG' OR i.indikator_lampu='NG'
                      OR i.kebersihan='NG')
                ) THEN r.id END) AS ng_count
            FROM exit_lamp_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date`
        },
        // PINTU DARURAT
        {
          name: 'pintu-darurat',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM pintu_darurat_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_pintu='NG' OR i.area_sekitar='NG'
                      OR i.palu_alat_bantu='NG' OR i.identitas_pintu='NG'
                      OR i.id_peringatan='NG' OR i.door_closer='NG')
                ) THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM pintu_darurat_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_pintu='NG' OR i.area_sekitar='NG'
                      OR i.palu_alat_bantu='NG' OR i.identitas_pintu='NG'
                      OR i.id_peringatan='NG' OR i.door_closer='NG')
                ) THEN r.id END) AS ng_count
            FROM pintu_darurat_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date`
        },
        // TITIK KUMPUL
        {
          name: 'titik-kumpul',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                       AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM titik_kumpul_items i
                  WHERE i.checklist_id = r.id
                    AND (i.area_aman='NG' OR i.identitas_titik_kumpul='NG'
                      OR i.area_mobil_pmk='NG')
                )
                AND NOT EXISTS (
                  SELECT 1 FROM jalur_evakuasi_items j
                  WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
                )
                THEN r.id END) AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM titik_kumpul_items i
                  WHERE i.checklist_id = r.id
                    AND (i.area_aman='NG' OR i.identitas_titik_kumpul='NG'
                      OR i.area_mobil_pmk='NG')
                )
                OR EXISTS (
                  SELECT 1 FROM jalur_evakuasi_items j
                  WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
                )
                THEN r.id END) AS ng_count
            FROM titik_kumpul_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date`
        },
      ];

      // ── Query 2: GA unified table (semua type aktif) ─────────
      const gaQuery = `
        SELECT
          TO_CHAR(h.check_date, 'YYYY-MM-DD')                             AS date,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM ga_checksheet_details d
              WHERE d.header_id = h.id
                AND (d.result = 'NG' OR d.result = 'NOK')
            ) THEN h.id END)                                               AS ok_count,
          COUNT(DISTINCT CASE
            WHEN EXISTS (
              SELECT 1 FROM ga_checksheet_details d
              WHERE d.header_id = h.id
                AND (d.result = 'NG' OR d.result = 'NOK')
            ) THEN h.id END)                                               AS ng_count
        FROM ga_checksheet_headers h
        INNER JOIN ga_checksheet_types t ON h.type_id = t.id
        WHERE h.check_date BETWEEN $1 AND $2
          AND t.is_active = true
        GROUP BY h.check_date
        ORDER BY h.check_date ASC
      `;

      // ── Aggregate by date ─────────────────────────────────────
      const aggregatedByDate = new Map<string, { ok: number; ng: number }>();

      const addToMap = (rows: any[]) => {
        for (const row of rows) {
          const date = row.date as string;
          const ok   = parseInt(row.ok_count) || 0;
          const ng   = parseInt(row.ng_count) || 0;
          const cur  = aggregatedByDate.get(date) ?? { ok: 0, ng: 0 };
          cur.ok += ok;
          cur.ng += ng;
          aggregatedByDate.set(date, cur);
        }
      };

      // Run legacy queries
      for (const q of legacyQueries) {
        try {
          const result = await pool.query(q.sql, p);
          console.log(`✅ ${q.name}: ${result.rows.length} rows`);
          addToMap(result.rows);
        } catch (err) {
          console.error(`❌ Error querying ${q.name}:`, err);
        }
      }

      // Run GA query
      try {
        const gaResult = await pool.query(gaQuery, p);
        console.log(`✅ ga_checksheets: ${gaResult.rows.length} rows`);
        addToMap(gaResult.rows);
      } catch (err) {
        console.error('❌ Error querying ga_checksheets:', err);
      }

      // Format & sort
      const formattedData: any[] = [];
      for (const [date, counts] of aggregatedByDate.entries()) {
        if (counts.ok > 0) formattedData.push({ date, status: 'OK', count: counts.ok });
        if (counts.ng > 0) formattedData.push({ date, status: 'NG', count: counts.ng });
      }
      formattedData.sort((a, b) => a.date.localeCompare(b.date));

      console.log('📊 ALL aggregated:', {
        uniqueDates : aggregatedByDate.size,
        outputLength: formattedData.length,
        sample      : formattedData.slice(0, 3),
      });

      return NextResponse.json({ success: true, data: formattedData });
    }

    // ────────────────────────────────────────────────────────
    // FALLBACK: slug tidak dikenali
    // ────────────────────────────────────────────────────────
    return NextResponse.json(
      { error: 'Invalid slug parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}