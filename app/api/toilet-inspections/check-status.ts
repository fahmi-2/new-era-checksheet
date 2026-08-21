// app/api/toilet-inspections/check-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

// Type untuk hasil query status toilet
interface ToiletInspection {
  id: number;
  overall_status: string;
  inspection_time: string;
  inspector_name: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { area_code, inspection_date } = req.query;

  try {
    if (!area_code || !inspection_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'area_code dan inspection_date diperlukan' 
      });
    }

    // ⚠️ FIX 1: Gunakan $1, $2 untuk PostgreSQL (bukan ?)
    // ⚠️ FIX 2: Jangan destructuring array, akses langsung result
    const results = await pool.query<ToiletInspection>(
      `SELECT 
        id,
        overall_status,
        inspection_time,
        inspector_name
       FROM toilet_inspections 
       WHERE area_code = $1 AND inspection_date = $2`,
      [area_code, inspection_date]  // Parameters: [$1, $2]
    );

    // ⚠️ FIX 3: Akses .rows dari QueryResult
    const inspections = results.rows;

    if (inspections.length > 0) {
      return res.status(200).json({ 
        success: true, 
        filled: true,
        data: inspections[0]
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        filled: false,
        data: null
      });
    }
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}