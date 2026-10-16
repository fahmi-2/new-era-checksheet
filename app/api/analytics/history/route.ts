import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NGDetail {
  item: string;
  finding?: string;
  correctiveAction?: string;
  pic?: string;
  dueDate?: string;
  isRepaired?: boolean;
  foto?: string | null;
}

// Helper untuk format detail ga_checksheet
function parseGaChecksheetRows(rows: any[], typeSlug: string) {
  return rows.map((row: any) => {
    const rawNg = row.ng_items_raw || [];
    const ngDetails: NGDetail[] = rawNg.map((item: any) => {
      const isRepaired = Boolean((item.corrective_action && item.corrective_action.trim()) || (item.verified_by && item.verified_by.trim()));
      let fotoUrl = null;
      if (Array.isArray(item.images) && item.images.length > 0) {
        fotoUrl = item.images[0];
      } else if (typeof item.images === 'string' && item.images.startsWith('[')) {
        try {
          const parsed = JSON.parse(item.images);
          if (Array.isArray(parsed) && parsed.length > 0) fotoUrl = parsed[0];
        } catch {}
      } else if (typeof item.images === 'string' && item.images) {
        fotoUrl = item.images;
      }

      return {
        item: item.item_name || item.item_check || item.item_key || 'Item',
        finding: item.finding || '-',
        correctiveAction: item.corrective_action || '',
        pic: item.pic || '',
        dueDate: item.due_date || '',
        isRepaired,
        foto: fotoUrl
      };
    });

    const repairedCount = ngDetails.filter(d => d.isRepaired).length;
    const unrepairedCount = ngDetails.filter(d => !d.isRepaired).length;
    const ngCount = ngDetails.length;

    // Link edit/perbaikan
    let editUrl = `/status-ga/${typeSlug}`;
    if (typeSlug === 'tg-listrik') editUrl = `/status-ga/tg-listrik`;
    else if (typeSlug === 'inf-jalan') editUrl = `/status-ga/inf-jalan`;
    else if (typeSlug === 'inspeksi-hydrant') editUrl = `/status-ga/inspeksi-hydrant`;
    else if (typeSlug === 'selang-hydrant') editUrl = `/status-ga/selang-hydrant`;
    else if (typeSlug === 'smoke-detector') editUrl = `/status-ga/smoke-detector`;
    else if (typeSlug === 'panel') editUrl = `/status-ga/panel`;
    else if (typeSlug === 'inspeksi-apd') editUrl = `/status-ga/inspeksi-apd`;

    return {
      id: row.id,
      filledAt: row.filledAt,
      area: row.area || 'N/A',
      category: row.category || typeSlug,
      filledBy: row.filledBy || 'Unknown',
      status: ngCount > 0 ? 'NG' : 'OK',
      ngCount,
      repairedCount,
      unrepairedCount,
      ngDetails,
      editUrl
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = (searchParams.get('slug') || '').toLowerCase().trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const area = searchParams.get('area');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    if (!slug || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('📜 History API - Slug:', slug, 'Date:', dateFrom, 'to', dateTo, 'Page:', page);

    // ========================================================
    // HELPER UNTUK GA_CHECKSHEET_* (tg-listrik, inf-jalan, dll)
    // ========================================================
    const GA_SLUGS = [
      'tg-listrik', 'inf-jalan', 'inspeksi-apd',
      'inspeksi-hydrant', 'selang-hydrant', 'panel', 'smoke-detector'
    ];

    if (GA_SLUGS.includes(slug)) {
      const params: any[] = [slug, dateFrom, dateTo];
      let areaFilter = '';
      if (area && area !== 'All Category') {
        params.push(area);
        areaFilter = ` AND a.name = $${params.length}`;
      }

      const countQuery = `
        SELECT COUNT(DISTINCT h.id) as total
        FROM ga_checksheet_headers h
        JOIN ga_checksheet_types t ON h.type_id = t.id
        LEFT JOIN ga_checksheet_areas a ON h.area_id = a.id
        WHERE t.slug = $1 AND h.check_date::date BETWEEN $2::date AND $3::date
        ${areaFilter}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          h.id,
          h.check_date as "filledAt",
          COALESCE(a.name, 'Area General') as area,
          t.name as category,
          h.inspector_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_name', ci.item_check,
              'finding', cd.finding,
              'corrective_action', cd.corrective_action,
              'pic', cd.pic,
              'due_date', cd.due_date,
              'verified_by', cd.verified_by,
              'images', cd.images
            )), '[]'::json)
            FROM ga_checksheet_details cd
            JOIN ga_checksheet_items ci ON cd.item_id = ci.id
            WHERE cd.header_id = h.id AND (cd.result = 'NG' OR cd.result = 'NOK')
          ) as ng_items_raw
        FROM ga_checksheet_headers h
        JOIN ga_checksheet_types t ON h.type_id = t.id
        LEFT JOIN ga_checksheet_areas a ON h.area_id = a.id
        WHERE t.slug = $1 AND h.check_date::date BETWEEN $2::date AND $3::date
        ${areaFilter}
        ORDER BY h.check_date DESC, h.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = parseGaChecksheetRows(result.rows, slug);

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // STOP KONTAK & INSTALASI LISTRIK
    // ========================================================
    if (slug === 'electrical' || slug === 'stop-kontak' || slug === 'instalasi-listrik') {
      const params: any[] = [dateFrom, dateTo];
      let typeFilter = '';
      if (slug === 'stop-kontak') {
        typeFilter = ` AND r.type = 'stop-kontak'`;
      } else if (slug === 'instalasi-listrik') {
        typeFilter = ` AND r.type = 'instalasi-listrik'`;
      }

      if (area && area !== 'All Category') {
        params.push(area);
        typeFilter += ` AND r.area = $${params.length}`;
      }

      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM electrical_inspections r
        WHERE r.tanggal::date BETWEEN $1::date AND $2::date ${typeFilter}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.tanggal as "filledAt",
          r.area,
          CASE 
            WHEN r.type = 'stop-kontak' THEN 'Stop Kontak'
            WHEN r.type = 'instalasi-listrik' THEN 'Instalasi Listrik'
            ELSE 'Electrical'
          END as category,
          r.pic as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_no', d.item_no,
              'keterangan', d.keterangan,
              'foto_path', d.foto_path
            )), '[]'::json)
            FROM electrical_inspection_details d
            WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
          ) as ng_items_raw
        FROM electrical_inspections r
        WHERE r.tanggal::date BETWEEN $1::date AND $2::date ${typeFilter}
        ORDER BY r.tanggal DESC, r.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const STOP_KONTAK_MAP: Record<number, string> = {
        1: 'Kondisi Fisik Stop Kontak (Tidak retak/longgar)',
        2: 'Penutup Stop Kontak (Terpasang & aman)',
        3: 'Fungsi Stop Kontak (Berfungsi normal)',
        4: 'Keamanan (Tidak panas/bau)'
      };

      const INSTALASI_LISTRIK_MAP: Record<number, string> = {
        1: 'Standar Kabel Listrik (Sesuai standar/tidak terkelupas)',
        2: 'Kerapihan Instalasi (Tertata rapi/tidak menggantung)',
        3: 'Pelindung Kabel (Conduit/ducting)',
        4: 'Sambungan Kabel (Tidak ada sambungan terbuka)'
      };

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const isStopKontak = row.category === 'Stop Kontak';
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const itemNo = Number(item.item_no);
          const labelMap = isStopKontak ? STOP_KONTAK_MAP : INSTALASI_LISTRIK_MAP;
          const itemName = labelMap[itemNo] || `Item #${itemNo}`;
          return {
            item: itemName,
            finding: item.keterangan || 'Kondisi tidak memenuhi standar (NOK)',
            correctiveAction: '',
            pic: row.filledBy || '',
            isRepaired: false,
            foto: item.foto_path || null
          };
        });

        const editUrl = isStopKontak
          ? `/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat`
          : `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat`;

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: row.area || 'N/A',
          category: row.category,
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: 0,
          unrepairedCount: ngDetails.length,
          ngDetails,
          editUrl
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // APAR
    // ========================================================
    if (slug === 'apar') {
      const params: any[] = [dateFrom, dateTo];
      let areaFilter = '';
      if (area && area !== 'All Category' && area !== 'APAR') {
        params.push(area);
        areaFilter = ` AND r.area = $${params.length}`;
      }

      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM apar_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          r.area,
          'APAR' as category,
          r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'no', i.no,
              'lokasi', i.lokasi,
              'no_apar', i.no_apar,
              'keterangan', i.keterangan,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'check1', i.check1, 'check2', i.check2, 'check3', i.check3,
              'check4', i.check4, 'check5', i.check5, 'check6', i.check6,
              'check7', i.check7, 'check8', i.check8, 'check9', i.check9,
              'check10', i.check10, 'check11', i.check11, 'check12', i.check12
            )), '[]'::json)
            FROM apar_items i
            WHERE i.record_id = r.id AND (
              i.check1 IN ('NG','X') OR i.check2 IN ('NG','X') OR i.check3 IN ('NG','X') OR
              i.check4 IN ('NG','X') OR i.check5 IN ('NG','X') OR i.check6 IN ('NG','X') OR
              i.check7 IN ('NG','X') OR i.check8 IN ('NG','X') OR i.check9 IN ('NG','X') OR
              i.check10 IN ('NG','X') OR i.check11 IN ('NG','X') OR i.check12 IN ('NG','X')
            )
          ) as ng_items_raw
        FROM apar_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const APAR_CHECKS = [
        { key: 'check1', name: 'Masa Berlaku' },
        { key: 'check2', name: 'Tekanan' },
        { key: 'check3', name: 'Isi Tabung' },
        { key: 'check4', name: 'Selang' },
        { key: 'check5', name: 'Segel' },
        { key: 'check6', name: 'Kondisi Tabung' },
        { key: 'check7', name: 'Gantungan' },
        { key: 'check8', name: 'Lay out' },
        { key: 'check9', name: 'Papan Petunjuk' },
        { key: 'check10', name: 'OS & C/S' },
        { key: 'check11', name: 'Area Sekitar' },
        { key: 'check12', name: 'Posisi APAR' }
      ];

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          // Deteksi parameter spesifik apa yang NG
          const ngParts = APAR_CHECKS
            .filter(c => ['NG', 'X'].includes(String(item[c.key] || '').toUpperCase()))
            .map(c => c.name);
          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';

          let findingDesc = item.keterangan && item.keterangan.trim() ? item.keterangan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Kondisi komponen APAR tidak sesuai standar';
          }

          return {
            item: `APAR #${item.no_apar || item.no} - ${item.lokasi || 'Area'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        const repairedCount = ngDetails.filter(d => d.isRepaired).length;
        const unrepairedCount = ngDetails.filter(d => !d.isRepaired).length;

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: row.area,
          category: 'APAR',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount,
          unrepairedCount,
          ngDetails,
          editUrl: `/status-ga/inspeksi-apar/${row.area}/riwayat`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // FIRE ALARM
    // ========================================================
    if (slug === 'fire-alarm') {
      const params: any[] = [dateFrom, dateTo];
      let areaFilter = '';
      if (area && area !== 'All Category' && area !== 'Fire Alarm') {
        params.push(area);
        areaFilter = ` AND r.zona = $${params.length}`;
      }

      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM fire_alarm_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          r.zona as area,
          'Fire Alarm' as category,
          r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'no', i.no,
              'lokasi', i.lokasi,
              'keterangan', i.kondisi_nok,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'alarm_bell', i.alarm_bell,
              'indicator_lamp', i.indicator_lamp,
              'manual_call_point', i.manual_call_point,
              'kebersihan', i.kebersihan
            )), '[]'::json)
            FROM fire_alarm_items i
            WHERE i.record_id = r.id AND (
              i.alarm_bell = 'NG' OR i.indicator_lamp = 'NG' OR
              i.manual_call_point = 'NG' OR i.kebersihan = 'NG'
            )
          ) as ng_items_raw
        FROM fire_alarm_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          const ngParts: string[] = [];
          if (item.alarm_bell === 'NG') ngParts.push('Alarm Bell');
          if (item.indicator_lamp === 'NG') ngParts.push('Indicator Lamp');
          if (item.manual_call_point === 'NG') ngParts.push('Manual Call Point');
          if (item.kebersihan === 'NG') ngParts.push('Kebersihan');

          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';
          let findingDesc = item.keterangan && item.keterangan.trim() ? item.keterangan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak berfungsi: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Komponen Fire Alarm tidak berfungsi / kotor';
          }

          return {
            item: `Fire Alarm #${item.no} - ${item.lokasi || 'Zona'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: row.area,
          category: 'Fire Alarm',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/fire-alarm/riwayat/${row.area}`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // TOILET
    // ========================================================
    if (slug === 'toilet') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM toilet_inspections
        WHERE (DATE(created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date 
           OR inspection_date BETWEEN $1::date AND $2::date)
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const TOILET_DEF = [
        { no: 1, label: 'Kebersihan Lantai' },
        { no: 2, label: 'Kebersihan Dinding' },
        { no: 3, label: 'Bau Toilet' },
        { no: 4, label: 'Ketersediaan Air' },
        { no: 5, label: 'Kloset' },
        { no: 6, label: 'Wastafel' },
        { no: 7, label: 'Tisu Toilet' },
        { no: 8, label: 'Tempat Sampah' },
        { no: 9, label: 'Ventilasi' },
        { no: 10, label: 'Perlengkapan Lain' },
        { no: 11, label: 'Lampu Penerangan' },
        { no: 12, label: 'Keran Air' },
        { no: 13, label: 'Exhaust Fan' }
      ];

      const dataQuery = `
        SELECT 
          *
        FROM toilet_inspections
        WHERE (DATE(created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date 
           OR inspection_date BETWEEN $1::date AND $2::date)
        ORDER BY created_at DESC, id DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const ngDetails: NGDetail[] = [];

        TOILET_DEF.forEach(itemDef => {
          // Cek Laki-laki
          const hasilL = String(row[`item_${itemDef.no}_hasil_l`] || '').toUpperCase();
          if (hasilL === 'NG' || hasilL === 'NOK' || hasilL === 'X') {
            const ket = row[`item_${itemDef.no}_keterangan_l`] || '';
            const tind = row[`item_${itemDef.no}_tindakan_l`] || '';
            const pic = row[`item_${itemDef.no}_pic_l`] || row.inspector_name || '';
            const foto = row[`item_${itemDef.no}_foto_l`] || null;
            ngDetails.push({
              item: `${itemDef.label} (Toilet Pria)`,
              finding: ket || 'Kondisi tidak memenuhi standar kebersihan/fungsi',
              correctiveAction: tind,
              pic,
              isRepaired: Boolean(tind && tind.trim()),
              foto
            });
          }

          // Cek Perempuan
          const hasilP = String(row[`item_${itemDef.no}_hasil_p`] || '').toUpperCase();
          if (hasilP === 'NG' || hasilP === 'NOK' || hasilP === 'X') {
            const ket = row[`item_${itemDef.no}_keterangan_p`] || '';
            const tind = row[`item_${itemDef.no}_tindakan_p`] || '';
            const pic = row[`item_${itemDef.no}_pic_p`] || row.inspector_name || '';
            const foto = row[`item_${itemDef.no}_foto_p`] || null;
            ngDetails.push({
              item: `${itemDef.label} (Toilet Wanita)`,
              finding: ket || 'Kondisi tidak memenuhi standar kebersihan/fungsi',
              correctiveAction: tind,
              pic,
              isRepaired: Boolean(tind && tind.trim()),
              foto
            });
          }
        });

        // Fallback jika overall_status NG tapi tidak ada item specific yang flagged
        if (ngDetails.length === 0 && row.overall_status === 'NG') {
          ngDetails.push({
            item: `Fasilitas Toilet (${row.area_code || 'Area'})`,
            finding: 'Status inspeksi keseluruhan NG',
            correctiveAction: '',
            pic: row.inspector_name || '',
            isRepaired: false,
            foto: null
          });
        }

        const isNG = ngDetails.length > 0 || row.overall_status === 'NG';
        const repairedCount = ngDetails.filter(d => d.isRepaired).length;
        const unrepairedCount = ngDetails.filter(d => !d.isRepaired).length;

        return {
          id: row.id,
          filledAt: row.created_at || row.inspection_date,
          area: row.area_code,
          category: 'Toilet',
          filledBy: row.inspector_name || 'Unknown',
          status: isNG ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount,
          unrepairedCount,
          ngDetails,
          editUrl: `/status-ga/checksheet-toilet/riwayat/${row.area_code}`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // EMERGENCY LAMP
    // ========================================================
    if (slug === 'emergency-lamp') {
      const params: any[] = [dateFrom, dateTo];
      let areaFilter = '';
      if (area && area !== 'All Category' && area !== 'Emergency Lamp') {
        params.push(area);
        areaFilter = ` AND r.area = $${params.length}`;
      }

      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM emergency_lamp_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          r.area,
          'Emergency Lamp' as category,
          r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'no', i.no,
              'lokasi', i.lokasi,
              'keterangan', i.keterangan,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'kondisi_lampu', i.kondisi_lampu,
              'indicator_lamp', i.indicator_lamp,
              'battery_charger', i.battery_charger,
              'id_number', i.id_number,
              'kebersihan', i.kebersihan,
              'kondisi_kabel', i.kondisi_kabel
            )), '[]'::json)
            FROM emergency_lamp_items i
            WHERE i.record_id = r.id AND (
              i.kondisi_lampu = 'NG' OR i.indicator_lamp = 'NG' OR
              i.battery_charger = 'NG' OR i.id_number = 'NG' OR
              i.kebersihan = 'NG' OR i.kondisi_kabel = 'NG'
            )
          ) as ng_items_raw
        FROM emergency_lamp_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date ${areaFilter}
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          const ngParts: string[] = [];
          if (item.kondisi_lampu === 'NG') ngParts.push('Kondisi Lampu');
          if (item.indicator_lamp === 'NG') ngParts.push('Indicator Lamp');
          if (item.battery_charger === 'NG') ngParts.push('Battery Charger');
          if (item.id_number === 'NG') ngParts.push('ID Number');
          if (item.kebersihan === 'NG') ngParts.push('Kebersihan');
          if (item.kondisi_kabel === 'NG') ngParts.push('Kondisi Kabel');

          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';
          let findingDesc = item.keterangan && item.keterangan.trim() ? item.keterangan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Komponen Emergency Lamp tidak berfungsi normal';
          }

          return {
            item: `Emergency Lamp #${item.no} - ${item.lokasi || 'Area'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: row.area,
          category: 'Emergency Lamp',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/inspeksi-emergency/riwayat/${row.area}`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // EXIT LAMP
    // ========================================================
    if (slug === 'exit-lamp') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM exit_lamp_checklists
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          'N/A' as area,
          'Exit Lamp' as category,
          r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_name', COALESCE(i.location_name, 'Exit Lamp'),
              'catatan', i.keterangan,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'kondisi_lampu', i.kondisi_lampu,
              'indikator_lampu', i.indikator_lampu,
              'kebersihan', i.kebersihan
            )), '[]'::json)
            FROM exit_lamp_checklist_items i
            WHERE i.checklist_id = r.id AND (
              i.kondisi_lampu = 'NG' OR i.indikator_lampu = 'NG' OR i.kebersihan = 'NG'
            )
          ) as ng_items_raw
        FROM exit_lamp_checklists r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          const ngParts: string[] = [];
          if (item.kondisi_lampu === 'NG') ngParts.push('Kondisi Lampu');
          if (item.indikator_lampu === 'NG') ngParts.push('Indikator Lampu');
          if (item.kebersihan === 'NG') ngParts.push('Kebersihan');

          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';
          let findingDesc = item.catatan && item.catatan.trim() ? item.catatan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Kondisi Exit Lamp tidak berfungsi / kotor';
          }

          return {
            item: `${item.item_name || 'Exit Lamp'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: 'N/A',
          category: 'Exit Lamp',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/exit-lamp-pintu-darurat/riwayat/exit-lamp`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // PINTU DARURAT
    // ========================================================
    if (slug === 'pintu-darurat') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM pintu_darurat_checklists
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          'N/A' as area,
          'Pintu Darurat' as category,
          r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_name', COALESCE(i.location_name, 'Pintu Darurat'),
              'catatan', i.keterangan,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'kondisi_pintu', i.kondisi_pintu,
              'area_sekitar', i.area_sekitar,
              'palu_alat_bantu', i.palu_alat_bantu,
              'identitas_pintu', i.identitas_pintu,
              'id_peringatan', i.id_peringatan,
              'door_closer', i.door_closer
            )), '[]'::json)
            FROM pintu_darurat_checklist_items i
            WHERE i.checklist_id = r.id AND (
              i.kondisi_pintu = 'NG' OR i.area_sekitar = 'NG' OR
              i.palu_alat_bantu = 'NG' OR i.identitas_pintu = 'NG' OR
              i.id_peringatan = 'NG' OR i.door_closer = 'NG'
            )
          ) as ng_items_raw
        FROM pintu_darurat_checklists r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          const ngParts: string[] = [];
          if (item.kondisi_pintu === 'NG') ngParts.push('Kondisi Pintu');
          if (item.area_sekitar === 'NG') ngParts.push('Area Sekitar');
          if (item.palu_alat_bantu === 'NG') ngParts.push('Palu/Alat Bantu');
          if (item.identitas_pintu === 'NG') ngParts.push('Identitas Pintu');
          if (item.id_peringatan === 'NG') ngParts.push('ID Peringatan');
          if (item.door_closer === 'NG') ngParts.push('Door Closer');

          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';
          let findingDesc = item.catatan && item.catatan.trim() ? item.catatan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Kondisi pintu/door closer/area tidak memenuhi standar';
          }

          return {
            item: `${item.item_name || 'Pintu Darurat'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: 'N/A',
          category: 'Pintu Darurat',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // TITIK KUMPUL
    // ========================================================
    if (slug === 'titik-kumpul') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM titik_kumpul_checklists
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          'N/A' as area,
          'Titik Kumpul' as category,
          r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_name', COALESCE(i.location_name, 'Titik Kumpul'),
              'catatan', i.keterangan,
              'tindakan_perbaikan', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'area_aman', i.area_aman,
              'identitas_titik_kumpul', i.identitas_titik_kumpul,
              'area_mobil_pmk', i.area_mobil_pmk
            )), '[]'::json)
            FROM titik_kumpul_items i
            WHERE i.checklist_id = r.id AND (
              i.area_aman = 'NG' OR i.identitas_titik_kumpul = 'NG' OR i.area_mobil_pmk = 'NG'
            )
          ) as ng_items_raw
        FROM titik_kumpul_checklists r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.tindakan_perbaikan && item.tindakan_perbaikan.trim());
          
          const ngParts: string[] = [];
          if (item.area_aman === 'NG') ngParts.push('Area Aman');
          if (item.identitas_titik_kumpul === 'NG') ngParts.push('Identitas Titik Kumpul');
          if (item.area_mobil_pmk === 'NG') ngParts.push('Area Mobil PMK');

          const partsStr = ngParts.length > 0 ? ` (${ngParts.join(', ')})` : '';
          let findingDesc = item.catatan && item.catatan.trim() ? item.catatan.trim() : '';
          if (ngParts.length > 0) {
            findingDesc = findingDesc 
              ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` 
              : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
          } else if (!findingDesc) {
            findingDesc = 'Kondisi area titik kumpul tidak memenuhi standar';
          }

          return {
            item: `${item.item_name || 'Titik Kumpul'}${partsStr}`,
            finding: findingDesc,
            correctiveAction: item.tindakan_perbaikan || '',
            pic: item.pic || row.filledBy || '',
            isRepaired,
            foto: item.foto || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: 'N/A',
          category: 'Titik Kumpul',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/exit-lamp-pintu-darurat/riwayat/titik-kumpul`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // LIFT BARANG
    // ========================================================
    if (slug === 'lift-barang') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM lift_barang_inspections
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          r.id,
          r.submitted_at as "filledAt",
          'N/A' as area,
          'Lift Barang' as category,
          r.inspector as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'sub_item_id', ii.sub_item_id,
              'keterangan', ii.keterangan,
              'solusi', ii.solusi,
              'foto_path', ii.foto_path
            )), '[]'::json)
            FROM lift_barang_inspection_items ii
            WHERE ii.inspection_id = r.id AND ii.status = 'NG'
          ) as ng_items_raw
        FROM lift_barang_inspections r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
        ORDER BY r.submitted_at DESC, r.id DESC
        LIMIT $3 OFFSET $4
      `;

      const getLiftSubItemName = (subId: string): string => {
        const suffix = (subId || '').slice(-1).toUpperCase();
        switch (suffix) {
          case 'A': return 'Korosi';
          case 'B': return 'Keretakan';
          case 'C': return 'Perubahan Bentuk';
          case 'D': return 'Ketebalan';
          case 'E': return 'Kelonggaran';
          case 'F': return 'Ketidakrataan';
          default: return `Item ${subId}`;
        }
      };

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => {
        const rawNg = row.ng_items_raw || [];
        const ngDetails: NGDetail[] = rawNg.map((item: any) => {
          const isRepaired = Boolean(item.solusi && item.solusi.trim());
          const subName = getLiftSubItemName(String(item.sub_item_id || ''));
          return {
            item: `Lift Barang - Bagian ${subName} (${item.sub_item_id || '-'})`,
            finding: item.keterangan || 'Kerusakan komponen lift barang (NG)',
            correctiveAction: item.solusi || '',
            pic: row.filledBy || '',
            isRepaired,
            foto: item.foto_path || null
          };
        });

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: 'N/A',
          category: 'Lift Barang',
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl: `/status-ga/lift-barang`
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // APD (pengambilan APD)
    // ========================================================
    if (slug === 'apd') {
      const params: any[] = [dateFrom, dateTo];
      const countQuery = `
        SELECT COUNT(DISTINCT id) as total
        FROM apd_records
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0') || 0;
      const totalPages = Math.ceil(total / limit);

      params.push(limit, offset);
      const dataQuery = `
        SELECT 
          id,
          submitted_at as "filledAt",
          jenis_apd as area,
          'Pengambilan APD' as category,
          checker as "filledBy"
        FROM apd_records
        WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date
        ORDER BY submitted_at DESC, id DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(dataQuery, params);
      const formatted = result.rows.map((row: any) => ({
        id: row.id,
        filledAt: row.filledAt,
        area: row.area || 'N/A',
        category: 'Pengambilan APD',
        filledBy: row.filledBy || 'Unknown',
        status: 'OK',
        ngCount: 0,
        repairedCount: 0,
        unrepairedCount: 0,
        ngDetails: [],
        editUrl: `/status-ga/e-checksheet-apd/riwayat-apd`
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    // ========================================================
    // POWER HOUSE
    // ========================================================
    if (slug === 'power-house') {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
        editUrl: '/status-ga/power-house'
      });
    }

    // ========================================================
    // GLOBAL HISTORY ('ALL')
    // ========================================================
    if (slug === 'all') {
      console.log('📜 Querying GLOBAL history with full categories & NG details...');

      const params = [dateFrom, dateTo];

      const allQueries = [
        // APAR
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'APAR' as category, r.area, r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', 'APAR #' || COALESCE(i.no_apar, i.no::text) || ' (' || COALESCE(i.lokasi, 'Area') || ')',
              'finding', i.keterangan,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'check1', i.check1, 'check2', i.check2, 'check3', i.check3,
              'check4', i.check4, 'check5', i.check5, 'check6', i.check6,
              'check7', i.check7, 'check8', i.check8, 'check9', i.check9,
              'check10', i.check10, 'check11', i.check11, 'check12', i.check12
            )), '[]'::json)
            FROM apar_items i
            WHERE i.record_id = r.id AND (
              i.check1 IN ('NG','X') OR i.check2 IN ('NG','X') OR i.check3 IN ('NG','X') OR i.check4 IN ('NG','X') OR
              i.check5 IN ('NG','X') OR i.check6 IN ('NG','X') OR i.check7 IN ('NG','X') OR i.check8 IN ('NG','X') OR
              i.check9 IN ('NG','X') OR i.check10 IN ('NG','X') OR i.check11 IN ('NG','X') OR i.check12 IN ('NG','X')
            )
          ) as ng_items_raw
        FROM apar_records r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // FIRE ALARM
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Fire Alarm' as category, r.zona as area, r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', 'Fire Alarm #' || i.no::text || ' (' || COALESCE(i.lokasi, 'Zona') || ')',
              'finding', i.kondisi_nok,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'alarm_bell', i.alarm_bell,
              'indicator_lamp', i.indicator_lamp,
              'manual_call_point', i.manual_call_point,
              'kebersihan', i.kebersihan
            )), '[]'::json)
            FROM fire_alarm_items i
            WHERE i.record_id = r.id AND (
              i.alarm_bell='NG' OR i.indicator_lamp='NG' OR i.manual_call_point='NG' OR i.kebersihan='NG'
            )
          ) as ng_items_raw
        FROM fire_alarm_records r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // TOILET
        `SELECT 
          id, created_at as "filledAt", 'Toilet' as category, area_code as area, inspector_name as "filledBy",
          to_jsonb(t.*) as toilet_row_raw
        FROM toilet_inspections t
        WHERE (DATE(created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date 
           OR inspection_date BETWEEN $1::date AND $2::date)`,

        // ELECTRICAL (Stop Kontak & Instalasi Listrik)
        `SELECT 
          r.id, r.tanggal as "filledAt", 
          CASE 
            WHEN r.type = 'stop-kontak' THEN 'Stop Kontak'
            WHEN r.type = 'instalasi-listrik' THEN 'Instalasi Listrik'
            ELSE 'Electrical'
          END as category, 
          r.area, r.pic as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item_no', d.item_no,
              'finding', d.keterangan,
              'corrective_action', '',
              'pic', r.pic,
              'foto', d.foto_path
            )), '[]'::json)
            FROM electrical_inspection_details d
            WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
          ) as ng_items_raw
        FROM electrical_inspections r 
        WHERE r.tanggal::date BETWEEN $1::date AND $2::date`,

        // GA CHECKSHEETS (TG Listrik, Inf Jalan, Hydrant, Selang, Smoke Detector, Panel, APD)
        `SELECT 
          h.id, h.check_date as "filledAt", t.name as category, COALESCE(a.name, 'Area General') as area, h.inspector_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', ci.item_check,
              'finding', cd.finding,
              'corrective_action', cd.corrective_action,
              'pic', cd.pic,
              'images', cd.images
            )), '[]'::json)
            FROM ga_checksheet_details cd
            JOIN ga_checksheet_items ci ON cd.item_id = ci.id
            WHERE cd.header_id = h.id AND (cd.result = 'NG' OR cd.result = 'NOK')
          ) as ng_items_raw
        FROM ga_checksheet_headers h
        JOIN ga_checksheet_types t ON h.type_id = t.id
        LEFT JOIN ga_checksheet_areas a ON h.area_id = a.id
        WHERE h.check_date::date BETWEEN $1::date AND $2::date`,

        // EMERGENCY LAMP
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Emergency Lamp' as category, r.area, r.checker as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', 'Emergency Lamp #' || i.no::text || ' (' || COALESCE(i.lokasi, 'Area') || ')',
              'finding', i.keterangan,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto,
              'kondisi_lampu', i.kondisi_lampu,
              'indicator_lamp', i.indicator_lamp,
              'battery_charger', i.battery_charger,
              'id_number', i.id_number,
              'kebersihan', i.kebersihan,
              'kondisi_kabel', i.kondisi_kabel
            )), '[]'::json)
            FROM emergency_lamp_items i
            WHERE i.record_id = r.id AND (
              i.kondisi_lampu='NG' OR i.indicator_lamp='NG' OR i.battery_charger='NG' OR
              i.id_number='NG' OR i.kebersihan='NG' OR i.kondisi_kabel='NG'
            )
          ) as ng_items_raw
        FROM emergency_lamp_records r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // EXIT LAMP
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Exit Lamp' as category, 'N/A' as area, r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', COALESCE(i.location_name, 'Exit Lamp'),
              'finding', i.keterangan,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'kondisi_lampu', i.kondisi_lampu,
              'indikator_lampu', i.indikator_lampu,
              'kebersihan', i.kebersihan
            )), '[]'::json)
            FROM exit_lamp_checklist_items i
            WHERE i.checklist_id = r.id AND (
              i.kondisi_lampu='NG' OR i.indikator_lampu='NG' OR i.kebersihan='NG'
            )
          ) as ng_items_raw
        FROM exit_lamp_checklists r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // PINTU DARURAT
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Pintu Darurat' as category, 'N/A' as area, r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', COALESCE(i.location_name, 'Pintu Darurat'),
              'finding', i.keterangan,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'kondisi_pintu', i.kondisi_pintu,
              'area_sekitar', i.area_sekitar,
              'palu_alat_bantu', i.palu_alat_bantu,
              'identitas_pintu', i.identitas_pintu,
              'id_peringatan', i.id_peringatan,
              'door_closer', i.door_closer
            )), '[]'::json)
            FROM pintu_darurat_checklist_items i
            WHERE i.checklist_id = r.id AND (
              i.kondisi_pintu='NG' OR i.area_sekitar='NG' OR i.palu_alat_bantu='NG' OR
              i.identitas_pintu='NG' OR i.id_peringatan='NG' OR i.door_closer='NG'
            )
          ) as ng_items_raw
        FROM pintu_darurat_checklists r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // TITIK KUMPUL
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Titik Kumpul' as category, 'N/A' as area, r.checker_name as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'item', COALESCE(i.location_name, 'Titik Kumpul'),
              'finding', i.keterangan,
              'corrective_action', i.tindakan_perbaikan,
              'pic', i.pic,
              'foto', i.foto_data,
              'area_aman', i.area_aman,
              'identitas_titik_kumpul', i.identitas_titik_kumpul,
              'area_mobil_pmk', i.area_mobil_pmk
            )), '[]'::json)
            FROM titik_kumpul_items i
            WHERE i.checklist_id = r.id AND (
              i.area_aman='NG' OR i.identitas_titik_kumpul='NG' OR i.area_mobil_pmk='NG'
            )
          ) as ng_items_raw
        FROM titik_kumpul_checklists r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // LIFT BARANG
        `SELECT 
          r.id, r.submitted_at as "filledAt", 'Lift Barang' as category, 'N/A' as area, r.inspector as "filledBy",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'sub_item_id', ii.sub_item_id,
              'finding', ii.keterangan,
              'corrective_action', ii.solusi,
              'pic', r.inspector,
              'foto', ii.foto_path
            )), '[]'::json)
            FROM lift_barang_inspection_items ii
            WHERE ii.inspection_id = r.id AND ii.status='NG'
          ) as ng_items_raw
        FROM lift_barang_inspections r 
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`,

        // APD
        `SELECT id, submitted_at as "filledAt", 'Pengambilan APD' as category, jenis_apd as area, checker as "filledBy", '[]'::json as ng_items_raw 
         FROM apd_records 
         WHERE DATE(submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1::date AND $2::date`
      ];

      const allResults = [];
      for (const query of allQueries) {
        try {
          const result = await pool.query(query, params);
          if (result.rows && result.rows.length > 0) {
            allResults.push(...result.rows);
          }
        } catch (err) {
          console.warn('⚠️ Table skipped in global history query:', (err as Error).message);
        }
      }

      const APAR_CHECKS_GLOBAL = [
        { key: 'check1', name: 'Masa Berlaku' },
        { key: 'check2', name: 'Tekanan' },
        { key: 'check3', name: 'Isi Tabung' },
        { key: 'check4', name: 'Selang' },
        { key: 'check5', name: 'Segel' },
        { key: 'check6', name: 'Kondisi Tabung' },
        { key: 'check7', name: 'Gantungan' },
        { key: 'check8', name: 'Lay out' },
        { key: 'check9', name: 'Papan Petunjuk' },
        { key: 'check10', name: 'OS & C/S' },
        { key: 'check11', name: 'Area Sekitar' },
        { key: 'check12', name: 'Posisi APAR' }
      ];

      const STOP_KONTAK_MAP_GLOBAL: Record<number, string> = {
        1: 'Kondisi Fisik Stop Kontak (Tidak retak/longgar)',
        2: 'Penutup Stop Kontak (Terpasang & aman)',
        3: 'Fungsi Stop Kontak (Berfungsi normal)',
        4: 'Keamanan (Tidak panas/bau)'
      };

      const INSTALASI_LISTRIK_MAP_GLOBAL: Record<number, string> = {
        1: 'Standar Kabel Listrik (Sesuai standar/tidak terkelupas)',
        2: 'Kerapihan Instalasi (Tertata rapi/tidak menggantung)',
        3: 'Pelindung Kabel (Conduit/ducting)',
        4: 'Sambungan Kabel (Tidak ada sambungan terbuka)'
      };

      const TOILET_DEF_GLOBAL = [
        { no: 1, label: 'Kebersihan Lantai' },
        { no: 2, label: 'Kebersihan Dinding' },
        { no: 3, label: 'Bau Toilet' },
        { no: 4, label: 'Ketersediaan Air' },
        { no: 5, label: 'Kloset' },
        { no: 6, label: 'Wastafel' },
        { no: 7, label: 'Tisu Toilet' },
        { no: 8, label: 'Tempat Sampah' },
        { no: 9, label: 'Ventilasi' },
        { no: 10, label: 'Perlengkapan Lain' },
        { no: 11, label: 'Lampu Penerangan' },
        { no: 12, label: 'Keran Air' },
        { no: 13, label: 'Exhaust Fan' }
      ];

      const getLiftSubItemNameGlobal = (subId: string): string => {
        const suffix = (subId || '').slice(-1).toUpperCase();
        switch (suffix) {
          case 'A': return 'Korosi';
          case 'B': return 'Keretakan';
          case 'C': return 'Perubahan Bentuk';
          case 'D': return 'Ketebalan';
          case 'E': return 'Kelonggaran';
          case 'F': return 'Ketidakrataan';
          default: return `Item ${subId}`;
        }
      };

      // Sort by date descending
      allResults.sort((a: any, b: any) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime());
      const total = allResults.length;
      const totalPages = Math.ceil(total / limit);
      const pageSlice = allResults.slice(offset, offset + limit);

      const formatted = pageSlice.map((row: any) => {
        const cat = (row.category || '').toLowerCase();
        let ngDetails: NGDetail[] = [];

        // Penanganan Khusus Toilet di Global Query
        if (cat.includes('toilet') && row.toilet_row_raw) {
          const tRow = row.toilet_row_raw;
          TOILET_DEF_GLOBAL.forEach(itemDef => {
            const hasilL = String(tRow[`item_${itemDef.no}_hasil_l`] || '').toUpperCase();
            if (hasilL === 'NG' || hasilL === 'NOK' || hasilL === 'X') {
              const ket = tRow[`item_${itemDef.no}_keterangan_l`] || '';
              const tind = tRow[`item_${itemDef.no}_tindakan_l`] || '';
              const pic = tRow[`item_${itemDef.no}_pic_l`] || tRow.inspector_name || '';
              const foto = tRow[`item_${itemDef.no}_foto_l`] || null;
              ngDetails.push({
                item: `${itemDef.label} (Toilet Pria)`,
                finding: ket || 'Kondisi tidak memenuhi standar kebersihan/fungsi',
                correctiveAction: tind,
                pic,
                isRepaired: Boolean(tind && tind.trim()),
                foto
              });
            }
            const hasilP = String(tRow[`item_${itemDef.no}_hasil_p`] || '').toUpperCase();
            if (hasilP === 'NG' || hasilP === 'NOK' || hasilP === 'X') {
              const ket = tRow[`item_${itemDef.no}_keterangan_p`] || '';
              const tind = tRow[`item_${itemDef.no}_tindakan_p`] || '';
              const pic = tRow[`item_${itemDef.no}_pic_p`] || tRow.inspector_name || '';
              const foto = tRow[`item_${itemDef.no}_foto_p`] || null;
              ngDetails.push({
                item: `${itemDef.label} (Toilet Wanita)`,
                finding: ket || 'Kondisi tidak memenuhi standar kebersihan/fungsi',
                correctiveAction: tind,
                pic,
                isRepaired: Boolean(tind && tind.trim()),
                foto
              });
            }
          });

          if (ngDetails.length === 0 && tRow.overall_status === 'NG') {
            ngDetails.push({
              item: `Fasilitas Toilet (${tRow.area_code || 'Area'})`,
              finding: 'Status inspeksi keseluruhan NG',
              correctiveAction: '',
              pic: tRow.inspector_name || '',
              isRepaired: false,
              foto: null
            });
          }
        } else {
          // Kategori Lainnya
          const rawNg = row.ng_items_raw || [];
          ngDetails = rawNg.map((item: any) => {
            const isRepaired = Boolean(item.corrective_action && item.corrective_action.trim());
            let itemLabel = item.item || 'Item Inspeksi';
            let findingDesc = item.finding && item.finding.trim() ? item.finding.trim() : '';
            let fotoUrl = item.foto || null;

            // Ekstraksi foto jika bentuk array (ga_checksheets)
            if (!fotoUrl && item.images) {
              if (Array.isArray(item.images) && item.images.length > 0) fotoUrl = item.images[0];
              else if (typeof item.images === 'string' && item.images.startsWith('[')) {
                try {
                  const p = JSON.parse(item.images);
                  if (Array.isArray(p) && p.length > 0) fotoUrl = p[0];
                } catch {}
              } else if (typeof item.images === 'string' && item.images) fotoUrl = item.images;
            }

            // Refine APAR
            if (cat.includes('apar')) {
              const ngParts = APAR_CHECKS_GLOBAL
                .filter(c => ['NG', 'X'].includes(String(item[c.key] || '').toUpperCase()))
                .map(c => c.name);
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
              }
            }
            // Refine Fire Alarm
            else if (cat.includes('alarm')) {
              const ngParts: string[] = [];
              if (item.alarm_bell === 'NG') ngParts.push('Alarm Bell');
              if (item.indicator_lamp === 'NG') ngParts.push('Indicator Lamp');
              if (item.manual_call_point === 'NG') ngParts.push('Manual Call Point');
              if (item.kebersihan === 'NG') ngParts.push('Kebersihan');
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak berfungsi: ${ngParts.join(', ')}`;
              }
            }
            // Refine Stop Kontak & Instalasi Listrik
            else if (cat.includes('stop kontak') || cat.includes('instalasi')) {
              const itemNo = Number(item.item_no);
              const mapObj = cat.includes('stop kontak') ? STOP_KONTAK_MAP_GLOBAL : INSTALASI_LISTRIK_MAP_GLOBAL;
              itemLabel = mapObj[itemNo] || `Item #${itemNo}`;
              if (!findingDesc) findingDesc = 'Kondisi tidak memenuhi standar (NOK)';
            }
            // Refine Emergency Lamp
            else if (cat.includes('emergency')) {
              const ngParts: string[] = [];
              if (item.kondisi_lampu === 'NG') ngParts.push('Kondisi Lampu');
              if (item.indicator_lamp === 'NG') ngParts.push('Indicator Lamp');
              if (item.battery_charger === 'NG') ngParts.push('Battery Charger');
              if (item.id_number === 'NG') ngParts.push('ID Number');
              if (item.kebersihan === 'NG') ngParts.push('Kebersihan');
              if (item.kondisi_kabel === 'NG') ngParts.push('Kondisi Kabel');
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
              }
            }
            // Refine Exit Lamp
            else if (cat.includes('exit')) {
              const ngParts: string[] = [];
              if (item.kondisi_lampu === 'NG') ngParts.push('Kondisi Lampu');
              if (item.indikator_lampu === 'NG') ngParts.push('Indikator Lampu');
              if (item.kebersihan === 'NG') ngParts.push('Kebersihan');
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
              }
            }
            // Refine Pintu Darurat
            else if (cat.includes('pintu')) {
              const ngParts: string[] = [];
              if (item.kondisi_pintu === 'NG') ngParts.push('Kondisi Pintu');
              if (item.area_sekitar === 'NG') ngParts.push('Area Sekitar');
              if (item.palu_alat_bantu === 'NG') ngParts.push('Palu/Alat Bantu');
              if (item.identitas_pintu === 'NG') ngParts.push('Identitas Pintu');
              if (item.id_peringatan === 'NG') ngParts.push('ID Peringatan');
              if (item.door_closer === 'NG') ngParts.push('Door Closer');
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
              }
            }
            // Refine Titik Kumpul
            else if (cat.includes('titik')) {
              const ngParts: string[] = [];
              if (item.area_aman === 'NG') ngParts.push('Area Aman');
              if (item.identitas_titik_kumpul === 'NG') ngParts.push('Identitas Titik Kumpul');
              if (item.area_mobil_pmk === 'NG') ngParts.push('Area Mobil PMK');
              if (ngParts.length > 0) {
                itemLabel = `${itemLabel} (${ngParts.join(', ')})`;
                findingDesc = findingDesc ? `Bagian NG: ${ngParts.join(', ')} — ${findingDesc}` : `Bagian tidak sesuai: ${ngParts.join(', ')}`;
              }
            }
            // Refine Lift Barang
            else if (cat.includes('lift')) {
              const subName = getLiftSubItemNameGlobal(String(item.sub_item_id || ''));
              itemLabel = `Lift Barang - Bagian ${subName} (${item.sub_item_id || '-'})`;
            }

            return {
              item: itemLabel,
              finding: findingDesc || 'Temuan ketidaksesuaian (NG)',
              correctiveAction: item.corrective_action || '',
              pic: item.pic || row.filledBy || '',
              isRepaired,
              foto: fotoUrl
            };
          });
        }

        let editUrl = '/status-ga';
        if (cat.includes('apar')) editUrl = row.area && row.area !== 'N/A' ? `/status-ga/inspeksi-apar/${row.area}/riwayat` : `/status-ga/inspeksi-apar`;
        else if (cat.includes('alarm')) editUrl = row.area && row.area !== 'N/A' ? `/status-ga/fire-alarm/riwayat/${row.area}` : `/status-ga/fire-alarm`;
        else if (cat.includes('toilet')) editUrl = row.area && row.area !== 'N/A' ? `/status-ga/checksheet-toilet/riwayat/${row.area}` : `/status-ga/checksheet-toilet`;
        else if (cat.includes('stop kontak')) editUrl = `/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat`;
        else if (cat.includes('instalasi')) editUrl = `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat`;
        else if (cat.includes('emergency')) editUrl = row.area && row.area !== 'N/A' ? `/status-ga/inspeksi-emergency/riwayat/${row.area}` : `/status-ga/inspeksi-emergency`;
        else if (cat.includes('exit')) editUrl = `/status-ga/exit-lamp-pintu-darurat/riwayat/exit-lamp`;
        else if (cat.includes('pintu')) editUrl = `/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat`;
        else if (cat.includes('titik')) editUrl = `/status-ga/exit-lamp-pintu-darurat/riwayat/titik-kumpul`;
        else if (cat.includes('lift')) editUrl = `/status-ga/lift-barang`;
        else if (cat.includes('tangga')) editUrl = `/status-ga/tg-listrik`;
        else if (cat.includes('jalan')) editUrl = `/status-ga/inf-jalan`;
        else if (cat.includes('hydrant')) editUrl = `/status-ga/inspeksi-hydrant`;
        else if (cat.includes('selang')) editUrl = `/status-ga/selang-hydrant`;
        else if (cat.includes('smoke')) editUrl = `/status-ga/smoke-detector`;
        else if (cat.includes('panel')) editUrl = `/status-ga/panel`;
        else if (cat.includes('apd') && !cat.includes('inspeksi')) editUrl = `/status-ga/e-checksheet-apd/riwayat-apd`;
        else if (cat.includes('inspeksi apd') || cat.includes('apd')) editUrl = `/status-ga/inspeksi-apd`;

        return {
          id: row.id,
          filledAt: row.filledAt,
          area: row.area || 'N/A',
          category: row.category,
          filledBy: row.filledBy || 'Unknown',
          status: ngDetails.length > 0 ? 'NG' : 'OK',
          ngCount: ngDetails.length,
          repairedCount: ngDetails.filter(d => d.isRepaired).length,
          unrepairedCount: ngDetails.filter(d => !d.isRepaired).length,
          ngDetails,
          editUrl
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
        total,
        totalPages
      });
    }

    return NextResponse.json({ success: true, data: [], total: 0, totalPages: 0 });

  } catch (error) {
    console.error('❌ History API error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}