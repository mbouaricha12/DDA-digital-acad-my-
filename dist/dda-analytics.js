(function () {
  'use strict';

  /*
   * DDA Acquisition V1 — analytics adapter.
   *
   * This file is the ONLY place in the product that knows PostHog exists.
   * dda-core.js and the rest of app.js never reference it — they call the
   * generic DDAAnalytics.send(name, props) below, which this file may swap
   * for a different vendor, a custom endpoint, or nothing at all, without any
   * other file changing. If this script fails to load entirely, the rest of
   * the product must keep working exactly as before (window.DDAAnalytics
   * simply won't exist, and every call site already guards for that).
   *
   * Data minimization (CEO decision): only a locally generated pseudonymous
   * visitorId and acquisition-funnel metadata ever leave the device — never
   * email, name, identity, trading data or pedagogical answers. This is
   * enforced twice: (1) only events in FORWARDABLE_EVENTS are ever sent
   * externally at all — most local product-analytics events (quiz_attempt,
   * journal_*, profile_updated, preference_updated, …) are dropped before
   * they reach this file's transport step; (2) even for a forwarded event,
   * only keys in SAFE_PROP_KEYS are kept, everything else is stripped.
   *
   * PostHog project key is intentionally NOT hardcoded here. Set
   * window.DDA_ANALYTICS_CONFIG = { posthogKey: '...', posthogHost: '...' }
   * (e.g. in index.html, before this script tag) once a real project exists.
   * Until then this adapter runs in "debug" transport: nothing leaves the
   * device, but every would-be-forwarded event is recorded in
   * DDAAnalytics.getDebugQueue() so the funnel can be verified end-to-end
   * (including by the automated tests) before any real key is configured.
   */

  // Local DDA event name -> external analytics event name. Only these events
  // are ever forwarded; anything not listed here is a local product-analytics
  // event and stays on-device.
  const FORWARDABLE_EVENTS = {
    landing_visit: 'landing_visit',
    onboarding_complete: 'dda_signup',
    broker_selected: 'broker_selected',
    affiliate_link_click: 'affiliate_link_click',
    activation_v1: 'activation_v1'
  };

  // Metadata keys allowed to leave the device. `level`/`goal` are deliberately
  // absent (CEO decision) even though onboarding_complete carries them locally.
  const SAFE_PROP_KEYS = ['source', 'medium', 'campaign', 'referrer', 'step', 'broker'];

  const DEBUG_QUEUE_LIMIT = 200;
  const debugQueue = [];
  let transport = 'debug';
  let initAttempted = false;

  function config() {
    return (typeof window !== 'undefined' && window.DDA_ANALYTICS_CONFIG) || {};
  }

  function pushDebug(entry) {
    debugQueue.push(entry);
    if (debugQueue.length > DEBUG_QUEUE_LIMIT) debugQueue.shift();
  }

  function safeProps(props) {
    const out = {};
    Object.entries(props || {}).forEach(([key, value]) => {
      if (SAFE_PROP_KEYS.includes(key) && value !== undefined && value !== null && value !== '') {
        out[key] = String(value).slice(0, 120);
      }
    });
    return out;
  }

  // Lazy, best-effort load of posthog-js. Never throws, never blocks the app.
  function loadPosthogScript(host) {
    return new Promise(resolve => {
      try {
        const script = document.createElement('script');
        script.src = `${host.replace(/\/$/, '')}/static/array.js`;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      } catch {
        resolve(false);
      }
    });
  }

  async function init() {
    if (initAttempted) return;
    initAttempted = true;
    const { posthogKey, posthogHost } = config();
    if (!posthogKey) return; // stays in 'debug' transport until a real key is provided
    try {
      const host = posthogHost || 'https://us.i.posthog.com';
      const loaded = await loadPosthogScript(host);
      if (loaded && typeof window.posthog !== 'undefined' && typeof window.posthog.init === 'function') {
        window.posthog.init(posthogKey, {
          api_host: host,
          autocapture: false, // acquisition funnel only — never auto-tracks clicks/pageviews/forms
          capture_pageview: false,
          disable_session_recording: true
        });
        transport = 'posthog';
      }
    } catch {
      transport = 'debug'; // analytics must never break the product
    }
  }

  function send(name, props) {
    const externalName = FORWARDABLE_EVENTS[name];
    const entry = { at: new Date().toISOString(), localName: name, externalName: externalName || null, sent: false };
    if (!externalName) {
      pushDebug(entry);
      return;
    }
    const props_ = safeProps(props);
    const distinctId = props && props.visitorId ? String(props.visitorId).slice(0, 60) : undefined;
    entry.props = props_;
    entry.distinctId = distinctId;
    try {
      if (transport === 'posthog' && typeof window.posthog !== 'undefined' && distinctId) {
        window.posthog.identify(distinctId);
        window.posthog.capture(externalName, props_);
        entry.sent = true;
      }
    } catch {
      // never let an analytics failure break the product
    }
    pushDebug(entry);
  }

  window.DDAAnalytics = Object.freeze({
    init,
    send,
    getDebugQueue() { return debugQueue.slice(); },
    getTransport() { return transport; }
  });

  init();
})();
