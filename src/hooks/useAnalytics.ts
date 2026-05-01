import { useRef, useEffect, useCallback } from "react";

declare global {
  interface Window {
    __analytics_page_enter_ts?: number;
  }
}

const API_BASE_URL = import.meta.env.VITE_ASSESSMENT_API_URL || "";

export interface AnalyticsEvent {
  ts: number;
  event_name: string;
  page_url?: string;
  route?: string;
  page_title?: string;
  event_props?: Record<string, unknown>;
  time_on_page_ms?: number;
}

interface AnalyticsBatch {
  user_id?: string;
  anon_id?: string;
  session_id: string;
  events: AnalyticsEvent[];
}

interface UseAnalyticsOptions {
  userId?: string | undefined;
  isEnabled?: boolean;
}

function readConsentCookie(): boolean {
  try {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [k, v] = c.split("=").map((s) => s.trim());
      if (k === "analytics_consent") return v === "granted";
    }
  } catch {
    // ignore
  }
  return false;
}

export function useAnalytics({ userId, isEnabled = true }: UseAnalyticsOptions) {
  const bufferRef = useRef<AnalyticsEvent[]>([]);
  const sessionIdRef = useRef<string>(
    sessionStorage.getItem("analytics_session_id") || crypto.randomUUID(),
  );

  useEffect(() => {
    // Persist session id for this tab
    try {
      sessionStorage.setItem("analytics_session_id", sessionIdRef.current);
    } catch {
      // ignore
    }
  }, []);

  // Anonymous id persisted across sessions
  const anonIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (anonIdRef.current !== null) return;
    try {
      let a = localStorage.getItem("analytics_anon_id");
      if (!a) {
        a = crypto.randomUUID();
        localStorage.setItem("analytics_anon_id", a);
      }
      anonIdRef.current = a;
    } catch {
      anonIdRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (!isEnabled || !readConsentCookie()) return;
    if (bufferRef.current.length === 0) return;

    const events = bufferRef.current.splice(0);
    const payload: AnalyticsBatch = {
      user_id: userId,
      anon_id: anonIdRef.current ?? undefined,
      session_id: sessionIdRef.current,
      events,
    };

    // Fire-and-forget
    fetch(`${API_BASE_URL}/api/v1/analytics/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // swallow — non-blocking telemetry
    });
  }, [isEnabled, userId]);

  // Periodic flush and flush on unload/visibilitychange
  useEffect(() => {
    if (!isEnabled) return;
    const interval = setInterval(flush, 15_000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = () => flush();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
    };
  }, [flush, isEnabled]);

  // Automatic click delegation for elements with data-analytics
  useEffect(() => {
    if (!isEnabled) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest && (target.closest("[data-analytics]") as HTMLElement | null);
      if (!el) return;
      const attr = el.getAttribute("data-analytics");
      if (!attr) return;
      // Attribute format: "event:cta_signup" or "cta:signup"
      const parts = attr.split(":");
      const name = parts.length > 1 ? parts[1] : parts[0];
      trackEvent(name || "cta_click", { label: el.innerText?.slice(0, 200) }, true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const trackEvent = useCallback(
    (event_name: string, event_props?: Record<string, unknown>, immediate = false) => {
      if (!isEnabled || !readConsentCookie()) return;
      const evt: AnalyticsEvent = {
        ts: Date.now(),
        event_name,
        page_url: window.location.href,
        route: window.location.pathname,
        page_title: document.title,
        event_props,
      };

      if (immediate) {
        const payload: AnalyticsBatch = {
          user_id: userId,
          anon_id: anonIdRef.current ?? undefined,
          session_id: sessionIdRef.current,
          events: [evt],
        };
        // Fire-and-forget
        fetch(`${API_BASE_URL}/api/v1/analytics/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
        return;
      }

      bufferRef.current.push(evt);
    },
    [isEnabled, userId],
  );

  const trackPageView = useCallback(
    (props?: Record<string, unknown>) => {
      // page view is immediate
      trackEvent("page_view", props, true);
    },
    [trackEvent],
  );

  // Time on page helper - call when leaving
  const trackTimeOnPage = useCallback(() => {
    if (!isEnabled || !readConsentCookie()) return;
    const start = window.__analytics_page_enter_ts || Date.now();
    const duration = Date.now() - start;
    trackEvent("time_on_page", { time_on_page_ms: duration }, true);
  }, [isEnabled, trackEvent]);

  // Mark page enter ts for time on page; update on route changes if callers call trackPageView
  useEffect(() => {
    window.__analytics_page_enter_ts = Date.now();
    return () => {
      trackTimeOnPage();
    };
  }, [trackTimeOnPage]);

  return { trackEvent, trackPageView, flush };
}

export default useAnalytics;
