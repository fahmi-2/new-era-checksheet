// lib/api/checksheet.ts

export interface ChecklistItem {
  id: number;
  item_key: string;
  no: number;
  item_group: string;
  item_check: string;
  method: string;
  image?: string;
}

export interface ChecklistData {
  [itemKey: string]: {
    date: string;
    hasilPemeriksaan: string;
    keteranganTemuan?: string;
    tindakanPerbaikan?: string;
    pic?: string;
    dueDate?: string;
    verify?: string;
    inspector: string;
    images?: string[];
    notes?: string;
  };
}

export interface Area {
  id: number;
  no: number;
  name: string;
  location?: string;
}

/**
 * Get area by ID
 */
export async function getAreaById(typeSlug: string, areaId: number): Promise<Area | null> {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/areas`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch areas');
  }
  
  // Cari area dengan ID yang sesuai
  const area = data.data.find((a: any) => a.id === areaId);
  return area || null;
}

/**
 * Get all areas by type slug
 */
export async function getAreasByType(typeSlug: string) {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/areas`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch areas');
  }
  
  return data.data;
}

/**
 * Get all available dates for a specific area
 */
export async function getAvailableDates(typeSlug: string, areaId: number): Promise<string[]> {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/by-area/${areaId}/dates`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch available dates');
  }
  
  return data.data || [];
}

/**
 * Get checklist data for a specific date
 */
export async function getChecklistByDate(
  typeSlug: string,
  areaId: number,
  date: string
): Promise<ChecklistData | null> {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/by-area/${areaId}/${date}`);
  const data = await response.json();
  
  if (!data.success) {
    if (data.message === 'Belum ada data untuk tanggal ini') {
      return null;
    }
    throw new Error(data.message || 'Failed to fetch checklist data');
  }
  
  return data.data;
}

/**
 * Get all checklist items for a type
 */
export async function getItemsByType(typeSlug: string): Promise<ChecklistItem[]> {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/items`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch checklist items');
  }
  
  return data.data;
}

/**
 * Save checklist data
 */
export async function saveChecklist(
  typeSlug: string,
  areaId: number,
  date: string,
  checklistData: ChecklistData,
  inspectorId: string,
  inspectorName: string,
  status: string = 'submitted'
) {
  const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${typeSlug}/by-area/${areaId}/${date}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checklistData,
      inspectorId,
      inspectorName,
      status,
    }),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to save checklist');
  }
  
  return data;
}