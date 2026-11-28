(function () {
  'use strict';

  // DDA privacy-first consent gate. Optional Google tags and PostHog remain
  // disabled until the visitor explicitly opts in.
  const GTM_ID = 'GTM-TRR25PJT';
  const CONSENT_KEY = 'dda-consent-v1';
  const CONSENT_VERSION = 1;
  const hasDocument = typeof document !== 'undefined';
  if (!hasDocument) return;

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      if (!value || value.version !== CONSENT_VERSION) return null;
      const savedAt = Date.parse(typeof value.updatedAt === 'string' ? value.updatedAt : '');
      if (!savedAt || Date.now() - savedAt > 180 * 24 * 60 * 60 * 1000) return null;
      return {
        necessary: true,
        analytics: value.analytics === true,
        marketing: value.marketing === true,
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
      };
    } catch (_) {
      return null;
    }
  }

  let consent = readConsent();
  let gtmLoaded = !!document.querySelector('script[data-dda-gtm]');
  let googleConsentInitialized = false;
  let panel;

  function consentPayload() {
    return {
      necessary: true,
      analytics: !!(consent && consent.analytics),
      marketing: !!(consent && consent.marketing)
    };
  }

  function setGoogleConsent() {
    if (!window.dataLayer) window.dataLayer = [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!googleConsentInitialized) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500
      });
      googleConsentInitialized = true;
    }
    window.gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied'
    });
  }

  function loadGtmIfAllowed() {
    if (!consent || (!consent.analytics && !consent.marketing)) return;
    setGoogleConsent();
    // Browser regression tests seed an explicit analytics choice but must not
    // contact the live GTM container or send production traffic.
    if (window.__DDA_TEST_MODE__) return;
    if (gtmLoaded) return;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    script.setAttribute('data-dda-gtm', 'true');
    script.onerror = function () {
      script.remove();
      gtmLoaded = false;
    };
    (document.head || document.documentElement).appendChild(script);
    gtmLoaded = true;
  }

  function applyConsent() {
    if (consent) {
      try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
          version: CONSENT_VERSION,
          analytics: consent.analytics,
          marketing: consent.marketing,
          updatedAt: consent.updatedAt || new Date().toISOString()
        }));
      } catch (_) {}
    }
    if (consent && (consent.analytics || consent.marketing)) {
      loadGtmIfAllowed();
    } else if (gtmLoaded && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    if (window.DDAAnalytics && typeof window.DDAAnalytics.setConsent === 'function') {
      window.DDAAnalytics.setConsent(!!(consent && consent.analytics));
    }
    window.dispatchEvent(new CustomEvent('dda:consent-changed', { detail: consentPayload() }));
    if (panel) {
      panel.hidden = true;
      const banner = panel.closest('.dda-consent-banner');
      if (banner) banner.hidden = true;
    }
  }

  function mount() {
    if (document.getElementById('dda-consent-root')) return;
    const root = document.createElement('section');
    root.id = 'dda-consent-root';
    root.className = 'dda-consent-root';
    root.innerHTML =
      '<div class="dda-consent-banner" role="region" aria-label="Préférences de confidentialité" aria-live="polite">' +
        '<div class="dda-consent-copy"><span class="dda-consent-kicker">VOTRE CONFIDENTIALITÉ</span>' +
          '<h2>Vous gardez le contrôle de vos données.</h2>' +
          '<p>DDA utilise des outils facultatifs pour comprendre les visites et améliorer la plateforme. La mesure d’audience et le marketing peuvent être acceptés séparément ; les balises correspondantes restent désactivées sans votre choix.</p>' +
          '<a href="/cookies/">En savoir plus sur les cookies</a>' +
        '</div>' +
        '<div class="dda-consent-actions">' +
          '<button type="button" class="dda-consent-button dda-consent-button--quiet" data-consent="reject">Tout refuser</button>' +
          '<button type="button" class="dda-consent-button dda-consent-button--quiet" data-consent="settings">Personnaliser</button>' +
          '<button type="button" class="dda-consent-button dda-consent-button--primary" data-consent="accept">Tout accepter</button>' +
        '</div>' +
        '<div class="dda-consent-settings" hidden>' +
          '<h3>Choisissez vos préférences</h3>' +
          '<p>Les éléments strictement nécessaires au fonctionnement de DDA restent actifs. Les autres catégories sont facultatives.</p>' +
          '<label class="dda-consent-option"><input type="checkbox" checked disabled><span><strong>Nécessaires</strong><small>Fonctionnement, sécurité et mémorisation de votre choix.</small></span><em>Toujours actifs</em></label>' +
          '<label class="dda-consent-option"><input type="checkbox" data-consent-analytics><span><strong>Mesure d’audience</strong><small>Google Analytics via GTM et mesure produit PostHog.</small></span></label>' +
          '<label class="dda-consent-option"><input type="checkbox" data-consent-marketing><span><strong>Marketing</strong><small>Balises publicitaires éventuelles configurées dans Google Tag Manager.</small></span></label>' +
          '<div class="dda-consent-actions dda-consent-settings-actions"><button type="button" class="dda-consent-button dda-consent-button--quiet" data-consent="reject">Tout refuser</button><button type="button" class="dda-consent-button dda-consent-button--primary" data-consent="save">Enregistrer mes choix</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    panel = root.querySelector('.dda-consent-settings');

    root.addEventListener('click', function (event) {
      const button = event.target.closest('[data-consent]');
      if (!button) return;
      const action = button.getAttribute('data-consent');
      if (action === 'settings') {
        panel.hidden = false;
        const analytics = root.querySelector('[data-consent-analytics]');
        const marketing = root.querySelector('[data-consent-marketing]');
        analytics.checked = !!(consent && consent.analytics);
        marketing.checked = !!(consent && consent.marketing);
        analytics.focus();
        return;
      }
      if (action === 'reject') {
        consent = { necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
      } else if (action === 'accept') {
        consent = { necessary: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() };
      } else if (action === 'save') {
        consent = {
          necessary: true,
          analytics: !!root.querySelector('[data-consent-analytics]').checked,
          marketing: !!root.querySelector('[data-consent-marketing]').checked,
          updatedAt: new Date().toISOString()
        };
      }
      applyConsent();
    });

    if (!consent) root.querySelector('.dda-consent-banner').hidden = false;
    else root.querySelector('.dda-consent-banner').hidden = true;
  }

  function openPreferences(event) {
    if (event) event.preventDefault();
    if (!document.getElementById('dda-consent-root')) mount();
    const banner = document.querySelector('#dda-consent-root .dda-consent-banner');
    const settings = document.querySelector('#dda-consent-root .dda-consent-settings');
    banner.hidden = false;
    settings.hidden = false;
    const analytics = document.querySelector('[data-consent-analytics]');
    const marketing = document.querySelector('[data-consent-marketing]');
    analytics.checked = !!(consent && consent.analytics);
    marketing.checked = !!(consent && consent.marketing);
    analytics.focus();
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-dda-open-consent]');
    if (trigger) openPreferences(event);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else initialize();

  function initialize() {
    mount();
    if (consent) {
      loadGtmIfAllowed();
      if (window.DDAAnalytics && typeof window.DDAAnalytics.setConsent === 'function') {
        window.DDAAnalytics.setConsent(consent.analytics);
      }
    }
  }

  window.DDAConsent = Object.freeze({
    open: openPreferences,
    get: consentPayload,
    version: CONSENT_VERSION
  });
})();
