// hooks/useUserPresence.ts
"use client";

import { useEffect, useRef, useCallback } from 'react';

interface UseUserPresenceOptions {
  userId: string | null;
  enabled?: boolean;
  heartbeatInterval?: number; // in milliseconds
}

export function useUserPresence({
  userId,
  enabled = true,
  heartbeatInterval = 30000, // 30 seconds default
}: UseUserPresenceOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      const response = await fetch('/api/users/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();
      if (data.success) {
        isOnlineRef.current = true;
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      isOnlineRef.current = false;
    }
  }, [userId, enabled]);

  const setOffline = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      await fetch('/api/users/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId, 
          is_online: false 
        }),
      });
    } catch (error) {
      console.error('Failed to set offline:', error);
    }
  }, [userId, enabled]);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up periodic heartbeat
    intervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);

    // Handle page unload - set user as offline
    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/users/heartbeat',
          JSON.stringify({ user_id: userId, is_online: false })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set offline on cleanup
      setOffline();
    };
  }, [userId, enabled, heartbeatInterval, sendHeartbeat, setOffline]);

  return {
    isOnline: isOnlineRef.current,
    sendHeartbeat,
    setOffline,
  };
}
