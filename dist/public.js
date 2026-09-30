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
  if (flow.length && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) window.setInterval(() => renderFlow(active + 1), 2600);

  document.querySelectorAll('[data-proof-choice]').forEach(button => button.addEventListener('click', () => {
    const right = button.dataset.proofChoice === 'right';
    const box = button.closest('[data-proof-demo]');
    box?.classList.toggle('is-confirmed', right); box?.classList.toggle('is-review', !right);
    const state = box?.querySelector('[data-proof-state]'); const feedback = box?.querySelector('[data-proof-feedback]');
    if (state) state.textContent = right ? 'Preuve comprise' : 'À revoir';
    if (feedback) feedback.textContent = right ? 'Exact. Une observation expliquée devient une preuve de compréhension.' : 'À revoir. DDA t’indique ce qui manque, puis te permet de recommencer.';
  }));

  function syncCta() {
    const mobile = window.matchMedia?.('(max-width: 639px)').matches || window.innerWidth <= 639;
    const lastCard = document.querySelector('.landing-free-grid article:last-child'); const cta = document.querySelector('.landing-mobile-cta');
    let covered = false;
    if (mobile && lastCard && cta) { const a = lastCard.getBoundingClientRect(); const b = cta.getBoundingClientRect(); covered = a.bottom > b.top && a.top < b.bottom; }
    document.body.classList.toggle('landing-cta-covering-content', covered);
    document.body.classList.toggle('landing-has-scrolled', window.scrollY > 520);
  }
  window.addEventListener('scroll', syncCta, { passive: true }); window.addEventListener('resize', syncCta, { passive: true }); syncCta();
})();
