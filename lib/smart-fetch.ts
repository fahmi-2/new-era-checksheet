// lib/smart-fetch.ts
import { addToSyncQueue } from './offline-db';
import { generateQueueId } from './sync-manager';

function buildPayload(body: BodyInit | null | undefined): any {
  if (!body) return {};
  if (typeof body === 'string') return JSON.parse(body);
  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) return body;
  if (typeof body === 'object') return body;
  return {};
}

interface SmartFetchOptions extends RequestInit {
  queueType?: string;
  skipQueue?: boolean;
  metadata?: {
    areaType?: 'wanita' | 'general' | 'mixed';
    areaCode?: string;itemId?: string; 
  };
}

export async function smartFetch(url: string, options: SmartFetchOptions = {}) {
  const { queueType, skipQueue, metadata, ...fetchOptions } = options;
  const isOnline = navigator.onLine;

  const payload = buildPayload(fetchOptions.body);

  console.log('📤 [SmartFetch]', {
    url,
    method: fetchOptions.method,
    isOnline,
    queueType,
    areaType: metadata?.areaType,
    payloadKeys: Object.keys(payload).filter(k => k.startsWith('item_')).length,
    sampleKeys: Object.keys(payload).filter(k => k.startsWith('item_')).slice(0, 5),
  });

  if (isOnline) {
    try {
      const response = await fetch(url, fetchOptions);

      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => ({}));

      console.log('📥 [SmartFetch Response]', {
        status: response.status,
        ok: response.ok,
        success: responseData.success,
      });

      if (!response.ok && queueType && !skipQueue) {
        console.warn(`⚠️ [SmartFetch] HTTP ${response.status}, queue untuk retry`);
        await addToSyncQueue({
          queueId: generateQueueId(),
          type: queueType,
          endpoint: url,
          method: (fetchOptions.method as any) || 'POST',
          payload,
        });
      }

      return response;
    } catch (err: any) {
      if (queueType && !skipQueue) {
        console.warn(`⚠️ [SmartFetch] Network error, queue untuk retry`, err.message);
        await addToSyncQueue({
          queueId: generateQueueId(),
          type: queueType,
          endpoint: url,
          method: (fetchOptions.method as any) || 'POST',
          payload,
        });
      }
      throw err;
    }
  }

  if (queueType && !skipQueue) {
    console.log(`📴 [SmartFetch] Offline, queue: ${queueType}`, {
      areaType: metadata?.areaType,
      payloadItems: Object.keys(payload).filter(k => k.startsWith('item_')).length,
    });

    await addToSyncQueue({
      queueId: generateQueueId(),
      type: queueType,
      endpoint: url,
      method: (fetchOptions.method as any) || 'POST',
      payload,
    });

    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Data disimpan untuk sync saat online',
      queuedAt: Date.now(),
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  throw new Error('Offline dan tidak ada queueType');
}
