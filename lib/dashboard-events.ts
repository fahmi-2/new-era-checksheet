// lib/dashboard-events.ts

export const DASHBOARD_REFRESH_EVENT = 'dashboard:data-refreshed';
const STORAGE_KEY = 'dashboard-refresh-trigger';

/**
 * Trigger refresh event setelah form disimpan
 */
export function triggerDashboardRefresh(formType?: string) {
  const payload = {
    formType,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).slice(2)
  };

  // Untuk same-tab
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT, {
    detail: payload
  }));
  
  // Untuk cross-tab
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
      }, 100);
    } catch (error) {
      console.warn('Failed to trigger cross-tab refresh:', error);
    }
  }
}

/**
 * Listen untuk refresh event
 */
export function onDashboardRefresh(
  callback: (formType?: string) => void,
  options?: {
    debounceMs?: number;
    maxAge?: number;
  }
) {
  const { debounceMs = 0, maxAge = 5000 } = options || {};
  let lastTriggered = 0;
  let debounceTimer: NodeJS.Timeout | null = null;

  const handleCustomEvent = (e: CustomEvent) => {
    const detail = e.detail as { formType?: string; timestamp: number } | undefined;
    
    if (!detail) return;
    
    const now = Date.now();
    
    if (now - detail.timestamp > maxAge) {
      console.log('⏱️ Skipping stale refresh event');
      return;
    }
    
    if (debounceMs > 0) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        lastTriggered = now;
        callback(detail.formType);
        debounceTimer = null;
      }, debounceMs);
    } else {
      if (now - lastTriggered < 1000) {
        console.log('⏱️ Throttling refresh');
        return;
      }
      
      lastTriggered = now;
      callback(detail.formType);
    }
  };
  
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        
        if (data.nonce) {
          if (Date.now() - data.timestamp < maxAge) {
            handleCustomEvent({ 
              detail: { formType: data.formType, timestamp: data.timestamp } 
            } as CustomEvent);
          }
        }
      } catch (error) {
        console.warn('Failed to parse storage event:', error);
      }
    }
  };
  
  window.addEventListener(DASHBOARD_REFRESH_EVENT, handleCustomEvent as EventListener);
  window.addEventListener('storage', handleStorageEvent);
  
  return () => {
    window.removeEventListener(DASHBOARD_REFRESH_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener('storage', handleStorageEvent);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}

/**
 * Helper untuk check apakah perlu refresh
 */
export function shouldRefreshForForm(
  activeForm: string,
  triggeredForm?: string
): boolean {
  if (!triggeredForm) return true;
  if (activeForm === 'All Category') return true;
  
  const formTypeMap: Record<string, string[]> = {
    'APAR': ['apar'],
    'Instalasi Listrik': ['electrical'],
    'Stop Kontak': ['electrical'],
    'Fire Alarm': ['fire-alarm'],
    'Toilet': ['toilet'],
    'Lift Barang': ['lift'],
    'Exit & Pintu Darurat': ['exit'],
    'APD': ['apd'],
    'Infrastruktur': ['infra'],
  };
  
  const activeTypes = formTypeMap[activeForm] || [];
  return activeTypes.includes(triggeredForm);
}   