// hooks/useActivityLogger.ts
"use client";

import { useCallback } from 'react';

interface LogActivityParams {
  activity_type: string;
  activity_category?: string;
  description?: string;
  page_url?: string;
  form_slug?: string;
  record_id?: string;
  metadata?: Record<string, any>;
}

export function useActivityLogger(userId: string | null) {
  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!userId) {
      console.warn('Cannot log activity: userId is null');
      return null;
    }

    try {
      const response = await fetch(`/api/activities/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          user_id: userId,
          page_url: params.page_url || window.location.href,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    }
  }, [userId]);

  const logPageView = useCallback(async (pageName?: string) => {
    return logActivity({
      activity_type: 'view_page',
      activity_category: 'navigation',
      description: `Viewed ${pageName || window.location.pathname}`,
      page_url: window.location.href,
    });
  }, [logActivity]);

  const logFormSubmit = useCallback(async (formSlug: string, description?: string) => {
    return logActivity({
      activity_type: 'form_submitted',
      activity_category: 'form',
      description: description || `Submitted form: ${formSlug}`,
      form_slug: formSlug,
    });
  }, [logActivity]);

  const logFormEdit = useCallback(async (formSlug: string, recordId: string, description?: string) => {
    return logActivity({
      activity_type: 'form_edited',
      activity_category: 'form',
      description: description || `Edited form: ${formSlug}`,
      form_slug: formSlug,
      record_id: recordId,
    });
  }, [logActivity]);

  const logLogin = useCallback(async () => {
    return logActivity({
      activity_type: 'login',
      activity_category: 'auth',
      description: 'User logged in',
    });
  }, [logActivity]);

  const logLogout = useCallback(async () => {
    return logActivity({
      activity_type: 'logout',
      activity_category: 'auth',
      description: 'User logged out',
    });
  }, [logActivity]);

  return {
    logActivity,
    logPageView,
    logFormSubmit,
    logFormEdit,
    logLogin,
    logLogout,
  };
}
