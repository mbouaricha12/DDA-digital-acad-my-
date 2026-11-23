(function () {
  'use strict';

  const FORWARDABLE_EVENTS = {
    landing_visit: 'landing_visit',
    landing_viewed: 'landing_viewed',
    landing_section_reached: 'landing_section_reached',
    hero_cta_click: 'landing_cta_clicked',
    landing_cta_hero: 'landing_cta_clicked',
    landing_cta_differentiation: 'landing_cta_clicked',
    landing_cta_free: 'landing_cta_clicked',
    landing_cta_final: 'landing_cta_clicked',
    landing_cta_mobile_sticky: 'landing_cta_clicked',
    // DDA Funnel Audit (2026-11): these 4 CTAs (the "Découvrir le parcours
    // Free" guide link, "Découvrir le Terminal DDA", the Lab section's CTA,
    // and "Accéder à la bibliothèque complète") carry the same
    // data-analytics/data-funnel-position wiring as every other tracked
    // landing CTA (see dist/public.js's generic [data-view] click handler)
    // but were never added to EVENT_NAMES in dda-core.js — DDA.track()
    // silently drops any event not in that allowlist, so every click on
    // these 4 buttons was being recorded nowhere, not even locally.
    landing_cta_free_guide: 'landing_cta_clicked',
    landing_cta_product: 'landing_cta_clicked',
    landing_cta_lab: 'landing_cta_clicked',
    landing_cta_resources: 'landing_cta_clicked',
    // Homepage commercial visibility (2026-11-23): distinct external name
    // (not 'landing_cta_clicked') so a Premium click is countable on its own,
    // separately from every Free-path CTA that shares that bucket.
    hero_premium_cta_click: 'premium_cta_clicked',
    landing_cta_premium: 'premium_cta_clicked',
    // Renamed from the legacy external name 'dda_signup' (Lot H) to match
    // the DDA Product & Conversion Alignment Audit's event dictionary —
    // same local event, same data, only the name sent to PostHog changes.
    onboarding_complete: 'onboarding_completed',
    lesson_started: 'lesson_started',
    broker_selected: 'broker_selected',
    affiliate_link_click: 'affiliate_link_click',
    activation_v1: 'activation_v1',
    // DDA_Directive_Landing_Test_350USD_V1 §2/§6 — the primary and quality
    // conversions it asks to measure before any ad spend. signup_started and
    // signup_completed already fired locally (app.js) but were never in this
    // map, so they never left the local debug queue; quiz_complete is the
    // app's real lesson-completion signal (fired with metadata.lesson), kept
    // under its own internal name but forwarded externally as
    // lesson_completed since that is the name the directive's measurement
    // plan and any dashboard built from it will look for.
    signup_started: 'signup_started',
    signup_completed: 'signup_completed',
    quiz_complete: 'lesson_completed',
    // Revenue & Activation (2026-11), Phase 6 — the Premium funnel's first
    // three steps (visit → CTA click → checkout start) were trackEvent()
    // calls that already fired locally but, like signup_started/completed
    // before this map picked them up, never left the local debug queue.
    // view_opened already fires for every real navigation with a `view`
    // property already restricted to the SAFE_PROP_VALUES.view allowlist
    // below (which includes 'membership') — forwarding it costs nothing new,
    // it only lets through what was already deliberately allow-listed.
    // Payment success/failure and activation are tracked server-side
    // instead (bff/src/chariow.js's handleChariowPulse -> trackServerEvent),
    // since that is the only place a webhook's outcome is genuinely known.
    view_opened: 'view_opened',
    premium_subscribe_cta_clicked: 'premium_subscribe_cta_clicked',
    premium_checkout_started: 'premium_checkout_started',
    // DDA Funnel Audit (2026-11) — the rest of the Premium funnel (pre- and
    // post-purchase) was already tracked locally (EVENT_NAMES in
    // dda-core.js) but, like signup_started/completed and the Phase 6 trio
    // above before this map picked them up, never left the local debug
    // queue: Premium page views, module starts and waitlist signups (the
    // pre-purchase signals), plus the Lab/assessment/weekly-review/
    // progress-card-share events that measure activation and retention
    // AFTER purchase — exactly the funnel stages this audit asks to make
    // measurable end to end. Their free-text metadata (proof/module/lab/
    // assessment/skill/nextAction) is not in SAFE_PROP_KEYS below and is
    // deliberately left out rather than allow-listing every value by hand;
    // only the event itself (with distinct_id) needs to reach PostHog for
    // these to be countable.
    premium_track_viewed: 'premium_track_viewed',
    premium_module_started: 'premium_module_started',
    premium_waitlist_joined: 'premium_waitlist_joined',
    premium_lab_attempted: 'premium_lab_attempted',
    premium_lab_validated: 'premium_lab_validated',
    premium_assessment_completed: 'premium_assessment_completed',
    premium_proof_created: 'premium_proof_created',
    premium_review_opened: 'premium_review_opened',
    premium_weekly_review_completed: 'premium_weekly_review_completed',
    progress_card_shared: 'progress_card_shared'
  };
  const SAFE_PROP_KEYS = ['source', 'medium', 'campaign', 'content', 'referrer', 'broker', 'section', 'position', 'view', 'lesson'];
  const SAFE_PROP_VALUES = {
    broker: new Set(['Deriv', 'HFM', 'Weltrade', 'XM']),
    section: new Set(['differentiation', 'free']),
    position: new Set(['differentiation', 'final', 'free', 'hero', 'mobile_sticky', 'product', 'lab', 'resources']),
    view: new Set(['landing', 'access', 'dashboard', 'path', 'lesson', 'lesson-m02', 'lesson-m03', 'lesson-m11', 'lesson-m12', 'lesson-m13', 'lesson-mbrvm1', 'progress', 'journal', 'resources', 'membership', 'markets', 'brokers', 'support', 'community', 'practice', 'intelligence', 'profile', 'back']),
    lesson: new Set(['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3', 'MBRVM.1', 'P2.1', 'P2.2', 'LAB1', 'LAB2', 'LAB3', 'LAB4', 'LABCAP'])
  };
  const SAFE_ATTRIBUTION_VALUES = {
    source: new Set(['newsletter', 'youtube', 'facebook', 'instagram', 'linkedin', 'tiktok', 'google', 'bing', 'direct', 'partner', 'whatsapp', 'telegram', 'community', 'x']),
    medium: new Set(['email', 'video', 'social', 'cpc', 'paid', 'organic', 'referral', 'newsletter', 'paid-social', 'paid_search']),
    campaign: new Set(['launch', 'launch-2026', 'launch-2026-09-27', 'm0-launch', 'retarget', 'private-alpha', 'private-alpha-launch', 'private-alpha-2026', 'landing-test-2026-10']),
    content: new Set(['echange', 'risque', 'progression'])
  };
  const DEBUG_QUEUE_LIMIT = 200;
  const DEBUG_QUEUE_KEY = 'dda-analytics-debug-v1';
  let debugQueue = [];
  try {
    const persisted = JSON.parse(localStorage.getItem(DEBUG_QUEUE_KEY) || '[]');
    if (Array.isArray(persisted)) debugQueue = persisted.slice(-DEBUG_QUEUE_LIMIT);
  } catch {}
  let transport = 'debug';
  let initAttempted = false;

  function config() { return (typeof window !== 'undefined' && window.DDA_ANALYTICS_CONFIG) || {}; }
  function pushDebug(entry) {
    debugQueue.push(entry);
    if (debugQueue.length > DEBUG_QUEUE_LIMIT) debugQueue = debugQueue.slice(-DEBUG_QUEUE_LIMIT);
    try { localStorage.setItem(DEBUG_QUEUE_KEY, JSON.stringify(debugQueue)); } catch {}
  }
  function safeAttributionValue(key, value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return null;
    if (key === 'referrer') {
      try {
        const url = new URL(text);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.origin.slice(0, 120);
      } catch {
        return null;
      }
    }
    if (!SAFE_ATTRIBUTION_VALUES[key]?.has(text)) return null;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) return null;
    const withoutDates = text.replace(/\b(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])\b/g, '');
    if ((withoutDates.match(/\d/g) || []).length >= 8) return null;
    return text.slice(0, 120);
  }
  function safeProps(props) {
    const out = {};
    Object.entries(props || {}).forEach(([key, value]) => {
      if (!SAFE_PROP_KEYS.includes(key) || value === undefined || value === null || value === '') return;
      const safeValue = ['source', 'medium', 'campaign', 'content', 'referrer'].includes(key)
        ? safeAttributionValue(key, value)
        : SAFE_PROP_VALUES[key]?.has(String(value).trim()) ? String(value).trim() : null;
      if (safeValue) out[key] = safeValue;
    });
    return out;
  }
  function safeVisitorId(value) {
    const text = String(value ?? '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
      || /^visitor-\d{10,16}-\d{1,7}$/.test(text) ? text : undefined;
  }
  function loadPosthogScript(host) {
    return new Promise(resolve => {
      try {
        const script = document.createElement('script');
        script.src = `${host.replace(/\/$/, '')}/static/array.js`;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      } catch { resolve(false); }
    });
  }
  // Pre-launch funnel audit (2026-11): window.DDA_ANALYTICS_CONFIG was read
  // here but nothing in the static dist/ bundle ever set it -- there is no
  // build step to inject a key into static HTML. The BFF already holds
  // POSTHOG_API_KEY server-side (bff/src/analytics.js) for webhook events;
  // this fetches that same public/client-safe capture key at runtime
  // instead of requiring one to be hardcoded or templated in. No key
  // configured yet -> this returns `posthogKey: null` and stays in 'debug'
  // transport, exactly as before.
  async function fetchRemoteConfig() {
    const base = String((typeof window !== 'undefined' && window.DDA_BFF_BASE_URL) || '').trim().replace(/\/+$/, '');
    if (!base) return null;
    try {
      const response = await fetch(`${base}/v1/analytics/config`, { credentials: 'omit' });
      if (!response.ok) return null;
      const data = await response.json();
      return data && typeof data === 'object' ? data : null;
    } catch { return null; }
  }
  async function init() {
    if (initAttempted) return;
    initAttempted = true;
    let { posthogKey, posthogHost } = config();
    if (!posthogKey) {
      const remote = await fetchRemoteConfig();
      if (remote && remote.posthogKey) {
        posthogKey = remote.posthogKey;
        posthogHost = remote.posthogHost || posthogHost;
      }
    }
    if (!posthogKey) return;
    try {
      const host = posthogHost || 'https://us.i.posthog.com';
      const loaded = await loadPosthogScript(host);
      if (loaded && typeof window.posthog !== 'undefined' && typeof window.posthog.init === 'function') {
        window.posthog.init(posthogKey, { api_host: host, autocapture: false, capture_pageview: false, disable_session_recording: true });
        transport = 'posthog';
      }
    } catch { transport = 'debug'; }
  }
  function send(name, props) {
    const externalName = FORWARDABLE_EVENTS[name];
    const entry = { at: new Date().toISOString(), localName: name, externalName: externalName || null, sent: false };
    if (!externalName) { pushDebug(entry); return; }
    const props_ = safeProps(props);
    const distinctId = safeVisitorId(props && props.visitorId);
    entry.props = props_;
    entry.distinctId = distinctId;
    try {
      if (transport === 'posthog' && typeof window.posthog !== 'undefined' && distinctId) {
        window.posthog.identify(distinctId);
        window.posthog.capture(externalName, props_);
        entry.sent = true;
      }
    } catch {}
    pushDebug(entry);
  }
  window.DDAAnalytics = Object.freeze({ init, send, getDebugQueue() { return debugQueue.slice(); }, getTransport() { return transport; } });
  init();
})();
