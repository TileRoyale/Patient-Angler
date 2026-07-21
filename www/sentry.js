// ─── Sentry Crash Logging ─────────────────────────────────────────────────────
// 1. Create a free account at https://sentry.io
// 2. New Project → JavaScript (Browser)
// 3. Replace SENTRY_DSN below with your actual DSN
// 4. Done — all JS errors will appear in your Sentry dashboard

const SENTRY_DSN = 'https://97476106dd8bed706f08c624e9262fc5@o4511771516010496.ingest.de.sentry.io/4511771523612752';

(function initSentry() {
  if (typeof Sentry === 'undefined') {
    console.warn('[Sentry] Bundle not loaded — crash logging disabled');
    return;
  }
  if (!SENTRY_DSN || SENTRY_DSN === 'YOUR_SENTRY_DSN_HERE') {
    console.warn('[Sentry] DSN not set — crash logging disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Tag each error with the game version so you can filter by release
    release: typeof GAME_VERSION !== 'undefined' ? 'patient-angler@' + GAME_VERSION : undefined,

    // Don't flood Sentry during heavy play — sample 100% of errors (change to 0.5 if needed)
    sampleRate: 1.0,

    // Add game context to every error report
    beforeSend(event) {
      try {
        // Game state context — read at the moment the error occurs
        if (typeof G !== 'undefined') {
          event.contexts = event.contexts || {};
          event.contexts.game = {
            zone:          G.currentZone   || 'unknown',
            coins:         G.coins         || 0,
            prestige:      G.prestigeCount || 0,
            blackPearls:   G.blackPearls   || 0,
            rod:           G.currentRod    || 'unknown',
            autoRunning:   !!G.autoRunning,
          };
        }
        // Auth context — is the player signed in?
        if (typeof isSignedIn === 'function') {
          event.user = { id: typeof getCurrentUser === 'function' && getCurrentUser()?.uid };
        }
      } catch (_) { /* don't let context collection crash the crash reporter */ }
      return event;
    },

    // Ignore non-actionable browser noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed',
      'Non-Error promise rejection captured',
      /^Script error\.?$/,
      /Loading chunk \d+ failed/,
    ],
  });

  console.log('[Sentry] Crash logging active —', typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'version unknown');
})();
