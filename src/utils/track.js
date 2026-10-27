// Anonymous visit tracking for the owner's Visitors page: a random per-tab id plus the page path.
// No cookies, no personal details. The owner's own browser (flagged at admin login) is never counted.
const SESSION_KEY = 'twd-session';
export const OWNER_KEY = 'twd-owner';

let fallbackId = null;

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: still group events within this page load.
    fallbackId ??= Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    return fallbackId;
  }
}

function isOwner() {
  try {
    return localStorage.getItem(OWNER_KEY) === '1';
  } catch {
    return false;
  }
}

// type: 'view' | 'booking_done' | 'enquiry_done'. Never throws and never blocks the page.
export function trackEvent(type, path = window.location.pathname) {
  if (isOwner() || path.startsWith('/admin')) return;
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type,
        path,
        session: sessionId(),
        referrer: document.referrer,
        host: window.location.hostname,
        device: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
      }),
    }).catch(() => {});
  } catch {
    // Tracking is best-effort.
  }
}
