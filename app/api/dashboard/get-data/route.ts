// Type definitions for database query results
interface QueryRow {
  [key: string]: any;
}

interface TrendRow {
  date_key: string;
  count: string;
}

interface DistributionRow {
  status: string;
  count: string;
  category: string;
}

interface UserRow {
  name: string;
  count: string;
}

interface HistoryRow {
  filled_at: Date;
  area: string;
  category: string;
  shift: string;
  status: string;
  filled_by: string;
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const categoryCode = searchParams.get('categoryCode');
    const days = parseInt(searchParams.get('days') || '7');

    if (!month) {
      return NextResponse.json({ error: 'Missing month parameter' }, { status: 400 });
    }

    // Build query based on category
    let statsQuery = '';
    let trendQuery = '';
    let distributionQuery = '';
    let topUsersQuery = '';
    let historyQuery = '';
    let params: any[] = [`${month}%`];
    let trendParams: any[] = [];
    
    if (!categoryCode || categoryCode === 'All Category') {
      // ALL CATEGORY - Gabungkan semua tabel
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'OK' THEN 1 END) AS completed,
          COUNT(CASE WHEN status = 'NG' THEN 1 END) AS pending
        FROM (
          SELECT status FROM apar_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM fire_alarm_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM emergency_lamp_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM toilet_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM lift_barang_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM panel_listrik_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM stop_kontak_records WHERE date_key LIKE $1
          UNION ALL
          SELECT status FROM tangga_listrik_records WHERE date_key LIKE $1
        ) AS all_records
      `, params);
      
      const statsRow = statsResult.rows[0];
      const total = parseInt(statsRow.total || '0');
      const completed = parseInt(statsRow.completed || '0');
      const pending = parseInt(statsRow.pending || '0');
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

      // Trend data
      const startDate = new Date();
      startDate.setDate(new Date().getDate() - days + 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const trendResult = await pool.query(`
        SELECT date_key, COUNT(*) AS count FROM apar_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM fire_alarm_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM emergency_lamp_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM toilet_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM lift_barang_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM panel_listrik_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM stop_kontak_records WHERE date_key >= $1 GROUP BY date_key
        UNION ALL
        SELECT date_key, COUNT(*) AS count FROM tangga_listrik_records WHERE date_key >= $1 GROUP BY date_key
      `, [startDateStr]);

      const trendMap = new Map();
      for (const row of trendResult.rows) {
        const date = row.date_key;
        const count = parseInt(row.count || '0');
        trendMap.set(date, (trendMap.get(date) || 0) + count);
      }

      const trendData = Array.from(trendMap.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Distribution data
      const distributionResult = await pool.query(`
        SELECT status, COUNT(*) AS count, 'APAR' AS category FROM apar_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Fire Alarm' AS category FROM fire_alarm_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Emergency Lamp' AS category FROM emergency_lamp_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Toilet' AS category FROM toilet_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Lift Barang' AS category FROM lift_barang_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Panel Listrik' AS category FROM panel_listrik_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Stop Kontak' AS category FROM stop_kontak_records WHERE date_key LIKE $1 GROUP BY status
        UNION ALL
        SELECT status, COUNT(*) AS count, 'Tangga Listrik' AS category FROM tangga_listrik_records WHERE date_key LIKE $1 GROUP BY status
      `, params);

      const distributionData = distributionResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count || '0'),
        category: row.category
      }));

      // Top users
      const topUsersResult = await pool.query(`
        SELECT nik AS name, COUNT(*) AS count FROM apar_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM fire_alarm_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM emergency_lamp_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM toilet_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM lift_barang_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM panel_listrik_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM stop_kontak_records WHERE date_key >= $1 GROUP BY nik
        UNION ALL
        SELECT nik AS name, COUNT(*) AS count FROM tangga_listrik_records WHERE date_key >= $1 GROUP BY nik
      `, [startDateStr]);

      const userMap = new Map();
      for (const row of topUsersResult.rows) {
        const name = row.name;
        const count = parseInt(row.count || '0');
        userMap.set(name, (userMap.get(name) || 0) + count);
      }

      const topUsers = Array.from(userMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // History data
      const historyResult = await pool.query(`
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'APAR' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM apar_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Fire Alarm' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM fire_alarm_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Emergency Lamp' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM emergency_lamp_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Toilet' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM toilet_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Lift Barang' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM lift_barang_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Panel Listrik' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM panel_listrik_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Stop Kontak' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM stop_kontak_records WHERE date_key LIKE $1
        UNION ALL
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, 'Tangga Listrik' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM tangga_listrik_records WHERE date_key LIKE $1
        ORDER BY filled_at DESC
        LIMIT 100
      `, params);

      const historyData = historyResult.rows.map(row => ({
        filledAt: row.filled_at,
        area: row.area === 'pre-assy' ? 'Pre Assy' : 'Final Assy',
        category: row.category,
        shift: row.shift,
        status: row.status,
        ngCount: 0,
        filledBy: row.filled_by || 'System'
      }));

      return NextResponse.json({
        success: true,
        stats: {
          total,
          completed,
          pending,
          completionRate
        },
        trendData,
        distributionData,
        topUsers,
        historyData
      });
    } else {
      // SPECIFIC CATEGORY
      let tableName = '';
      let categoryLabel = '';

      switch (categoryCode) {
        case 'apar':
          tableName = 'apar_records';
          categoryLabel = 'APAR';
          break;
        case 'fire-alarm':
          tableName = 'fire_alarm_records';
          categoryLabel = 'Fire Alarm';
          break;
        case 'emergency-lamp':
          tableName = 'emergency_lamp_records';
          categoryLabel = 'Emergency Lamp';
          break;
        case 'toilet':
          tableName = 'toilet_records';
          categoryLabel = 'Toilet';
          break;
        case 'lift-barang':
          tableName = 'lift_barang_records';
          categoryLabel = 'Lift Barang';
          break;
        case 'panel-listrik':
          tableName = 'panel_listrik_records';
          categoryLabel = 'Panel Listrik';
          break;
        case 'stop-kontak':
          tableName = 'stop_kontak_records';
          categoryLabel = 'Stop Kontak';
          break;
        case 'tangga-listrik':
          tableName = 'tangga_listrik_records';
          categoryLabel = 'Tangga Listrik';
          break;
        default:
          return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'OK' THEN 1 END) AS completed,
          COUNT(CASE WHEN status = 'NG' THEN 1 END) AS pending
        FROM ${tableName}
        WHERE date_key LIKE $1
      `, params);

      const statsRow = statsResult.rows[0];
      const total = parseInt(statsRow.total || '0');
      const completed = parseInt(statsRow.completed || '0');
      const pending = parseInt(statsRow.pending || '0');
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

      const startDate = new Date();
      startDate.setDate(new Date().getDate() - days + 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const trendResult = await pool.query(`
        SELECT date_key, COUNT(*) AS count FROM ${tableName} WHERE date_key >= $1 GROUP BY date_key ORDER BY date_key ASC
      `, [startDateStr]);

      const trendData = trendResult.rows.map(row => ({
        date: row.date_key,
        count: parseInt(row.count || '0')
      }));

      const distributionResult = await pool.query(`
        SELECT status, COUNT(*) AS count, '${categoryLabel}' AS category FROM ${tableName} WHERE date_key LIKE $1 GROUP BY status ORDER BY status
      `, params);

      const distributionData = distributionResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count || '0'),
        category: row.category
      }));

      const topUsersResult = await pool.query(`
        SELECT nik AS name, COUNT(*) AS count FROM ${tableName} WHERE date_key >= $1 GROUP BY nik ORDER BY count DESC LIMIT 5
      `, [startDateStr]);

      const topUsers = topUsersResult.rows.map(row => ({
        name: row.name,
        count: parseInt(row.count || '0')
      }));

      const historyResult = await pool.query(`
        SELECT created_at AS filled_at, COALESCE(area, 'General') AS area, '${categoryLabel}' AS category, 
               COALESCE(shift, 'A') AS shift, status, nik AS filled_by
        FROM ${tableName}
        WHERE date_key LIKE $1
        ORDER BY created_at DESC
        LIMIT 100
      `, params);

      const historyData = historyResult.rows.map(row => ({
        filledAt: row.filled_at,
        area: row.area === 'pre-assy' ? 'Pre Assy' : 'Final Assy',
        category: row.category,
        shift: row.shift,
        status: row.status,
        ngCount: 0,
        filledBy: row.filled_by || 'System'
      }));

      return NextResponse.json({
        success: true,
        stats: {
          total,
          completed,
          pending,
          completionRate
        },
        trendData,
        distributionData,
        topUsers,
        historyData
      });
    }
  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}