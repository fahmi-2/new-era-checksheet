    import { NextRequest, NextResponse } from 'next/server';
    import pool from '@/lib/db';

    export const runtime = 'nodejs';
    export const dynamic = 'force-dynamic';

    export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const slug = searchParams.get('slug');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const area = searchParams.get('area');
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        // ✅ VALIDASI DI ATAS (sebelum handler)
        if (!slug || !dateFrom || !dateTo) {
        return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
        );
        }

        console.log('📜 History API - Slug:', slug, 'Date:', dateFrom, 'to', dateTo, 'Page:', page);

        // ========================================
        // ✅ HANDLER: ALL CATEGORY - Global History
        // ========================================
        if (slug.toLowerCase() === 'all') {
        console.log('📜 Querying GLOBAL history from all tables...');
        
        const allQueries = [
            `SELECT id, submitted_at as "filledAt", 'APAR' as category, area, checker as "filledBy", 'OK' as status, 0 as "ngCount" FROM apar_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'Fire Alarm' as category, zona as area, checker as "filledBy", 'OK' as status, 0 as "ngCount" FROM fire_alarm_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, created_at as "filledAt", 'Toilet' as category, area_code as area, inspector_name as "filledBy", overall_status as status, CASE WHEN overall_status = 'NG' THEN 1 ELSE 0 END as "ngCount" FROM toilet_inspections WHERE created_at >= $1 AND created_at <= $2`,
            `SELECT id, created_at as "filledAt", 'Electrical' as category, area, pic as "filledBy", 'OK' as status, 0 as "ngCount" FROM electrical_inspections WHERE created_at >= $1 AND created_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'APD' as category, jenis_apd as area, checker as "filledBy", 'OK' as status, 0 as "ngCount" FROM apd_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'Exit Lamp' as category, 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount" FROM exit_lamp_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'Pintu Darurat' as category, 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount" FROM pintu_darurat_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'Titik Kumpul' as category, 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount" FROM titik_kumpul_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT id, submitted_at as "filledAt", 'Lift Barang' as category, 'N/A' as area, inspector as "filledBy", 'OK' as status, 0 as "ngCount" FROM lift_barang_inspections WHERE submitted_at >= $1 AND submitted_at <= $2`,
        ];
        
        const allResults = [];
        const params = [dateFrom, dateTo];
        
        // Hitung total untuk pagination
        const countQueries = [
            `SELECT COUNT(*) as total FROM apar_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM fire_alarm_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM toilet_inspections WHERE created_at >= $1 AND created_at <= $2`,
            `SELECT COUNT(*) as total FROM electrical_inspections WHERE created_at >= $1 AND created_at <= $2`,
            `SELECT COUNT(*) as total FROM apd_records WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM exit_lamp_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM pintu_darurat_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM titik_kumpul_checklists WHERE submitted_at >= $1 AND submitted_at <= $2`,
            `SELECT COUNT(*) as total FROM lift_barang_inspections WHERE submitted_at >= $1 AND submitted_at <= $2`,
        ];
        
        let total = 0;
        for (const countQuery of countQueries) {
            try {
            const countResult = await pool.query(countQuery, [dateFrom, dateTo]);
            total += parseInt(countResult.rows[0].total) || 0;
            } catch (err) {
            console.warn('⚠️ Count query error:', (err as Error).message);
            }
        }
        
        const totalPages = Math.ceil(total / limit);
        
        // Fetch data
        for (const query of allQueries) {
            try {
            const result = await pool.query(query, params);
            if (result.rows && result.rows.length > 0) {
                allResults.push(...result.rows);
            }
            } catch (err) {
            console.warn('⚠️ Table skipped:', (err as Error).message);
            }
        }
        
        const formattedData = allResults
            .sort((a: any, b: any) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime())
            .slice(offset, offset + limit);
        
        console.log('📜 Global History Result:', formattedData.length, 'records');
        
        return NextResponse.json({ 
            success: true, 
            data: formattedData,
            total: total,
            totalPages: totalPages,
        });
        }

        // ========================================
        // ✅ HANDLER: SPECIFIC CATEGORIES
        // ========================================

        // APAR
        if (slug.toLowerCase() === 'apar') {
        let query = `
            SELECT id, submitted_at as "filledAt", area, checker as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM apar_records
            WHERE submitted_at >= $1 AND submitted_at <= $2 
        `;
        const params: any[] = [dateFrom, dateTo];
        
        if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
            query += `AND area = $${params.length + 1} `;
            params.push(area);
        }
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", area, checker as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        // Add LIMIT and OFFSET
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // FIRE ALARM
        if (slug.toLowerCase() === 'fire-alarm') {
        let query = `
            SELECT id, submitted_at as "filledAt", zona as area, checker as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM fire_alarm_records
            WHERE submitted_at >= $1 AND submitted_at <= $2 
        `;
        const params: any[] = [dateFrom, dateTo];
        
        if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
            query += `AND zona = $${params.length + 1} `;
            params.push(area);
        }
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", zona as area, checker as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // TOILET
        if (slug.toLowerCase() === 'toilet') {
        let query = `
            SELECT id, created_at as "filledAt", area_code as area, inspector_name as "filledBy", overall_status as status, CASE WHEN overall_status = 'NG' THEN 1 ELSE 0 END as "ngCount"
            FROM toilet_inspections
            WHERE created_at >= $1 AND created_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, created_at as "filledAt", area_code as area, inspector_name as "filledBy", overall_status as status, CASE WHEN overall_status = \'NG\' THEN 1 ELSE 0 END as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // ELECTRICAL
        if (slug.toLowerCase() === 'electrical') {
        let query = `
            SELECT id, created_at as "filledAt", area, pic as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM electrical_inspections
            WHERE created_at >= $1 AND created_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, created_at as "filledAt", area, pic as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // APD
        if (slug.toLowerCase() === 'apd') {
        let query = `
            SELECT id, submitted_at as "filledAt", jenis_apd as area, checker as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM apd_records
            WHERE submitted_at >= $1 AND submitted_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", jenis_apd as area, checker as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // EMERGENCY LAMP
        if (slug.toLowerCase() === 'emergency-lamp') {
        let query = `
            SELECT id, submitted_at as "filledAt", area, checker as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM emergency_lamp_records
            WHERE submitted_at >= $1 AND submitted_at <= $2 
        `;
        const params: any[] = [dateFrom, dateTo];
        
        if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
            query += `AND area = $${params.length + 1} `;
            params.push(area);
        }
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", area, checker as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // EXIT LAMP
        if (slug.toLowerCase() === 'exit-lamp') {
        let query = `
            SELECT id, submitted_at as "filledAt", 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM exit_lamp_checklists
            WHERE submitted_at >= $1 AND submitted_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", \'N/A\' as area, checker_name as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // PINTU DARURAT
        if (slug.toLowerCase() === 'pintu-darurat') {
        let query = `
            SELECT id, submitted_at as "filledAt", 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM pintu_darurat_checklists
            WHERE submitted_at >= $1 AND submitted_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", \'N/A\' as area, checker_name as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // TITIK KUMPUL
        if (slug.toLowerCase() === 'titik-kumpul') {
        let query = `
            SELECT id, submitted_at as "filledAt", 'N/A' as area, checker_name as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM titik_kumpul_checklists
            WHERE submitted_at >= $1 AND submitted_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", \'N/A\' as area, checker_name as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
        });
        }

        // LIFT BARANG
        if (slug.toLowerCase() === 'lift-barang') {
        let query = `
            SELECT id, submitted_at as "filledAt", 'N/A' as area, inspector as "filledBy", 'OK' as status, 0 as "ngCount"
            FROM lift_barang_inspections
            WHERE submitted_at >= $1 AND submitted_at <= $2
        `;
        const params: any[] = [dateFrom, dateTo];
        
        // Count total
        const countQuery = query.replace(
            'SELECT id, submitted_at as "filledAt", \'N/A\' as area, inspector as "filledBy", \'OK\' as status, 0 as "ngCount"', 
            'SELECT COUNT(*) as total'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total) || 0;
        const totalPages = Math.ceil(total / limit);
        
        query += `ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit);
        params.push(offset);
        
        const result = await pool.query(query, params);
        return NextResponse.json({ 
            success: true, 
            data: result.rows || [],
            total: total,
            totalPages: totalPages,
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