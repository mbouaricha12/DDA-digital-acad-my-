// DDA M1.1 — Golden Lesson: Pourquoi les prix évoluent ?
// Authored lesson definition only. This file is intentionally isolated from main
// routing until the M0 -> M1 integration gate is completed and verified.
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM1GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const competency = Object.freeze({
    id: 'price_formation_understanding',
    label: 'Compréhension de la formation du prix'
  });

  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });

  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const buyPressureOptions = Object.freeze([
    Object.freeze({
      text: 'Le prix peut progresser si les acheteurs agressifs consomment les offres de vente disponibles.',
      correct: true,
      feedback: 'Oui. Le point important n’est pas “il y a des acheteurs”, mais que des acheteurs acceptent les prix disponibles et absorbent la liquidité vendeuse.'
    }),
    Object.freeze({
      text: 'Le prix monte automatiquement dès qu’un seul achat apparaît.',
      correct: false,
      feedback: 'Non. Une transaction isolée ne suffit pas. Le mouvement dépend du flux d’ordres, de la liquidité disponible et de la capacité des vendeurs à absorber la demande.'
    }),
    Object.freeze({
      text: 'Le vendeur disparaît du marché et il n’existe plus de contrepartie.',
      correct: false,
      feedback: 'Non. Une transaction nécessite toujours une contrepartie. Ce qui change, c’est le prix auquel la prochaine contrepartie accepte d’échanger.'
    })
  ]);

  const sellPressureOptions = Object.freeze([
    Object.freeze({
      text: 'Le prix peut reculer si les vendeurs agressifs consomment les ordres d’achat disponibles.',
      correct: true,
      feedback: 'Exact. Une pression vendeuse peut déplacer le prix vers les prochains acheteurs disponibles lorsque la liquidité acheteuse proche est absorbée.'
    }),
    Object.freeze({
      text: 'Le prix baisse parce que le marché décide volontairement de punir les acheteurs.',
      correct: false,
      feedback: 'Non. Le marché n’a pas d’intention unique. Le prix reflète l’exécution d’ordres entre de nombreux participants.'
    }),
    Object.freeze({
      text: 'Toute vente entraîne nécessairement une baisse importante.',
      correct: false,
      feedback: 'Non. Une vente peut être absorbée sans grand déplacement si suffisamment d’acheteurs sont disponibles au même niveau.'
    })
  ]);

  const balanceOptions = Object.freeze([
    Object.freeze({
      text: 'Le prix peut osciller dans une zone lorsque les pressions restent relativement équilibrées.',
      correct: true,
      feedback: 'Oui. Tant qu’aucun côté ne crée un déséquilibre suffisamment durable, le prix peut rester dans une zone d’équilibre relatif.'
    }),
    Object.freeze({
      text: 'Un marché équilibré signifie que le prix ne bougera plus jamais.',
      correct: false,
      feedback: 'Non. L’équilibre est temporaire. De nouveaux ordres, de nouvelles informations ou un changement de liquidité peuvent modifier la situation.'
    }),
    Object.freeze({
      text: 'Le range prouve qu’aucun participant n’achète ou ne vend.',
      correct: false,
      feedback: 'Non. Il y a toujours des échanges. Un range montre surtout qu’aucun camp ne domine durablement la zone observée.'
    })
  ]);

  const finalExerciseOptions = Object.freeze([
    Object.freeze({
      text: 'Pression acheteuse dominante : les achats agressifs absorbent progressivement la liquidité vendeuse proche.',
      correct: true,
      feedback: 'Bonne lecture. Tu relies le mouvement potentiel au déséquilibre et à la liquidité, pas à une formule “plus d’acheteurs = hausse automatique”.'
    }),
    Object.freeze({
      text: 'Équilibre parfait : aucune transaction ne peut déplacer le prix.',
      correct: false,
      feedback: 'Ce n’est pas un équilibre parfait : le scénario décrit justement une absorption répétée de la liquidité vendeuse.'
    }),
    Object.freeze({
      text: 'Pression vendeuse dominante parce qu’il existe encore des vendeurs.',
      correct: false,
      feedback: 'La présence de vendeurs ne suffit pas à conclure. Observe qui consomme la liquidité et quel côté impose davantage ses prix.'
    })
  ]);

  const quiz = Object.freeze({
    id: 'm1-quiz',
    label: 'Quiz de validation',
    heading: 'Qu’est-ce qui décrit le mieux la formation d’un mouvement de prix ?',
    prompt: 'Choisis la réponse la plus précise.',
    successText: 'Correct. Tu relies le prix aux échanges, à la liquidité et aux déséquilibres entre participants.',
    choices: Object.freeze([
      Object.freeze({
        text: 'Le prix évolue quand l’exécution des ordres et la liquidité disponible créent un déséquilibre entre les deux côtés du marché.',
        correct: true
      }),
      Object.freeze({
        text: 'Le prix évolue uniquement parce qu’il y a davantage de personnes qui veulent acheter que vendre.',
        correct: false,
        feedback: 'Cette phrase est trop simpliste : chaque transaction a un acheteur et un vendeur. Ce qui compte est notamment l’agressivité des ordres et la liquidité disponible aux différents prix.'
      }),
      Object.freeze({
        text: 'Le prix suit une direction décidée à l’avance par le marché.',
        correct: false,
        feedback: 'Non. DDA n’enseigne pas une direction prédéterminée : le prix résulte d’interactions continues entre participants.'
      })
    ])
  });

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm1-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm1-concept', step: 'lesson', outline: 'Le prix est un résultat, pas une volonté', eyebrow: 'Le concept',
      heading: 'Le prix se déplace quand l’équilibre des échanges change.',
      body: 'Chaque transaction relie un acheteur et un vendeur. Ce qui peut déplacer le prix, c’est la façon dont les ordres arrivent, la quantité de liquidité disponible aux différents niveaux et la capacité d’un côté à absorber l’autre.',
      principle: Object.freeze({
        label: 'Principe essentiel',
        text: 'Ne réduis pas le marché à “plus d’acheteurs que de vendeurs”. Chaque échange a deux côtés ; observe plutôt qui accepte les prix disponibles et quelle liquidité reste à absorber.'
      })
    }),
    Object.freeze({
      type: 'case_study', id: 'm1-case-buyers', step: 'lesson', outline: 'Cas 1 · pression acheteuse', label: 'Cas 1 · pression acheteuse',
      text: 'Plusieurs acheteurs exécutent rapidement leurs ordres. Les offres de vente proches sont progressivement absorbées et les prochaines offres disponibles se trouvent plus haut.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm1-buy-pressure', step: 'lesson', outline: 'Décider', eyebrow: 'À toi de raisonner',
      heading: 'Que peut-il se passer sur le prix ?', prompt: 'Choisis l’explication la plus rigoureuse.', options: buyPressureOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm1-case-sellers', step: 'lesson', outline: 'Cas 2 · pression vendeuse', label: 'Cas 2 · pression vendeuse',
      text: 'Des vendeurs exécutent agressivement leurs ordres. Les achats disponibles au prix courant sont absorbés et les prochains acheteurs se trouvent plus bas.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm1-sell-pressure', step: 'lesson', outline: 'Décider', eyebrow: 'Nouveau cas',
      heading: 'Quelle lecture est la plus juste ?', prompt: 'Raisonne avec la liquidité et les contreparties.', options: sellPressureOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm1-case-balance', step: 'lesson', outline: 'Cas 3 · équilibre relatif', label: 'Cas 3 · équilibre relatif',
      text: 'Acheteurs et vendeurs se répondent dans une même zone. Les poussées d’un côté sont régulièrement absorbées par l’autre et aucune direction ne s’impose durablement.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm1-balance', step: 'lesson', outline: 'Décider', eyebrow: 'Comprendre le range',
      heading: 'Que décrit le mieux cette situation ?', prompt: 'Choisis sans chercher à prédire la sortie du range.', options: balanceOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm1-exercise-case', step: 'exercise', outline: 'Exercice d’application', label: 'Exercice d’application',
      text: 'Sur plusieurs échanges successifs, les ordres d’achat agressifs continuent d’absorber les offres de vente proches. Les vendeurs doivent proposer leurs ordres à des prix progressivement plus élevés pour trouver de nouvelles contreparties.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm1-exercise', step: 'exercise', outline: 'Identifier le déséquilibre', eyebrow: 'Appliquer',
      heading: 'Quelle lecture décrit le mieux ce scénario ?', prompt: 'Choisis la cause la plus cohérente avec les échanges observés.', options: finalExerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm1-quiz', step: 'quiz', outline: quiz.heading, locked: true, data: quiz }),
    Object.freeze({
      type: 'journal_link', id: 'm1-journal', step: 'review',
      prompt: 'Écris avec tes propres mots pourquoi un prix peut monter, baisser ou rester en range.', cta: 'Ouvrir Journal & Plan'
    }),
    Object.freeze({
      type: 'summary', id: 'm1-result', step: 'review', idSuffix: 'm11',
      data: Object.freeze({
        heading: 'Compréhension de la formation du prix confirmée.',
        body: 'Tu as relié hausse, baisse et équilibre relatif aux ordres, à la liquidité et aux déséquilibres — sans transformer cette lecture en prédiction ou en signal.'
      })
    })
  ]);

  return Object.freeze({
    id: 'M1.1',
    title: 'Pourquoi les prix évoluent ?',
    summary: 'Comprendre comment ordres, liquidité et déséquilibres peuvent déplacer le prix — sans signal ni prédiction.',
    estimatedMinutes: 15,
    markUnderstoodLabel: 'Passer à l’exercice',
    competency,
    xp,
    steps,
    blocks
  });
});
