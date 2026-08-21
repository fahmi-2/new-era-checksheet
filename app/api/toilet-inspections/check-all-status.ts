// app/api/toilet-inspections/check-all-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

// Type untuk hasil query status
interface StatusResult {
  area_code: string;
  filled: boolean;
  status: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { area_codes, inspection_date } = req.query;

  try {
    if (!area_codes || !inspection_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'area_codes dan inspection_date diperlukan' 
      });
    }

    const areasArray = String(area_codes).split(',');
    
    // ⚠️ FIX 1: Generate PostgreSQL placeholders: $1, $2, $3, ...
    const placeholders = areasArray.map((_, index) => `$${index + 1}`).join(',');
    
    // ⚠️ FIX 2: Tambahkan placeholder untuk inspection_date: $N+1
    const datePlaceholder = `$${areasArray.length + 1}`;

    // ⚠️ FIX 3: Jangan destructuring array, akses langsung result
    const results = await pool.query<StatusResult>(
      `SELECT 
        area_code,
        CASE WHEN COUNT(id) > 0 THEN true ELSE false END as filled,
        MAX(overall_status) as status
       FROM toilet_inspections 
       WHERE area_code IN (${placeholders}) 
       AND inspection_date = ${datePlaceholder}
       GROUP BY area_code`,
      [...areasArray, inspection_date]  // Parameters: [area1, area2, ..., date]
    );

    // ⚠️ FIX 4: Akses .rows dari QueryResult
    const inspectionsArray = results.rows;
    
    const statusMap = new Map<string, { area_code: string; filled: boolean; status: string | null }>();
    
    // Initialize all areas as not filled
    areasArray.forEach(area => {
      statusMap.set(area, { area_code: area, filled: false, status: null });
    });

    // Update with actual data
    inspectionsArray.forEach((item) => {
      statusMap.set(item.area_code, {
        area_code: item.area_code,
        filled: !!item.filled,
        status: item.status
      });
    });

    const data = Array.from(statusMap.values());

    return res.status(200).json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('Check all status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}