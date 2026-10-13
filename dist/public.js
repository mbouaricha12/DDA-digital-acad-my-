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
  document.querySelectorAll('a[href^="#landing"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id) || landing;
    event.preventDefault();
    history.replaceState(history.state, '', `#${id}`);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: id === 'landing' ? 'start' : 'start' });
    link.closest('details')?.removeAttribute('open');
    document.querySelectorAll('.public-header-nav a').forEach(item => item.classList.toggle('active', item.getAttribute('href') === `#${id}`));
  }));
  document.querySelector('.public-menu')?.addEventListener('toggle', event => {
    const summary = event.currentTarget.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', String(event.currentTarget.open));
  });

  const legalDialog = document.getElementById('legal-dialog');
  const legalTitle = document.getElementById('legal-dialog-title');
  const legalLabel = document.getElementById('legal-dialog-label');
  const legalContent = document.getElementById('legal-dialog-content');
  const legalDocuments = {
    terms: {
      title: 'Conditions générales d’utilisation',
      content: `<h3>1. Objet</h3><p>DDA est une interface pédagogique destinée à aider ses utilisateurs à comprendre les marchés financiers, à pratiquer un raisonnement structuré et à conserver des preuves d’apprentissage.</p><h3>2. Usage autorisé</h3><p>L’utilisateur s’engage à fournir des informations exactes, à protéger l’accès à son appareil et à ne pas détourner les contenus, le code ou les marques DDA. Les fonctionnalités actuellement proposées peuvent fonctionner localement et certaines restent en aperçu.</p><h3>3. Limites pédagogiques</h3><p>DDA ne fournit aucun conseil en investissement, aucune recommandation de position, aucun signal, aucune promesse de rendement et aucune gestion de portefeuille. Les scénarios et graphiques signalés comme synthétiques ne sont pas des données de marché.</p><h3>4. Propriété intellectuelle</h3><p>Les textes, parcours, visuels, signes distinctifs et logiciels DDA restent protégés par les droits applicables. Toute réutilisation substantielle nécessite l’autorisation de l’éditeur.</p><h3>5. Disponibilité</h3><p>DDA peut faire évoluer, suspendre ou retirer une fonctionnalité pour des raisons de sécurité, de maintenance ou de conformité. L’éditeur ne garantit pas une disponibilité permanente de l’aperçu.</p>`
    },
    privacy: {
      title: 'Politique de confidentialité',
      content: `<h3>1. Données traitées</h3><p>Dans la version locale actuelle, le profil, les réponses, le journal et la progression sont conservés sur l’appareil de l’utilisateur. DDA ne demande pas de donnée bancaire et ne vend pas les données personnelles.</p><h3>2. Mesure d’audience</h3><p>Une mesure limitée peut enregistrer des événements de découverte et de parcours sous un identifiant pseudonyme. Les filtres du produit excluent le nom, l’e-mail, le téléphone et les réponses pédagogiques des événements externes.</p><h3>3. Finalités</h3><p>Les données servent à faire fonctionner le parcours, restaurer une session locale, améliorer l’expérience et comprendre l’acquisition de manière agrégée. Elles ne servent pas à produire des signaux de marché.</p><h3>4. Droits</h3><p>L’utilisateur peut effacer ses données locales depuis son profil ou son navigateur. Pour toute demande relative à un futur traitement serveur, l’identité et les coordonnées de l’éditeur devront être précisées dans la présente page avant le lancement officiel.</p><h3>5. Sous-traitants</h3><p>Aucun partage commercial ou publicitaire n’est activé dans cet aperçu. Tout service futur devra être documenté, sécurisé et soumis aux exigences légales applicables.</p>`
    },
    cookies: {
      title: 'Gestion des cookies et du stockage local',
      content: `<h3>1. Fonctionnement actuel</h3><p>DDA utilise principalement le stockage local du navigateur pour conserver un parcours de démonstration sur l’appareil. Cette mémoire permet de restaurer le profil, le journal et les preuves pédagogiques.</p><h3>2. Pas de cookie publicitaire</h3><p>Aucun cookie publicitaire, aucune revente d’audience et aucun ciblage comportemental commercial n’est activé dans cette version.</p><h3>3. Contrôle utilisateur</h3><p>La suppression des données depuis le profil ou les réglages du navigateur efface la session locale. La désactivation du stockage peut empêcher la conservation de la progression, sans bloquer la lecture des pages publiques.</p><h3>4. Évolution</h3><p>Si des cookies ou traceurs supplémentaires deviennent nécessaires, leur finalité, leur durée et leur mécanisme de consentement seront affichés avant activation.</p>`
    },
    imprint: {
      title: 'Mentions légales',
      content: `<h3>Éditeur</h3><p><strong>Darius Digital Academy (DDA)</strong><br>Projet éducatif porté depuis Abidjan, Côte d’Ivoire.</p><p><strong>Informations à compléter avant publication commerciale :</strong> forme juridique, numéro d’immatriculation, adresse professionnelle, adresse e-mail de contact, directeur de la publication et hébergeur.</p><h3>Nature du service</h3><p>DDA est une plateforme d’apprentissage des marchés et de construction de compétences. Elle ne constitue pas un service de conseil financier, un courtier, une plateforme d’exécution ou un fournisseur de signaux.</p><h3>Responsabilité éditoriale</h3><p>Les exemples, scénarios, graphiques et chiffres présentés à des fins pédagogiques ne constituent pas une information personnalisée ni une incitation à investir. Toute décision financière relève exclusivement de l’utilisateur, après vérifications indépendantes et selon la réglementation applicable.</p>`
    }
  };
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
