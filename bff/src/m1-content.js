'use strict';

/* ==========================================================================
   M1 CONTENT — the real authored text, exercises and quiz answers for the
   three M1 lessons (M1.1, M1.2, M1.3), which the roadmap and /launch/ both
   describe as reserved for the advanced_modules entitlement, not DDA Free
   (CDCP-OS §4.2, arbitrage D1 Option B).

   This module exists for the exact same reason bff/src/premium-content.js
   does: the real content used to be embedded in clear text in public,
   statically-served browser files (dist/m1-1-lesson.js, dist/m1-2-lesson.js,
   dist/m1-3-lesson.js) — readable by anyone, Free or anonymous, with a
   single unauthenticated request, no authentication to defeat and no
   entitlement check anywhere in the request path (DDA_AUDIT_COMPLET /
   docs/RISK_REGISTER.md R-04). The client-side gate (canUnlock /
   serverPremiumConfirmed-equivalent) only ever controlled whether the
   already-shipped data was *rendered* — never whether it was *shipped*.

   The fix mirrors Lot 2 exactly: this data now lives ONLY here, on the
   server, imported by nothing but bff/src/app.js's authenticated
   /v1/m1/content/:lessonId route (guarded by hasAdvancedModulesAccess(),
   the same snapshot already used for Premium). It is never required by,
   bundled into, or copied to anything under dist/ — grep dist/ for the
   strings below and they must not appear there.

   Content is verbatim what dist/m1-1-lesson.js / m1-2-lesson.js /
   m1-3-lesson.js used to hold — moved, not rewritten, so no pedagogical
   content changes with this fix.
   ========================================================================== */

