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
  const publicDocuments = {
    about: {
      title: 'À propos de DDA',
      content: `<p class="public-doc-lead">Darius Digital Academy est une plateforme éducative consacrée à la compréhension des marchés et à la construction de compétences durables.</p><nav class="public-doc-index" aria-label="Sommaire À propos"><a href="#public-about-mission">Mission</a><a href="#public-about-method">Méthode</a><a href="#public-about-audience">Publics</a><a href="#public-about-limits">Limites actuelles</a></nav><h3 id="public-about-mission">1. Une académie pour comprendre</h3><p>DDA répond à un problème simple : beaucoup de contenus parlent des marchés sans donner le temps ni le cadre pour observer, pratiquer et vérifier ce qui a été compris. La plateforme transforme une notion en parcours pédagogique, puis en preuve de travail.</p><h3 id="public-about-method">2. Une méthode en cinq mouvements</h3><p><strong>Discover</strong> : situer une question et un niveau de départ. <strong>Learn</strong> : acquérir un fondamental dans un contexte clair. <strong>Practice</strong> : essayer, recevoir un retour et recommencer. <strong>Analyze</strong> : comprendre l’erreur ou le raisonnement. <strong>Improve</strong> : choisir la prochaine action utile. La théorie prépare l’action ; elle ne la remplace pas.</p><h3 id="public-about-audience">3. Pour qui ?</h3><p>DDA s’adresse aux débutants, aux apprenants autonomes et aux personnes qui souhaitent structurer leur lecture des marchés sans confondre apprentissage et recommandation. Le projet est pensé pour le public francophone africain avec une vocation internationale.</p><h3 id="public-about-limits">4. Ce qui est disponible aujourd’hui</h3><p>La version actuelle propose un parcours local, des exercices, des quiz, un Journal et des vues de progression sur l’appareil de l’utilisateur. Les espaces Experts, Communauté, DDA AI, les données temps réel, les comptes serveur, les paiements et la synchronisation multi-appareils sont déployés progressivement. Les fonctionnalités non ouvertes sont signalées comme telles et ne doivent pas être présentées comme disponibles.</p>`
    },
    risks: {
      title: 'Risques financiers et limites pédagogiques',
      content: `<p class="public-doc-lead">DDA enseigne des méthodes de lecture et de raisonnement. Ce service ne constitue pas un conseil financier personnalisé.</p><h3>1. Une finalité éducative</h3><p>Les textes, exemples, scénarios et séries synthétiques sont fournis pour apprendre. Ils ne constituent ni une recommandation d’achat ou de vente, ni un signal, ni une gestion de portefeuille.</p><h3>2. Des marchés risqués</h3><p>Les marchés financiers peuvent entraîner une perte partielle ou totale du capital. Les produits à effet de levier, le Forex, les dérivés et certains cryptoactifs peuvent amplifier les pertes. Une personne ne devrait engager que des sommes dont elle peut supporter la perte, après avoir vérifié la réglementation applicable.</p><h3>3. Aucune promesse</h3><p>Les résultats passés ne garantissent pas les résultats futurs. Aucun rendement, niveau de réussite ou résultat financier ne doit être considéré comme garanti. Les graphiques pédagogiques ne représentent pas nécessairement des prix ni des performances réelles. Les séries, tracés et scénarios peuvent être synthétiques, locaux, retardés ou simplifiés et ne constituent pas des cours en temps réel.</p><h3>4. Responsabilité de l’utilisateur</h3><p>L’utilisateur reste responsable de ses décisions, de sa gestion du risque et des vérifications indépendantes nécessaires. DDA ne remplace pas un professionnel autorisé, une documentation réglementaire ou un avis adapté à une situation personnelle.</p><h3>5. Cadre à confirmer</h3><p>Les obligations applicables dépendent du pays de l’utilisateur et de la nature future des services. Le cadre juridique définitif de l’éditeur devra être confirmé avant toute ouverture commerciale.</p>`
    },
    contact: {
      title: 'Aide, contact et partenariats',
      content: `<p class="public-doc-lead">Cette page explique comment orienter une demande sans afficher de coordonnées inventées.</p><h3>1. Support officiel</h3><p>Pour toute question produit, demande de lancement ou signalement, écris à <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a>. Tu peux aussi rejoindre le <a href="https://t.me/+Wny_VS9f-blmOWFk" target="_blank" rel="noopener noreferrer">canal Telegram DDA</a> ou suivre la <a href="https://whatsapp.com/channel/0029VbCISPsI1rcb3sbxiI0A" target="_blank" rel="noopener noreferrer">chaîne WhatsApp Darius Academy Officiel</a>.</p><h3>2. Pour obtenir de l’aide</h3><p>Indique l’URL ou l’écran concerné, l’appareil et le navigateur utilisés, l’action réalisée et le message observé. Ne transmets jamais de mot de passe, de donnée bancaire ou de clé secrète.</p><h3>3. Partenariats et affiliation</h3><p>DDA ne doit pas présenter un courtier ou un partenaire comme une recommandation indépendante. Toute relation commerciale, affiliation ou rémunération future devra être annoncée clairement avant l’activation d’un lien ou d’une offre.</p><h3>4. Coordonnées officielles</h3><p><strong>Contact officiel :</strong> <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a><br><strong>Support communautaire :</strong> <a href="https://t.me/+Wny_VS9f-blmOWFk" target="_blank" rel="noopener noreferrer">Telegram DDA</a> et <a href="https://whatsapp.com/channel/0029VbCISPsI1rcb3sbxiI0A" target="_blank" rel="noopener noreferrer">WhatsApp Darius Academy Officiel</a><br><strong>Éditeur et adresse légale :</strong> statut provisoire, à confirmer.</p>`
    },
    faq: {
      title: 'Questions fréquentes',
      content: `<p class="public-doc-lead">Quelques réponses pour comprendre ce que DDA fait réellement aujourd’hui.</p><h3>Qu’est-ce que DDA ?</h3><p>Une plateforme éducative pour comprendre les marchés, pratiquer un raisonnement et conserver des preuves d’apprentissage.</p><h3>DDA donne-t-elle des signaux ?</h3><p>Non. DDA n’est ni un fournisseur de signaux, ni un service de conseil, ni une plateforme d’exécution.</p><h3>Les données sont-elles en temps réel ?</h3><p>Non dans cette version. Les séries et tracés explicitement pédagogiques sont synthétiques ou locaux et ne doivent pas être lus comme une connexion de marché.</p><h3>Où est conservée ma progression ?</h3><p>Dans la version actuelle, le profil, le Journal et la progression sont principalement conservés dans le stockage local du navigateur. Il n’existe pas encore de synchronisation multi-appareils garantie.</p><h3>Le parcours est-il gratuit ?</h3><p>L’offre DDA Free permet de découvrir les premières leçons, les exercices, les quiz, le Journal local et les vues de progression, sans paiement. Les espaces Premium et futurs sont présentés séparément ; aucun paiement réel ni renouvellement automatique n’est activé dans cette version.</p><h3>Comment signaler un problème ?</h3><p>Pour obtenir de l’aide, écris à <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a> ou rejoins le <a href="https://t.me/+Wny_VS9f-blmOWFk" target="_blank" rel="noopener noreferrer">canal Telegram DDA</a>. La chaîne <a href="https://whatsapp.com/channel/0029VbCISPsI1rcb3sbxiI0A" target="_blank" rel="noopener noreferrer">Darius Academy Officiel sur WhatsApp</a> relaie également les actualités officielles.</p>`
    },
    accessibility: {
      title: 'Accessibilité',
      content: `<p class="public-doc-lead">DDA vise une interface lisible, navigable au clavier et utilisable sur mobile, avec une amélioration continue avant le lancement.</p><h3>1. Engagements actuels</h3><p>Les contrôles interactifs disposent d’un focus visible, les rails pédagogiques sont atteignables au clavier, les changements de feedback utilisent des annonces adaptées et les menus mobiles restent utilisables sur écran étroit.</p><h3>2. Préférences de mouvement</h3><p>Les animations non essentielles sont réduites lorsque le navigateur indique <code>prefers-reduced-motion: reduce</code>. La lecture et la navigation ne doivent pas dépendre d’une animation.</p><h3>3. Limites connues</h3><p>Cette version n’a pas encore fait l’objet d’une certification externe WCAG ni d’un test complet avec toutes les technologies d’assistance. Les contenus, contrastes et tailles de cibles continuent d’être vérifiés.</p><h3>4. Besoin d’aide</h3><p>Pour signaler un problème d’accessibilité, écris à <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a> en indiquant la page, l’appareil, le navigateur et l’action qui pose problème.</p>`
    }
  };
  const legalDocuments = {
    terms: {
      title: 'Conditions générales d’utilisation',
      content: `<p class="public-doc-meta"><strong>Dernière mise à jour :</strong> 18 octobre 2026</p><h3>1. Objet</h3><p>DDA est une interface pédagogique destinée à aider ses utilisateurs à comprendre les marchés financiers, à pratiquer un raisonnement structuré et à conserver des preuves d’apprentissage.</p><h3>2. Usage autorisé</h3><p>L’utilisateur s’engage à fournir des informations exactes, à protéger l’accès à son appareil et à ne pas détourner les contenus, le code ou les marques DDA. Les fonctionnalités actuellement proposées peuvent fonctionner localement et certaines restent en aperçu.</p><h3>3. Limites pédagogiques</h3><p>DDA ne fournit aucun conseil en investissement, aucune recommandation de position, aucun signal, aucune promesse de rendement et aucune gestion de portefeuille. Les scénarios et graphiques signalés comme synthétiques ne sont pas des données de marché.</p><h3>4. Propriété intellectuelle</h3><p>Les textes, parcours, visuels, signes distinctifs et logiciels DDA restent protégés par les droits applicables. Toute réutilisation substantielle nécessite l’autorisation de l’éditeur.</p><h3>5. Disponibilité</h3><p>DDA peut faire évoluer, suspendre ou retirer une fonctionnalité pour des raisons de sécurité, de maintenance ou de conformité. L’éditeur ne garantit pas une disponibilité permanente de l’aperçu.</p><h3>6. Contact et mise à jour</h3><p>Le contact produit officiel est <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a>. L’identité juridique et l’adresse légale de l’éditeur restent à compléter avant toute ouverture commerciale et pourront évoluer pour refléter les fonctionnalités réellement disponibles.</p>`
    },
    privacy: {
      title: 'Politique de confidentialité',
      content: `<p class="public-doc-meta"><strong>Dernière mise à jour :</strong> 18 octobre 2026</p><h3>1. Données traitées</h3><p>Dans la version locale actuelle, le profil, les réponses, le journal et la progression sont conservés sur l’appareil de l’utilisateur. DDA ne demande pas de donnée bancaire et ne vend pas les données personnelles.</p><h3>2. Mesure d’audience</h3><p>Une mesure limitée peut enregistrer des événements de découverte et de parcours sous un identifiant pseudonyme. Les filtres du produit excluent le nom, l’e-mail, le téléphone et les réponses pédagogiques des événements externes.</p><h3>3. Finalités</h3><p>Les données servent à faire fonctionner le parcours, restaurer une session locale, améliorer l’expérience et comprendre l’acquisition de manière agrégée. Elles ne servent pas à produire des signaux de marché.</p><h3>4. Droits</h3><p>L’utilisateur peut effacer ses données locales depuis son profil ou son navigateur. Pour toute demande relative à un futur traitement serveur, l’identité et les coordonnées de l’éditeur devront être précisées dans la présente page avant le lancement officiel.</p><h3>5. Sous-traitants</h3><p>Aucun partage commercial ou publicitaire n’est activé dans cet aperçu. Tout service futur devra être documenté, sécurisé et soumis aux exigences légales applicables.</p><h3>6. Contact confidentialité</h3><p>Pour toute question relative aux données, contacte <a href="mailto:dariusdigitalacademy@gmail.com">dariusdigitalacademy@gmail.com</a>.</p>`
    },
    cookies: {
      title: 'Gestion des cookies et du stockage local',
      content: `<p class="public-doc-meta"><strong>Dernière mise à jour :</strong> 18 octobre 2026</p><h3>1. Fonctionnement actuel</h3><p>DDA utilise principalement le stockage local du navigateur pour conserver un parcours de démonstration sur l’appareil. Cette mémoire permet de restaurer le profil, le journal et les preuves pédagogiques.</p><h3>2. Pas de cookie publicitaire</h3><p>Aucun cookie publicitaire, aucune revente d’audience et aucun ciblage comportemental commercial n’est activé dans cette version.</p><h3>3. Contrôle utilisateur</h3><p>La suppression des données depuis le profil ou les réglages du navigateur efface la session locale. La désactivation du stockage peut empêcher la conservation de la progression, sans bloquer la lecture des pages publiques.</p><h3>4. Évolution</h3><p>Si des cookies ou traceurs supplémentaires deviennent nécessaires, leur finalité, leur durée et leur mécanisme de consentement seront affichés avant activation.</p><p>Dernière mise à jour : 18 octobre 2026.</p>`
    },
    imprint: {
      title: 'Mentions légales',
      content: `<p class="public-doc-meta"><strong>Dernière mise à jour :</strong> 18 octobre 2026</p><h3>Éditeur — statut provisoire</h3><p><strong>Darius Digital Academy (DDA)</strong><br>Projet éducatif en cours de constitution, porté depuis l’Afrique francophone avec vocation internationale.</p><p><strong>Situation administrative :</strong> l’entité n’est pas encore immatriculée. Aucun numéro RCCM ou identifiant fiscal n’est donc revendiqué à ce stade. L’adresse légale complète, l’e-mail officiel, le directeur de publication et les coordonnées définitives de l’hébergeur seront publiés et validés avant toute ouverture commerciale.</p><p><strong>Important :</strong> cette page est une information provisoire de pré-lancement et ne remplace pas les mentions légales définitives exigées par la juridiction applicable.</p><h3>Nature du service</h3><p>DDA est une plateforme d’apprentissage des marchés et de construction de compétences. Elle ne constitue pas un service de conseil financier, un courtier, une plateforme d’exécution ou un fournisseur de signaux.</p><h3>Responsabilité éditoriale</h3><p>Les exemples, scénarios, graphiques et chiffres présentés à des fins pédagogiques ne constituent pas une information personnalisée ni une incitation à investir. Toute décision financière relève exclusivement de l’utilisateur, après vérifications indépendantes et selon la réglementation applicable.</p>`
    }
  };
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
