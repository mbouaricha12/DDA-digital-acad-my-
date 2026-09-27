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
    onboarding_complete: 'dda_signup',
    broker_selected: 'broker_selected',
    affiliate_link_click: 'affiliate_link_click',
    activation_v1: 'activation_v1'
  };
  const SAFE_PROP_KEYS = ['source', 'medium', 'campaign', 'referrer', 'broker', 'section', 'position', 'view'];
  const SAFE_PROP_VALUES = {
    broker: new Set(['Deriv', 'HFM', 'Weltrade', 'XM']),
    section: new Set(['differentiation', 'free']),
    position: new Set(['differentiation', 'final', 'free', 'hero', 'mobile_sticky']),
    view: new Set(['landing', 'access', 'dashboard', 'path', 'lesson', 'lesson-m02', 'lesson-m03', 'lesson-m11', 'lesson-m12', 'lesson-m13', 'progress', 'journal', 'resources', 'membership', 'markets', 'brokers', 'support', 'community', 'practice', 'intelligence', 'profile', 'back'])
  };
  const SAFE_ATTRIBUTION_VALUES = {
    source: new Set(['newsletter', 'youtube', 'facebook', 'instagram', 'linkedin', 'tiktok', 'google', 'bing', 'direct', 'partner', 'whatsapp', 'telegram', 'community', 'x']),
    medium: new Set(['email', 'video', 'social', 'cpc', 'paid', 'organic', 'referral', 'newsletter', 'paid-social', 'paid_search']),
    campaign: new Set(['launch', 'launch-2026', 'launch-2026-09-27', 'm0-launch', 'retarget', 'private-alpha', 'private-alpha-launch', 'private-alpha-2026'])
  };
  const DEBUG_QUEUE_LIMIT = 200;
  const debugQueue = [];
  let transport = 'debug';
  let initAttempted = false;

  function config() { return (typeof window !== 'undefined' && window.DDA_ANALYTICS_CONFIG) || {}; }
  function pushDebug(entry) { debugQueue.push(entry); if (debugQueue.length > DEBUG_QUEUE_LIMIT) debugQueue.shift(); }
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
      const safeValue = ['source', 'medium', 'campaign', 'referrer'].includes(key)
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
  async function init() {
    if (initAttempted) return;
    initAttempted = true;
    const { posthogKey, posthogHost } = config();
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