function lessonM11() {
  const competency = Object.freeze({ id: 'price_formation_understanding', label: 'Compréhension de la formation du prix' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({ lead: 'Cette leçon t’aide à comprendre pourquoi un prix peut monter, baisser ou rester en range — sans transformer cette lecture en signal ni en prédiction.' });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);
  const buyPressureOptions = Object.freeze([
    Object.freeze({ text: 'Le prix peut progresser si les acheteurs agressifs consomment les offres de vente disponibles.', correct: true, feedback: 'Oui. Le point important n’est pas “il y a des acheteurs”, mais que des acheteurs acceptent les prix disponibles et absorbent la liquidité vendeuse.' }),
    Object.freeze({ text: 'Le prix monte automatiquement dès qu’un seul achat apparaît.', correct: false, feedback: 'Non. Une transaction isolée ne suffit pas. Le mouvement dépend du flux d’ordres, de la liquidité disponible et de la capacité des vendeurs à absorber la demande.' }),
    Object.freeze({ text: 'Le vendeur disparaît du marché et il n’existe plus de contrepartie.', correct: false, feedback: 'Non. Une transaction nécessite toujours une contrepartie. Ce qui change, c’est le prix auquel la prochaine contrepartie accepte d’échanger.' })
  ]);
  const sellPressureOptions = Object.freeze([
    Object.freeze({ text: 'Le prix peut reculer si les vendeurs agressifs consomment les ordres d’achat disponibles.', correct: true, feedback: 'Exact. Une pression vendeuse peut déplacer le prix vers les prochains acheteurs disponibles lorsque la liquidité acheteuse proche est absorbée.' }),
    Object.freeze({ text: 'Le prix baisse parce que le marché décide volontairement de punir les acheteurs.', correct: false, feedback: 'Non. Le marché n’a pas d’intention unique. Le prix reflète l’exécution d’ordres entre de nombreux participants.' }),
    Object.freeze({ text: 'Toute vente entraîne nécessairement une baisse importante.', correct: false, feedback: 'Non. Une vente peut être absorbée sans grand déplacement si suffisamment d’acheteurs sont disponibles au même niveau.' })
  ]);
  const balanceOptions = Object.freeze([
    Object.freeze({ text: 'Le prix peut osciller dans une zone lorsque les pressions restent relativement équilibrées.', correct: true, feedback: 'Oui. Tant qu’aucun côté ne crée un déséquilibre suffisamment durable, le prix peut rester dans une zone d’équilibre relatif.' }),
    Object.freeze({ text: 'Un marché équilibré signifie que le prix ne bougera plus jamais.', correct: false, feedback: 'Non. L’équilibre est temporaire. De nouveaux ordres, de nouvelles informations ou un changement de liquidité peuvent modifier la situation.' }),
    Object.freeze({ text: 'Le range prouve qu’aucun participant n’achète ou ne vend.', correct: false, feedback: 'Non. Il y a toujours des échanges. Un range montre surtout qu’aucun camp ne domine durablement la zone observée.' })
  ]);
  const finalExerciseOptions = Object.freeze([
    Object.freeze({ text: 'Pression acheteuse dominante : les achats agressifs absorbent progressivement la liquidité vendeuse proche.', correct: true, feedback: 'Bonne lecture. Tu relies le mouvement potentiel au déséquilibre et à la liquidité, pas à une formule “plus d’acheteurs = hausse automatique”.' }),
    Object.freeze({ text: 'Équilibre parfait : aucune transaction ne peut déplacer le prix.', correct: false, feedback: 'Ce n’est pas un équilibre parfait : le scénario décrit justement une absorption répétée de la liquidité vendeuse.' }),
    Object.freeze({ text: 'Pression vendeuse dominante parce qu’il existe encore des vendeurs.', correct: false, feedback: 'La présence de vendeurs ne suffit pas à conclure. Observe qui consomme la liquidité et quel côté impose davantage ses prix.' })
  ]);
  const practice = Object.freeze({ id: 'm1-exercise', label: 'Exercice d’application', heading: 'Identifier le déséquilibre', prompt: 'Choisis la cause la plus cohérente avec les échanges observés.', successText: 'Bonne lecture. Tu relies le mouvement potentiel au déséquilibre et à la liquidité.', choices: finalExerciseOptions });
  const evaluation = Object.freeze({
    id: 'm1-quiz', label: 'Quiz de validation', heading: 'Qu’est-ce qui décrit le mieux la formation d’un mouvement de prix ?', prompt: 'Choisis la réponse la plus précise.', successText: 'Correct. Tu relies le prix aux échanges, à la liquidité et aux déséquilibres entre participants.',
    choices: Object.freeze([
      Object.freeze({ text: 'Le prix évolue quand l’exécution des ordres et la liquidité disponible créent un déséquilibre entre les deux côtés du marché.', correct: true }),
      Object.freeze({ text: 'Le prix évolue uniquement parce qu’il y a davantage de personnes qui veulent acheter que vendre.', correct: false, feedback: 'Cette phrase est trop simpliste : chaque transaction a un acheteur et un vendeur. Ce qui compte est notamment l’agressivité des ordres et la liquidité disponible aux différents prix.' }),
      Object.freeze({ text: 'Le prix suit une direction décidée à l’avance par le marché.', correct: false, feedback: 'Non. DDA n’enseigne pas une direction prédéterminée : le prix résulte d’interactions continues entre participants.' })
    ])
  });
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm1-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({ type: 'text_short', id: 'm1-concept', step: 'lesson', outline: 'Le prix est un résultat, pas une volonté', eyebrow: 'Le concept', heading: 'Le prix se déplace quand l’équilibre des échanges change.', body: 'Chaque transaction relie un acheteur et un vendeur. Ce qui peut déplacer le prix, c’est la façon dont les ordres arrivent, la quantité de liquidité disponible aux différents niveaux et la capacité d’un côté à absorber l’autre.', principle: Object.freeze({ label: 'Principe essentiel', text: 'Ne réduis pas le marché à “plus d’acheteurs que de vendeurs”. Chaque échange a deux côtés ; observe plutôt qui accepte les prix disponibles et quelle liquidité reste à absorber.' }) }),
    Object.freeze({ type: 'case_study', id: 'm1-case-buyers', step: 'lesson', outline: 'Cas 1 · pression acheteuse', label: 'Cas 1 · pression acheteuse', text: 'Plusieurs acheteurs exécutent rapidement leurs ordres. Les offres de vente proches sont progressivement absorbées et les prochaines offres disponibles se trouvent plus haut.' }),
    Object.freeze({ type: 'decision_choice', id: 'm1-buy-pressure', step: 'lesson', outline: 'Décider', eyebrow: 'À toi de raisonner', heading: 'Que peut-il se passer sur le prix ?', prompt: 'Choisis l’explication la plus rigoureuse.', options: buyPressureOptions }),
    Object.freeze({ type: 'case_study', id: 'm1-case-sellers', step: 'lesson', outline: 'Cas 2 · pression vendeuse', label: 'Cas 2 · pression vendeuse', text: 'Des vendeurs exécutent agressivement leurs ordres. Les achats disponibles au prix courant sont absorbés et les prochains acheteurs se trouvent plus bas.' }),
    Object.freeze({ type: 'decision_choice', id: 'm1-sell-pressure', step: 'lesson', outline: 'Décider', eyebrow: 'Nouveau cas', heading: 'Quelle lecture est la plus juste ?', prompt: 'Raisonne avec la liquidité et les contreparties.', options: sellPressureOptions }),
    Object.freeze({ type: 'case_study', id: 'm1-case-balance', step: 'lesson', outline: 'Cas 3 · équilibre relatif', label: 'Cas 3 · équilibre relatif', text: 'Acheteurs et vendeurs se répondent dans une même zone. Les poussées d’un côté sont régulièrement absorbées par l’autre et aucune direction ne s’impose durablement.' }),
    Object.freeze({ type: 'decision_choice', id: 'm1-balance', step: 'lesson', outline: 'Décider', eyebrow: 'Comprendre le range', heading: 'Que décrit le mieux cette situation ?', prompt: 'Choisis sans chercher à prédire la sortie du range.', options: balanceOptions }),
    Object.freeze({ type: 'case_study', id: 'm1-exercise-case', step: 'exercise', outline: 'Exercice d’application', label: 'Exercice d’application', text: 'Sur plusieurs échanges successifs, les ordres d’achat agressifs continuent d’absorber les offres de vente proches. Les vendeurs doivent proposer leurs ordres à des prix progressivement plus élevés pour trouver de nouvelles contreparties.' }),
    Object.freeze({ type: 'decision_choice', id: 'm1-exercise', step: 'exercise', outline: 'Identifier le déséquilibre', eyebrow: 'Appliquer', heading: practice.heading, prompt: practice.prompt, options: finalExerciseOptions }),
    Object.freeze({ type: 'quiz', id: 'm1-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm1-journal', step: 'review', prompt: 'Écris avec tes propres mots pourquoi un prix peut monter, baisser ou rester en range.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm1-result', step: 'review', idSuffix: 'm11', continueTo: Object.freeze({ view: 'lesson-m12', label: 'Continuer vers Ordres & exécution' }), data: Object.freeze({ heading: 'Compréhension de la formation du prix confirmée.', body: 'Tu as relié hausse, baisse et équilibre relatif aux ordres, à la liquidité et aux déséquilibres — sans transformer cette lecture en prédiction ou en signal.' }) })
  ]);
  return Object.freeze({ id: 'M1.1', title: 'Pourquoi les prix évoluent ?', summary: 'Comprendre comment ordres, liquidité et déséquilibres peuvent déplacer le prix — sans signal ni prédiction.', estimatedMinutes: 15, markUnderstoodLabel: 'Passer à l’exercice', video: Object.freeze({ title: 'Pourquoi les prix évoluent ?', caption: 'Support vidéo en préparation — le contenu complet est déjà disponible dans la séquence guidée.' }), competency, xp, content, practice, evaluation, steps, blocks });
}

