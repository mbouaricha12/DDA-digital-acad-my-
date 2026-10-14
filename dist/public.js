/* DDA Public Website shell — deliberately independent from the learner Academy runtime. */
(() => {
  'use strict';
  const landing = document.getElementById('landing');
  if (!landing) return;
  const bootRoute = location.hash.slice(1);
  if (bootRoute && bootRoute !== 'landing') { window.location.replace(`./academy.html#${encodeURIComponent(bootRoute)}`); return; }
  landing.classList.add('active');
  document.body.classList.add('public-shell');

  const initialAttribution = window.DDA_INITIAL_ATTRIBUTION || {};
  const route = '#landing';
  try {
    const state = window.DDA.load();
    window.DDA.save({ ...state, acquisition: window.DDA.captureAcquisition(state, {
      source: initialAttribution.source,
      medium: initialAttribution.medium,
      campaign: initialAttribution.campaign,
      referrer: document.referrer,
      landingPath: route
    }).acquisition });
  } catch (_) { /* public communication remains available in private mode */ }
  if (location.search) history.replaceState(history.state, '', location.pathname + location.hash);

  function track(name, metadata = {}) {
    try {
      const state = window.DDA.load();
      const next = window.DDA.track(state, name, metadata);
      window.DDA.save(next);
      window.DDAAnalytics?.send(name, { ...metadata, visitorId: next.acquisition?.visitorId });
    } catch (_) { /* analytics never blocks the public site */ }
  }
  track('landing_viewed', {});
  const capturedAcquisition = window.DDA.load().acquisition || {};
  track('landing_visit', {
    source: capturedAcquisition.source,
    medium: capturedAcquisition.medium,
    campaign: capturedAcquisition.campaign,
    referrer: capturedAcquisition.referrer
  });

  const destination = (view) => view === 'landing' ? './index.html#landing' : `./academy.html#${encodeURIComponent(view)}`;
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.view || 'landing';
    const event = button.dataset.analytics;
    if (event) track(event === 'hero_cta_click' ? 'hero_cta_click' : event, { view, position: button.dataset.funnelPosition });
    window.location.assign(destination(view));
  }));

  /* DDA Visual Identity V2 — progressive reveals for the public editorial shell. */
  const revealSelector = [
    '.landing-main-copy', '.landing-aperture', '.landing-method article', '.landing-experience',
    '.experience-flow li', '.landing-product > *', '.product-window', '.product-index article',
    '.landing-proof > *', '.proof-composition > *', '.proof-principles li', '.landing-ecosystem > *',
    '.domain-rail article', '.landing-institution > div', '.landing-demo-grid article',
    '.landing-problem-list li', '.landing-steps-list li', '.landing-plan-card', '.landing-guardrails > *',
    '.landing-final-cta > *'
  ].join(',');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const revealObserver = !reducedMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }), { threshold: 0.08, rootMargin: '0px 0px -7% 0px' })
    : null;
  if (!revealObserver) {
    document.documentElement.classList.add('no-reveal-motion');
    document.querySelectorAll(revealSelector).forEach(node => node.classList.add('revealed'));
  } else {
    document.querySelectorAll(revealSelector).forEach((node, index) => {
      node.dataset.revealReady = 'true';
      node.setAttribute('data-reveal', '');
      node.setAttribute('data-reveal-delay', String(index % 4));
      revealObserver.observe(node);
    });
  }

  const seen = new Set();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target.dataset.funnelSection;
      if (section && !seen.has(section)) { seen.add(section); track('landing_section_reached', { section }); observer.unobserve(entry.target); }
    }), { threshold: 0.25, rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('[data-funnel-section]').forEach(node => observer.observe(node));
  }

  const flow = [...document.querySelectorAll('[data-experience-step]')];
  const status = document.querySelector('[data-experience-status]');
  const labels = ['Discover — commencer par une question claire.', 'Learn — donner un cadre à ce que tu observes.', 'Practice — essayer avec le droit au retry.', 'Analyze — comprendre ce qui a changé.', 'Improve — choisir la prochaine action utile.'];
  let active = 0;
  const renderFlow = index => { if (!flow.length) return; active = index % flow.length; flow.forEach((node, i) => node.classList.toggle('is-active', i === active)); if (status) status.textContent = labels[active]; };
  renderFlow(0);
  if (flow.length && !reducedMotion) window.setInterval(() => renderFlow(active + 1), 2600);

  document.querySelectorAll('[data-proof-choice]').forEach(button => button.addEventListener('click', () => {
    const right = button.dataset.proofChoice === 'right';
    const box = button.closest('[data-proof-demo]');
    box?.classList.toggle('is-confirmed', right); box?.classList.toggle('is-review', !right);
    const state = box?.querySelector('[data-proof-state]'); const feedback = box?.querySelector('[data-proof-feedback]');
    if (state) state.textContent = right ? 'Preuve comprise' : 'À revoir';
    if (feedback) feedback.textContent = right ? 'Exact. Une observation expliquée devient une preuve de compréhension.' : 'À revoir. DDA t’indique ce qui manque, puis te permet de recommencer.';
  }));

  /* Public navigation: anchors stay on the landing, scroll smoothly and close
     the mobile menu. CTAs using data-view keep their existing academy handoff. */
  const publicMenu = document.querySelector('.public-menu');
  const closeMobileMenu = () => {
    if (!publicMenu) return;
    publicMenu.removeAttribute('open');
    publicMenu.querySelector('summary')?.setAttribute('aria-expanded', 'false');
  };
  document.querySelectorAll('a[href^="#landing"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id) || landing;
    event.preventDefault();
    history.replaceState(history.state, '', `#${id}`);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: id === 'landing' ? 'start' : 'start' });
    closeMobileMenu();
    document.querySelectorAll('.public-header-nav a').forEach(item => item.classList.toggle('active', item.getAttribute('href') === `#${id}`));
  }));
  publicMenu?.addEventListener('toggle', event => {
    const summary = event.currentTarget.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', String(event.currentTarget.open));
  });
  publicMenu?.querySelector('.public-menu-panel')?.addEventListener('click', event => {
    if (event.target.closest('a, button')) closeMobileMenu();
  });

  const legalDialog = document.getElementById('legal-dialog');
  const legalTitle = document.getElementById('legal-dialog-title');
  const legalLabel = document.getElementById('legal-dialog-label');
  const legalContent = document.getElementById('legal-dialog-content');
  const publicDocuments = window.DDA_PUBLIC_DOCUMENTS?.public || {};
  const legalDocuments = window.DDA_PUBLIC_DOCUMENTS?.legal || {};
  const publicInfoDialog = document.getElementById('public-info-dialog');
  const publicInfoTitle = document.getElementById('public-info-dialog-title');
  const publicInfoLabel = document.getElementById('public-info-dialog-label');
  const publicInfoContent = document.getElementById('public-info-dialog-content');
  function openPublicInfo(key) {
    const doc = publicDocuments[key];
    if (!doc || !publicInfoDialog) return;
    publicInfoTitle.textContent = doc.title;
    publicInfoLabel.textContent = `DDA / ${key === 'contact' ? 'CONTACT' : 'INFORMATION'}`;
    publicInfoContent.innerHTML = doc.content;
    if (typeof publicInfoDialog.showModal === 'function') publicInfoDialog.showModal();
    else publicInfoDialog.setAttribute('open', '');
    document.getElementById('public-info-dialog-close')?.focus();
  }
  document.querySelectorAll('[data-public-doc]').forEach(button => button.addEventListener('click', () => openPublicInfo(button.dataset.publicDoc)));
  document.getElementById('public-info-dialog-close')?.addEventListener('click', () => publicInfoDialog?.close());
  publicInfoDialog?.addEventListener('click', event => { if (event.target === publicInfoDialog) publicInfoDialog.close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && publicInfoDialog?.open) publicInfoDialog.close(); });
  function openLegal(key) {
    const doc = legalDocuments[key];
    if (!doc || !legalDialog) return;
    legalTitle.textContent = doc.title;
    legalLabel.textContent = `DDA / ${key === 'imprint' ? 'ÉDITEUR' : 'LÉGAL'}`;
    legalContent.innerHTML = doc.content;
    if (typeof legalDialog.showModal === 'function') legalDialog.showModal();
    else legalDialog.setAttribute('open', '');
    document.getElementById('legal-dialog-close')?.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(button => button.addEventListener('click', () => openLegal(button.dataset.legal)));
  document.getElementById('legal-dialog-close')?.addEventListener('click', () => legalDialog?.close());
  legalDialog?.addEventListener('click', event => { if (event.target === legalDialog) legalDialog.close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && legalDialog?.open) legalDialog.close(); });

  const ctaElement = document.querySelector('.landing-mobile-cta');
  const readableContent = [...landing.querySelectorAll('h1,h2,h3,h4,p,li,small,summary,button,a,blockquote,figcaption,span')]
    .filter(node => !node.closest('.landing-mobile-cta') && !node.closest('.landing-inline-cta') && !node.closest('[aria-hidden="true"]') && node.textContent.trim());
  let ctaFrame = 0;
  function syncCta() {
    const mobile = window.matchMedia?.('(max-width: 639px)').matches || window.innerWidth <= 639;
    let covered = false;
    if (mobile && window.scrollY > 520 && ctaElement) {
      const cta = ctaElement.getBoundingClientRect();
      for (const node of readableContent) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.right > cta.left && rect.left < cta.right && rect.bottom > cta.top && rect.top < cta.bottom) {
          covered = true;
          break;
        }
      }
    }
    document.body.classList.toggle('landing-cta-covering-content', covered);
    document.body.classList.toggle('landing-has-scrolled', window.scrollY > 520);
  }
  const requestCtaSync = () => {
    if (ctaFrame) return;
    ctaFrame = window.requestAnimationFrame(() => { ctaFrame = 0; syncCta(); });
  };
  window.addEventListener('scroll', requestCtaSync, { passive: true });
  window.addEventListener('resize', requestCtaSync, { passive: true });
  syncCta();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
