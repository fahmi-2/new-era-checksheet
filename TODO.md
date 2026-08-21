# TODO: Fix TypeScript Errors in Lift-Barang Preventive API Routes

## Tasks
- [ ] Edit `app/api/lift-barang/preventive/route.ts`:
  - Replace `pool.execute` with `pool.query` (PostgreSQL syntax).
  - Adjust result handling: Use `result.rows` for SELECT queries, add `RETURNING id` for INSERT to get inserted ID.
  - Remove array destructuring like `const [headerResult] = await pool.query(...)`.

- [ ] Edit `app/api/lift-barang/preventive/[id]/route.ts`:
  - Change destructuring of `client.query` results: Use `const headerRows = await client.query(...)` then `headerRows.rows` instead of `const [headerRows] = await client.query(...)`.
  - Apply to GET, PUT, DELETE functions.

## Followup
- [ ] Run TypeScript check to verify fixes.