function lessonM12() {
  const competency = Object.freeze({ id: 'order_execution_understanding', label: 'Compréhension des ordres et de l’exécution' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon explique comment les ordres rencontrent la liquidité disponible : bid, ask, spread, ordre au marché, ordre limite et exécution — sans transformer ces notions en conseil de trading.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const immediateOptions = Object.freeze([
    Object.freeze({ text: 'Un ordre au marché privilégie l’exécution immédiate, mais ne garantit pas un prix exact.', correct: true, feedback: 'Exact. Il cherche à s’exécuter contre la liquidité disponible. Si plusieurs niveaux sont nécessaires, le prix moyen peut différer du premier prix affiché.' }),
    Object.freeze({ text: 'Un ordre au marché garantit toujours le prix visible au moment du clic.', correct: false, feedback: 'Non. Le prix visible peut ne pas contenir assez de liquidité pour toute la quantité demandée.' }),
    Object.freeze({ text: 'Un ordre au marché attend forcément qu’un prix précis soit atteint.', correct: false, feedback: 'Non. C’est précisément le rôle d’un ordre limite : définir un prix maximum à l’achat ou minimum à la vente.' })
  ]);

  const spreadOptions = Object.freeze([
    Object.freeze({ text: 'Le spread est l’écart entre le meilleur prix acheteur (bid) et le meilleur prix vendeur (ask).', correct: true, feedback: 'Oui. Le bid est le meilleur prix proposé par un acheteur ; l’ask est le meilleur prix demandé par un vendeur.' }),
    Object.freeze({ text: 'Le spread est toujours la commission facturée par le courtier.', correct: false, feedback: 'Non. Le spread décrit d’abord l’écart bid/ask. Des frais ou commissions peuvent exister séparément selon le marché et l’intermédiaire.' }),
    Object.freeze({ text: 'Le spread mesure la direction future du marché.', correct: false, feedback: 'Non. Il décrit une caractéristique de cotation et de liquidité, pas une prédiction.' })
  ]);

  const limitOptions = Object.freeze([
    Object.freeze({ text: 'L’ordre limite contrôle le prix maximal accepté à l’achat, mais son exécution n’est pas garantie.', correct: true, feedback: 'Exact. Le contrôle du prix a une contrepartie : si le marché n’atteint pas ce niveau ou si la liquidité manque, l’ordre peut rester non exécuté.' }),
    Object.freeze({ text: 'L’ordre limite garantit à la fois le prix choisi et une exécution immédiate.', correct: false, feedback: 'Non. Il peut garantir une contrainte de prix, pas l’exécution.' }),
    Object.freeze({ text: 'Un ordre limite sert uniquement à fermer une position.', correct: false, feedback: 'Non. Un ordre limite est un type d’instruction de prix ; son usage ne se réduit pas à une fermeture.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: '2 unités peuvent s’exécuter à 50,10 puis 2 unités à 50,12 ; le prix moyen sera supérieur à 50,10.', correct: true, feedback: 'Bonne lecture. L’ordre consomme d’abord la meilleure offre disponible, puis le niveau suivant pour la quantité restante. Cet exemple est purement pédagogique.' }),
    Object.freeze({ text: 'Les 4 unités s’exécutent obligatoirement à 50,10 car c’est le meilleur ask.', correct: false, feedback: 'Non. Il n’y a que 2 unités disponibles à 50,10 dans le scénario. La quantité restante doit chercher la liquidité suivante.' }),
    Object.freeze({ text: 'L’ordre est automatiquement annulé car deux niveaux de prix existent.', correct: false, feedback: 'Non. Un ordre au marché peut se répartir sur plusieurs niveaux si c’est nécessaire pour obtenir la quantité demandée.' })
  ]);

  const practice = Object.freeze({
    id: 'm12-exercise',
    label: 'Exercice d’application',
    heading: 'Lire une exécution sur plusieurs niveaux',
    prompt: 'Dans cet exemple synthétique, un achat au marché de 4 unités rencontre 2 unités à 50,10 puis au moins 3 unités à 50,12. Que décrit correctement l’exécution ?',
    successText: 'Bonne lecture. Tu distingues le prix affiché de la liquidité réellement disponible.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm12-quiz',
    label: 'Quiz de validation',
    heading: 'Quelle affirmation décrit le mieux l’exécution d’un ordre ?',
    prompt: 'Choisis la réponse la plus précise.',
    successText: 'Correct. Tu relies type d’ordre, liquidité disponible, bid/ask et prix d’exécution.',
    choices: Object.freeze([
      Object.freeze({ text: 'L’exécution dépend du type d’ordre et de la liquidité disponible aux prix rencontrés.', correct: true }),
      Object.freeze({ text: 'Le prix affiché au moment du clic est toujours le prix final obtenu.', correct: false, feedback: 'Non. La quantité disponible et le déplacement entre plusieurs niveaux peuvent modifier le prix moyen d’exécution.' }),
      Object.freeze({ text: 'Un ordre limite et un ordre au marché garantissent exactement la même chose.', correct: false, feedback: 'Non. L’un privilégie l’exécution, l’autre impose une contrainte de prix.' })
    ])
  });

  const ladder = '<div class="dda-order-ladder" role="img" aria-label="Carnet pédagogique synthétique montrant deux niveaux vendeurs, le meilleur ask et deux niveaux acheteurs.">' +
    '<div class="ladder-side ask"><span>Vendeurs · ASK</span><strong>50,12 · 3 unités</strong><strong class="best">50,10 · 2 unités</strong></div>' +
    '<div class="ladder-spread"><small>SPREAD</small><b>0,02</b></div>' +
    '<div class="ladder-side bid"><strong class="best">50,08 · 4 unités</strong><strong>50,06 · 5 unités</strong><span>Acheteurs · BID</span></div>' +
    '<p>Exemple pédagogique synthétique — aucune donnée de marché réelle.</p></div>';

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm12-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm12-concept', step: 'lesson', outline: 'Bid, ask et exécution',
      eyebrow: 'Le mécanisme', heading: 'Un prix affiché représente une possibilité d’échange, pas une promesse d’exécution.',
      body: 'À un instant donné, le meilleur bid représente le prix acheteur le plus élevé disponible et le meilleur ask le prix vendeur le plus bas disponible. Entre les deux se trouve le spread. Quand un ordre arrive, il rencontre la liquidité disponible à ces niveaux.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Sépare toujours trois questions : quel type d’ordre est envoyé, quelle liquidité est disponible, et à quel prix l’exécution a réellement lieu.' })
    }),
    Object.freeze({
      type: 'mini_simulation', id: 'm12-ladder', step: 'lesson', outline: 'Lire une cotation',
      eyebrow: 'Observer', heading: 'Lis ce mini carnet d’ordres pédagogique.',
      prompt: 'Repère le meilleur ask, le meilleur bid et l’écart entre les deux. Les chiffres ci-dessous sont fictifs et uniquement pédagogiques.',
      state: ladder
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-market-order', step: 'lesson', outline: 'Ordre au marché',
      eyebrow: 'Décider', heading: 'Si la priorité est une exécution immédiate, que faut-il comprendre ?',
      prompt: 'Choisis la formulation la plus rigoureuse.', options: immediateOptions
    }),
    Object.freeze({
      type: 'mini_simulation', id: 'm12-market-vs-limit', step: 'lesson', outline: 'Marché vs limite',
      eyebrow: 'Comparer', heading: 'Deux instructions, deux compromis différents.',
      prompt: 'Aucune n’est “meilleure” par nature : elles répondent à des contraintes différentes.',
      state: '<div class="dda-order-compare"><article><span>ORDRE AU MARCHÉ</span><strong>Priorité : exécution</strong><p>Le prix exact n’est pas garanti et plusieurs niveaux de liquidité peuvent être consommés.</p></article><article><span>ORDRE LIMITE</span><strong>Priorité : contrainte de prix</strong><p>L’exécution n’est pas garantie et l’ordre peut rester en attente si le prix choisi n’est pas disponible.</p></article></div>'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-limit-order', step: 'lesson', outline: 'Comprendre la limite',
      eyebrow: 'Appliquer', heading: 'Que protège réellement un ordre limite ?',
      prompt: 'Choisis sans supposer qu’une exécution est garantie.', options: limitOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-spread', step: 'lesson', outline: 'Comprendre le spread',
      eyebrow: 'Lire la cotation', heading: 'Que représente le spread ?',
      prompt: 'Reviens au mini carnet ci-dessus.', options: spreadOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm12-slippage-case', step: 'lesson', outline: 'Quand le prix moyen change',
      label: 'Cas pédagogique · liquidité limitée',
      text: 'Un acheteur envoie un ordre au marché de 4 unités. Le meilleur ask affiche 50,10, mais seulement 2 unités y sont disponibles. Le niveau suivant affiche 50,12 avec suffisamment de quantité pour compléter l’ordre.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-exercise', step: 'exercise', outline: 'Exercice d’application',
      eyebrow: 'Appliquer', heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm12-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm12-journal', step: 'review', prompt: 'Résume avec tes mots la différence entre ordre au marché, ordre limite, bid, ask et spread.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm12-result', step: 'review', idSuffix: 'm12', continueTo: Object.freeze({ view: 'lesson-m13', label: 'Continuer vers Comment les marchés s’organisent ?' }), data: Object.freeze({ heading: 'Compréhension des ordres et de l’exécution confirmée.', body: 'Tu sais distinguer bid, ask, spread, ordre au marché et ordre limite, et expliquer pourquoi le prix d’exécution peut différer du premier prix affiché.' }) })
  ]);

  return Object.freeze({
    id: 'M1.2',
    title: 'Comment les ordres s’exécutent ?',
    summary: 'Lire bid, ask, spread et comprendre comment ordres au marché et ordres limites rencontrent la liquidité.',
    estimatedMinutes: 16,
    markUnderstoodLabel: 'Passer à l’exercice',
    competency,
    xp,
    content,
    practice,
    evaluation,
    steps,
    blocks
  });
}

