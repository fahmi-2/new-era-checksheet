// app/api/apd/master-labels/route.ts
//
// Endpoint untuk menyimpan & mengambil custom label override:
// - Nama Departemen
// - Nama Proses
// - Nama Area per Sub-Proses
//
// Tabel yang dibutuhkan (jalankan sekali di DB):
// CREATE TABLE IF NOT EXISTS apd_master_labels (
//   id          SERIAL PRIMARY KEY,
//   label_type  VARCHAR(32) NOT NULL,   -- 'dept' | 'proses' | 'area'
//   key         VARCHAR(128) NOT NULL,  -- identifier unik (deptKey / prosesKey / prosesKey::subName::originalArea)
//   custom_name TEXT        NOT NULL,
//   updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   UNIQUE(label_type, key)
// );

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Inisialisasi tabel-tabel master label & kustomisasi
async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS apd_master_labels (
      id          SERIAL PRIMARY KEY,
      label_type  VARCHAR(32)  NOT NULL,
      key         VARCHAR(256) NOT NULL,
      custom_name TEXT         NOT NULL,
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(label_type, key)
    );

    CREATE TABLE IF NOT EXISTS apd_custom_master_items (
      id          SERIAL PRIMARY KEY,
      item_type   VARCHAR(32)  NOT NULL, -- 'dept' | 'proses' | 'sub' | 'area'
      parent_key  VARCHAR(256),          -- deptKey untuk proses, prosesKey untuk sub, 'prosesKey::subName' untuk area
      item_key    VARCHAR(256) NOT NULL, -- key unik
      item_name   TEXT         NOT NULL, -- nama item
      area_type   VARCHAR(32)  DEFAULT 'predefined-per-sub',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_type, item_key)
    );

    CREATE TABLE IF NOT EXISTS apd_master_change_logs (
      id          SERIAL PRIMARY KEY,
      label_type  VARCHAR(32) NOT NULL,
      item_key    VARCHAR(256) NOT NULL,
      old_name    TEXT,
      new_name    TEXT NOT NULL,
      action_type VARCHAR(32) NOT NULL,
      changed_by  VARCHAR(100),
      changed_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ── GET: ambil label overrides, custom added items, & deleted keys ─────────────
export async function GET() {
  try {
    await initTables();

    const [labelsRes, customRes] = await Promise.all([
      pool.query(`SELECT label_type, key, custom_name FROM apd_master_labels ORDER BY id ASC`),
      pool.query(`SELECT item_type, parent_key, item_key, item_name, area_type FROM apd_custom_master_items ORDER BY id ASC`)
    ]);

    const labels: Record<string, Record<string, string>> = {
      dept: {},
      proses: {},
      area: {},
      deleted: {}, // key: 'DELETED'
    };

    for (const row of labelsRes.rows) {
      if (row.label_type === 'deleted') {
        labels.deleted[row.key] = row.custom_name;
      } else {
        const type = row.label_type as 'dept' | 'proses' | 'area';
        if (labels[type]) {
          labels[type][row.key] = row.custom_name;
        }
      }
    }

    const customItems = {
      dept: [] as any[],
      proses: [] as any[],
      sub: [] as any[],
      area: [] as any[],
    };

    for (const row of customRes.rows) {
      const t = row.item_type as 'dept' | 'proses' | 'sub' | 'area';
      if (customItems[t]) {
        customItems[t].push(row);
      }
    }

    return NextResponse.json({
      success: true,
      data: labels,
      customItems,
    });
  } catch (error) {
    console.error('❌ GET apd/master-labels error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil master labels',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// ── PUT: simpan / update satu label override ──────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    await initTables();
    const body = await request.json();
    const { label_type, key, custom_name } = body as {
      label_type: string;
      key: string;
      custom_name: string;
    };

    if (!label_type || !key) {
      return NextResponse.json(
        { success: false, message: 'label_type dan key wajib diisi' },
        { status: 400 }
      );
    }

    if (!['dept', 'proses', 'area'].includes(label_type)) {
      return NextResponse.json(
        { success: false, message: 'label_type harus: dept | proses | area' },
        { status: 400 }
      );
    }

    if (!custom_name || custom_name.trim() === '') {
      const oldRes = await pool.query(
        `SELECT custom_name FROM apd_master_labels WHERE label_type = $1 AND key = $2`,
        [label_type, key]
      );
      const oldName = oldRes.rows[0]?.custom_name || null;

      await pool.query(
        `DELETE FROM apd_master_labels WHERE label_type = $1 AND key = $2`,
        [label_type, key]
      );

      await pool.query(
        `INSERT INTO apd_master_change_logs (label_type, item_key, old_name, new_name, action_type)
         VALUES ($1, $2, $3, 'DEFAULT', 'RESET')`,
        [label_type, key, oldName]
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Label dikembalikan ke default',
        action: 'deleted',
      });
    }

    const oldRes = await pool.query(
      `SELECT custom_name FROM apd_master_labels WHERE label_type = $1 AND key = $2`,
      [label_type, key]
    );
    const oldName = oldRes.rows[0]?.custom_name || null;

    await pool.query(
      `INSERT INTO apd_master_labels (label_type, key, custom_name, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (label_type, key)
       DO UPDATE SET custom_name = EXCLUDED.custom_name, updated_at = CURRENT_TIMESTAMP`,
      [label_type, key, custom_name.trim()]
    );

    await pool.query(
      `INSERT INTO apd_master_change_logs (label_type, item_key, old_name, new_name, action_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [label_type, key, oldName, custom_name.trim(), oldName ? 'RENAME' : 'CREATE']
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Label berhasil disimpan',
      action: 'upserted',
      label_type,
      key,
      custom_name: custom_name.trim(),
    });
  } catch (error) {
    console.error('❌ PUT apd/master-labels error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan master label',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// ── POST: tambah Departemen, Proses, atau Area baru ───────────────────────────
// Body: { item_type: 'dept'|'proses'|'sub'|'area', item_name: string, parent_key?: string, area_type?: string }
export async function POST(request: NextRequest) {
  try {
    await initTables();
    const body = await request.json();
    const { item_type, item_name, parent_key, area_type } = body as {
      item_type: string;
      item_name: string;
      parent_key?: string;
      area_type?: string;
    };

    if (!item_type || !item_name || !item_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'item_type dan item_name wajib diisi' },
        { status: 400 }
      );
    }

    const trimmedName = item_name.trim();
    let generatedKey = '';

    if (item_type === 'dept') {
      generatedKey = trimmedName.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
      if (!generatedKey) generatedKey = `DEPT-${Date.now()}`;
    } else if (item_type === 'proses') {
      if (!parent_key) {
        return NextResponse.json({ success: false, message: 'parent_key (deptKey) wajib diisi untuk proses' }, { status: 400 });
      }
      const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      generatedKey = `${parent_key.toLowerCase()}-${slug}-${Date.now().toString().slice(-4)}`;
    } else if (item_type === 'sub') {
      if (!parent_key) {
        return NextResponse.json({ success: false, message: 'parent_key (prosesKey) wajib diisi untuk sub proses' }, { status: 400 });
      }
      generatedKey = `${parent_key}::${trimmedName}`;
    } else if (item_type === 'area') {
      if (!parent_key) {
        return NextResponse.json({ success: false, message: 'parent_key (prosesKey::subName) wajib diisi untuk area' }, { status: 400 });
      }
      generatedKey = `${parent_key}::${trimmedName}`;
    } else {
      return NextResponse.json({ success: false, message: 'item_type tidak valid' }, { status: 400 });
    }

    // Masukkan ke tabel custom master items
    await pool.query(
      `INSERT INTO apd_custom_master_items (item_type, parent_key, item_key, item_name, area_type, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (item_type, item_key) DO UPDATE SET item_name = EXCLUDED.item_name`,
      [item_type, parent_key || null, generatedKey, trimmedName, area_type || 'predefined-per-sub']
    );

    // Hapus dari deleted labels jika sebelumnya pernah dihapus
    await pool.query(
      `DELETE FROM apd_master_labels WHERE label_type = 'deleted' AND key = $1`,
      [generatedKey]
    );

    // Log
    await pool.query(
      `INSERT INTO apd_master_change_logs (label_type, item_key, old_name, new_name, action_type)
       VALUES ($1, $2, NULL, $3, 'CREATE')`,
      [item_type, generatedKey, trimmedName]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `${item_type.toUpperCase()} berhasil ditambahkan`,
      item: {
        item_type,
        parent_key,
        item_key: generatedKey,
        item_name: trimmedName,
        area_type: area_type || 'predefined-per-sub',
      },
    });
  } catch (error) {
    console.error('❌ POST apd/master-labels error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menambahkan master item',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// ── DELETE: hapus Departemen, Proses, Sub-Proses, atau Area ───────────────────
// Body: { item_type: 'dept'|'proses'|'sub'|'area', key: string }
export async function DELETE(request: NextRequest) {
  try {
    await initTables();
    const body = await request.json();
    const { item_type, key } = body as {
      item_type: string;
      key: string;
    };

    if (!item_type || !key) {
      return NextResponse.json(
        { success: false, message: 'item_type dan key wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Jika ada di apd_custom_master_items, hapus record fisiknya
    await pool.query(
      `DELETE FROM apd_custom_master_items WHERE item_type = $1 AND item_key = $2`,
      [item_type, key]
    );

    // 2. Tandai sebagai deleted di apd_master_labels agar data bawaan tidak muncul lagi
    await pool.query(
      `INSERT INTO apd_master_labels (label_type, key, custom_name, updated_at)
       VALUES ('deleted', $1, 'DELETED', CURRENT_TIMESTAMP)
       ON CONFLICT (label_type, key) DO UPDATE SET custom_name = 'DELETED', updated_at = CURRENT_TIMESTAMP`,
      [key]
    );

    // 3. Catat ke audit log
    await pool.query(
      `INSERT INTO apd_master_change_logs (label_type, item_key, old_name, new_name, action_type)
       VALUES ($1, $2, NULL, 'DELETED', 'DELETE')`,
      [item_type, key]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `${item_type.toUpperCase()} berhasil dihapus`,
      deleted_key: key,
    });
  } catch (error) {
    console.error('❌ DELETE apd/master-labels error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus master item',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

