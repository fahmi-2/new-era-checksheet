# 📊 Dashboard Analytics - Audit & Perbaikan

## 1. OVERVIEW - Data Consistency Issues

### Current State:
- 6 komponen main: Analytics Route, Top Users Route, History Route, Config, Mapper, Frontend
- 17 form types (11 legacy + 6 GA unified)
- 3 database schema patterns (legacy tables, unified GA tables, inspection tables)

### Issues Found:

#### **Issue #1: Kolom Tanggal Benar Sudah Terdokumentasi**
✅ GOOD: Comments di files sudah mencatat kolom tanggal yang sesuai per tabel:
```
exit_lamp_checklists     → checklist_date  ✓
pintu_darurat_checklists → checklist_date  ✓
titik_kumpul_checklists  → checklist_date  ✓
```

#### **Issue #2: Code Duplication in Dashboard Config**
❌ PROBLEM: dashboard-config.ts has FORM_TYPES array AND ga-dashboard/page.tsx has duplicate FORM_TYPES
- Source of truth nya dimana?
- Risk: Ketika update FORM_TYPES, harus update 2 tempat

#### **Issue #3: History API Response Format Not Fully Consistent**
⚠️ ISSUE: History endpoint returns data dengan field names:
- filledAt (string) — inconsistent dengan convention
- area, category, shift, status, ngCount, filledBy, formType
- Mapper di analytics-mapper.ts maps these, tapi perlu standardization

#### **Issue #4: Top Users Aggregation**
⚠️ ISSUE: Top users aggregate across entire date range
- Better: Aggregate per date range THEN top 5 per date
- Current: Just top 5 across all dates in range

#### **Issue #5: Mapper Error Handling**
⚠️ ISSUE: analytics-mapper.ts uses nullish coalescing di history mapping:
```typescript
filledAt: r.filledAt ?? r.filled_at ?? ''
```
- Risky: Jika kedua field kosong, returns empty string
- Better: Perlu explicit error logging + fallback

#### **Issue #6: GA Dashboard Config Hardcoded**
⚠️ ISSUE: ga-dashboard/page.tsx has hardcoded FORM_TYPES yang duplicate dari dashboard-config.ts
- Should be import dari config file
- Easier to maintain

---

## 2. PROPOSED SOLUTIONS

### Solution #1: Consolidate FORM_TYPES
**Location**: dashboard-config.ts (single source of truth)
- Remove FORM_TYPES from ga-dashboard/page.tsx
- Import FORM_TYPES dari dashboard-config.ts

### Solution #2: Standardize API Response Format
**Locations**: analytics/route.ts, history/route.ts, top-users/route.ts
- Define consistent response schema
- Ensure all endpoints return: date, status, count (for analytics)
- Ensure all endpoints return proper timestamps

### Solution #3: Improve History API
**Location**: analytics/history/route.ts
- Map formType/category properly for all legacy forms
- Add validation for required fields
- Improve total/totalPages calculation

### Solution #4: Enhance Error Handling
**Location**: analytics-mapper.ts
- Add explicit error states
- Better fallback values
- Log warnings for missing data

### Solution #5: Validate All Queries
**Locations**: analytics/route.ts, top-users/route.ts
- Audit each query untuk use correct date columns
- ✓ Sudah tercatat di comments, verify implementation

---

## 3. IMPLEMENTATION ROADMAP

### Phase 1: Consolidation (Low Risk)
- [ ] Extract FORM_TYPES ke dashboard-config.ts
- [ ] Update ga-dashboard/page.tsx to import FORM_TYPES
- [ ] Build time: ~10 mins
- Risk: Minimal

### Phase 2: API Standardization (Medium Risk)
- [ ] Review all analytics queries (17 form types)
- [ ] Ensure consistent response format
- [ ] Update history endpoint field names
- [ ] Build time: ~30 mins
- Risk: Must test all 17 form types

### Phase 3: Mapper Enhancement (Low Risk)
- [ ] Add better error handling di analytics-mapper.ts
- [ ] Improve null checks
- [ ] Add debug logging
- [ ] Build time: ~15 mins
- Risk: Minimal

### Phase 4: Integration Testing (High Risk)
- [ ] Test each form type in dashboard
- [ ] Verify data consistency
- [ ] Check pagination
- [ ] Build time: ~30 mins
- Risk: Critical

---

## 4. QUICK REFERENCE - Current API Responses

### Analytics API (/api/analytics?slug=exit-lamp&dateFrom=...&dateTo=...)
**Response Format:**
```json
{
  "success": true,
  "data": [
    { "date": "2026-02-12", "status": "OK", "count": 5 },
    { "date": "2026-02-12", "status": "NG", "count": 1 }
  ]
}
```

### Top Users API (/api/analytics/top-users?slug=exit-lamp&dateFrom=...&dateTo=...)
**Response Format:**
```json
{
  "success": true,
  "data": [
    { "name": "John Doe", "count": 10 },
    { "name": "Jane Smith", "count": 8 }
  ]
}
```

### History API (/api/analytics/history?slug=exit-lamp&dateFrom=...&dateTo=...&page=1&limit=10)
**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "filledAt": "2026-02-12T10:30:00Z",
      "area": "N/A",
      "category": "Exit Lamp",
      "shift": "Pagi",
      "status": "OK",
      "ngCount": 0,
      "filledBy": "John Doe",
      "formType": "-"
    }
  ],
  "total": 50,
  "totalPages": 5
}
```

---

## 5. NEXT STEPS
1. Implement Phase 1 (Consolidation) ✅
2. Audit Phase 2 queries (must verify all 17 form types use correct date columns)
3. Implement Phase 2 & 3
4. Run integration tests
5. Document final state