function lessonM13() {
  const competency = Object.freeze({ id: 'market_organization_understanding', label: 'Compréhension de l’organisation des marchés' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon t’aide à situer qui fait quoi sur un marché organisé — émetteurs, investisseurs, intermédiaires, lieu de cotation — sans transformer cette carte en recommandation d’investissement ni en signal.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const actorOptions = Object.freeze([
    Object.freeze({ text: 'La société de gestion et d’intermédiation (SGI) agréée, qui transmet et exécute les ordres des investisseurs.', correct: true, feedback: 'Exact. Sur un marché organisé comme la BRVM, l’investisseur ne négocie pas directement avec l’émetteur : un intermédiaire agréé canalise les ordres.' }),
    Object.freeze({ text: 'L’entreprise vend elle-même ses actions directement aux passants, sans organisation.', correct: false, feedback: 'Non. Une émission sur un marché organisé passe par un circuit encadré : intermédiaires agréés, règles d’admission et surveillance. Ce n’est pas une vente de rue.' }),
    Object.freeze({ text: 'L’épargnant s’adresse directement à l’État pour recevoir des actions gratuitement.', correct: false, feedback: 'Non. Un titre a un prix formé par le marché, et l’accès se fait via un intermédiaire agréé — jamais par distribution gratuite.' })
  ]);

  const marketTypeOptions = Object.freeze([
    Object.freeze({ text: 'Le marché primaire : des titres nouveaux sont émis et les fonds souscrits vont à l’émetteur.', correct: true, feedback: 'Exact. À la première émission, l’argent souscrit arrive chez l’émetteur — c’est la définition du marché primaire.' }),
    Object.freeze({ text: 'Le marché secondaire : les fonds vont toujours à l’émetteur, quel que soit l’échange.', correct: false, feedback: 'Confusion fréquente. Sur le marché secondaire, les titres circulent entre investisseurs : l’émetteur ne reçoit pas l’argent de ces échanges.' }),
    Object.freeze({ text: 'Aucun marché : une première émission n’a pas besoin d’organisation.', correct: false, feedback: 'Non. Une première émission exige justement une organisation : admission à la cote, règles de transparence et intermédiaires agréés.' })
  ]);

  const organizedOptions = Object.freeze([
    Object.freeze({ text: 'Parce qu’un lieu de cotation encadré, des intermédiaires agréés et des règles communes structurent les échanges.', correct: true, feedback: 'Oui. L’organisation — admission, cotation, surveillance — est ce qui distingue un marché organisé d’un simple accord privé de gré à gré.' }),
    Object.freeze({ text: 'Parce que l’État y garantit le rendement des actions cotées.', correct: false, feedback: 'Jamais. La régulation encadre les règles du jeu ; elle ne garantit ni le rendement, ni le remboursement d’un investissement.' }),
    Object.freeze({ text: 'Parce que ses participants se recommandent des titres dans un groupe fermé.', correct: false, feedback: 'Non. Un marché ne se définit pas par des recommandations entre participants mais par son organisation. DDA n’enseigne d’ailleurs aucun signal.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: 'L’émission relève du marché primaire (les fonds vont à l’entreprise) ; la revente relève du marché secondaire (échange entre investisseurs).', correct: true, feedback: 'Bonne lecture. Tu distingues le moment où l’émetteur lève des fonds du moment où les titres circulent entre investisseurs.' }),
    Object.freeze({ text: 'Les deux opérations relèvent du marché primaire, puisque les titres sont encore récents.', correct: false, feedback: 'L’ancienneté des titres ne change rien : dès que l’échange se fait entre investisseurs, sans nouvelle émission, c’est le marché secondaire.' }),
    Object.freeze({ text: 'La revente finance directement l’entreprise, comme au moment de l’émission.', correct: false, feedback: 'Non. À la revente, l’argent change de mains entre investisseurs ; l’émetteur n’est pas destinataire de ce paiement.' })
  ]);

  const practice = Object.freeze({
    id: 'm13-exercise',
    label: 'Exercice d’application',
    heading: 'Situer une opération complète',
    prompt: 'Une entreprise émet de nouvelles actions via la BRVM. Trois mois plus tard, un investisseur revend ses titres à un autre épargnant, par l’intermédiaire de sa SGI. Quelle lecture situe correctement les deux étapes ?',
    successText: 'Bonne lecture. Tu distingues le moment où l’émetteur lève des fonds du moment où les titres circulent entre investisseurs.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm13-quiz',
    label: 'Quiz de validation',
    heading: 'Qu’est-ce qu’un marché organisé, au juste ?',
    prompt: 'Choisis la définition la plus rigoureuse.',
    successText: 'Correct. Tu situes émetteurs, investisseurs, intermédiaires et lieu de cotation au sein d’une organisation encadrée.',
    choices: Object.freeze([
      Object.freeze({ text: 'Une organisation régulée qui relie ceux qui cherchent des capitaux et ceux qui en apportent, via des intermédiaires agréés, puis laisse les titres s’échanger entre participants.', correct: true }),
      Object.freeze({ text: 'Une institution qui garantit aux épargnants un rendement fixe sur leurs actions.', correct: false, feedback: 'Aucun rendement n’est garanti sur un marché. La régulation encadre les règles du jeu, pas le résultat des investissements.' }),
      Object.freeze({ text: 'Un réseau fermé où des experts indiquent aux membres quels titres acheter.', correct: false, feedback: 'Non. Ça, ce serait un groupe de signaux — l’exact contraire de ce que DDA enseigne. Un marché organisé se définit par ses règles et ses acteurs, jamais par des recommandations.' })
    ])
  });

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm13-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm13-concept', step: 'lesson', outline: 'Qui fait quoi ?', eyebrow: 'Le concept',
      heading: 'Un marché organisé est une organisation, pas un endroit magique.',
      body: 'Sur un marché financier, deux besoins se rencontrent : des émetteurs (entreprises, États) cherchent des capitaux, et des investisseurs cherchent à placer leur épargne. Entre eux, des intermédiaires agréés transmettent les ordres, et un lieu de cotation encadré fixe les règles du jeu.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Comprends d’abord la carte des acteurs — qui émet, qui investit, qui sert d’intermédiaire, où les titres se négocient. La lecture des prix vient ensuite, jamais l’inverse.' })
    }),
    Object.freeze({
      type: 'image_explainer', id: 'm13-market-actors', step: 'lesson', outline: 'Schéma des acteurs et des deux marchés',
      src: 'images/lessons/m13-market-actors.svg', tone: 'dark',
      alt: 'Schéma du marché primaire : un émetteur crée des titres, des investisseurs y souscrivent par des intermédiaires sur la BRVM et les fonds vont à l’émetteur. Sur le marché secondaire, deux investisseurs échangent un titre par la SGI et la BRVM; l’émetteur ne reçoit pas le paiement.',
      caption: 'Primaire : l’émetteur lève des fonds. Secondaire : les investisseurs échangent entre eux.'
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-case-brvm', step: 'lesson', outline: 'Cas concret · BRVM', label: 'Cas concret · côte régionale',
      text: 'Une entreprise de la région veut financer son expansion. Plutôt qu’un simple prêt, elle peut être admise à la BRVM — la bourse commune aux 8 pays de l’UEMOA — et y émettre des actions. Un épargnant, à Abidjan comme ailleurs, peut alors y souscrire : pas dans la rue ni de main à main, mais par l’intermédiaire d’une société de gestion et d’intermédiation (SGI) agréée.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-actor', step: 'lesson', outline: 'Situer l’intermédiaire', eyebrow: 'À toi de situer',
      heading: 'Qui joue le rôle d’intermédiaire dans ce circuit ?', prompt: 'Observe la chaîne entre l’entreprise et l’épargnant.', options: actorOptions
    }),
    Object.freeze({
      type: 'text_short', id: 'm13-primary-secondary', step: 'lesson', outline: 'Primaire et secondaire', eyebrow: 'Deux étages du même marché',
      heading: 'Primaire et secondaire : le même titre, deux moments différents.',
      body: 'Au moment de l’émission, le titre est créé et l’argent souscrit va à l’émetteur : c’est le marché primaire. Ensuite, ce même titre peut s’échanger entre investisseurs, sans que l’émetteur touche quoi que ce soit à ces transactions : c’est le marché secondaire.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-market-type', step: 'lesson', outline: 'Situer le marché', eyebrow: 'À toi de situer',
      heading: 'Sur quel marché cette situation se joue-t-elle ?', prompt: 'Une entreprise émet des actions pour la première fois afin de financer une usine.', options: marketTypeOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-organized', step: 'lesson', outline: 'Pourquoi « organisé » ?', eyebrow: 'Comprendre',
      heading: 'Pourquoi parle-t-on de marché « organisé » ?', prompt: 'Choisis sans chercher de garantie — il n’y en a pas.', options: organizedOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-exercise-case', step: 'exercise', outline: 'Exercice d’application', label: 'Exercice d’application',
      text: 'Tu viens de voir les deux étages séparément. Maintenant, replace-les ensemble dans une seule histoire : une émission, puis, quelques mois plus tard, une revente entre deux épargnants. Même titre, même bourse — deux moments qui ne relèvent pas du même marché.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-exercise', step: 'exercise', outline: 'Situer l’opération complète', eyebrow: 'Appliquer',
      heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm13-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm13-journal', step: 'review', prompt: 'Explique dans ton Journal, avec tes propres mots, la différence entre marché primaire et marché secondaire — et qui intervient à chaque étape.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm13-result', step: 'review', idSuffix: 'm13', data: Object.freeze({ heading: 'Compréhension de l’organisation des marchés confirmée.', body: 'Tu as situé émetteurs, investisseurs, intermédiaires et lieu de cotation, et distingué marché primaire et marché secondaire — sans transformer cette lecture en recommandation, en signal ni en promesse.' }) })
  ]);

  return Object.freeze({
    id: 'M1.3',
    title: 'Comment les marchés s’organisent ?',
    summary: 'Émetteurs, investisseurs, intermédiaires agréés, lieu de cotation — et la différence entre marché primaire et secondaire.',
    estimatedMinutes: 15,
    markUnderstoodLabel: 'Passer à l’exercice',
    competency,
    xp,
    content,
    practice,
    evaluation,
    steps,
    blocks
  });
}

// Keyed by the exact lesson ids the client already uses (LESSON_REGISTRY in
// dist/app.js) — the route just looks this up, nothing more.
const M1_CONTENT = Object.freeze({
  'M1.1': lessonM11(),
  'M1.2': lessonM12(),
  'M1.3': lessonM13()
});

module.exports = { M1_CONTENT };
