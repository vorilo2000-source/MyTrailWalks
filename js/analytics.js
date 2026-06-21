// analytics.js v1.0.0
// MyTrailWalks — Supabase analytics tracker
// Tracks: page views, session duration, returning visitors

(function () {
  // ── Helpers ──────────────────────────────────────────────────────────────

  function getOrCreateSessionId() {
    let sid = sessionStorage.getItem('myw_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('myw_session_id', sid);
    }
    return sid;
  }

  function getPagePath() {
    return window.location.pathname + window.location.search;
  }

  // ── State ─────────────────────────────────────────────────────────────────

  let viewId = null;
  let enteredAt = new Date().toISOString();
  const sessionId = getOrCreateSessionId();
  const pagePath = getPagePath();

  // ── Insert page view on load ──────────────────────────────────────────────

  async function insertPageView() {
    // Wait for Supabase client (geladen via topbar-auth.js / auth.js)
    if (!window._supabase) return;

    const { data: { session } } = await window._supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const { data, error } = await window._supabase
      .from('page_views')
      .insert({
        page_path: pagePath,
        user_id: userId,
        session_id: sessionId,
        entered_at: enteredAt,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[analytics] insert fout:', error.message);
      return;
    }

    viewId = data.id;
  }

  // ── Update duration on page exit ─────────────────────────────────────────

  async function updateDuration() {
    if (!viewId || !window._supabase) return;

    const exitedAt = new Date().toISOString();
    const durationSeconds = Math.round(
      (new Date(exitedAt) - new Date(enteredAt)) / 1000
    );

    await window._supabase
      .from('page_views')
      .update({
        exited_at: exitedAt,
        duration_seconds: durationSeconds,
      })
      .eq('id', viewId);
  }

  // ── Visibility change — pagina verlaten of terugkomen ───────────────────

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      await updateDuration();
    }
  });

  // ── Beforeunload — fallback ───────────────────────────────────────────────

  window.addEventListener('beforeunload', () => {
    // Synchrone fallback via sendBeacon indien viewId beschikbaar
    if (!viewId || !window._supabase) return;
    updateDuration();
  });

  // ── Init ─────────────────────────────────────────────────────────────────

  // Wacht tot DOM + Supabase client klaar zijn
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertPageView);
  } else {
    insertPageView();
  }
})();
