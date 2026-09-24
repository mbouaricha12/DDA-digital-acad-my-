(function () {
  'use strict';

  const FORWARDABLE_EVENTS = {
    landing_visit: 'landing_visit',
    onboarding_complete: 'dda_signup',
    broker_selected: 'broker_selected',
    affiliate_link_click: 'affiliate_link_click',
    activation_v1: 'activation_v1'
  };
  const SAFE_PROP_KEYS = ['source', 'medium', 'campaign', 'referrer', 'step', 'broker'];
  const DEBUG_QUEUE_LIMIT = 200;
  const debugQueue = [];
  let transport = 'debug';
  let initAttempted = false;

  function config() { return (typeof window !== 'undefined' && window.DDA_ANALYTICS_CONFIG) || {}; }
  function pushDebug(entry) { debugQueue.push(entry); if (debugQueue.length > DEBUG_QUEUE_LIMIT) debugQueue.shift(); }
  function safeProps(props) {
    const out = {};
    Object.entries(props || {}).forEach(([key, value]) => {
      if (SAFE_PROP_KEYS.includes(key) && value !== undefined && value !== null && value !== '') out[key] = String(value).slice(0, 120);
    });
    return out;
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
    const distinctId = props && props.visitorId ? String(props.visitorId).slice(0, 60) : undefined;
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
