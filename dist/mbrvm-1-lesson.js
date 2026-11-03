// DDA MBRVM.1 — Introduction à la BRVM
// Même contrat authored que m1-1-lesson.js / m1-2-lesson.js / m1-3-lesson.js :
// fichier dédié, global DDAMBRVM1Lesson promu dans le curriculum par
// dda-core.js, zéro donnée de marché réelle ou simulée, zéro signal, zéro
// promesse de rendement — contenu pédagogique statique uniquement (mandat
// §6.1/§6.2 : distinguer clairement l'éditorial pédagogique des données de
// marché réelles, qui vivent ailleurs — dist/bff-client.js getBrvmPublications
// — et ne sont jamais mélangées ici).
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAMBRVM1Lesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Module BRVM indépendant (mandat §6) : une leçon d'introduction, pas encore
  // un parcours complet. Aucune donnée de cours, de capitalisation ou de
  // rendement réelle n'est citée ici — seulement les définitions et la
  // mécanique, jamais un chiffre qui daterait ou qui ressemblerait à une cote.
  const competency = Object.freeze({ id: 'brvm_market_structure_understanding', label: 'Compréhension de la structure du marché BRVM' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon te donne les repères de base pour comprendre la Bourse Régionale des Valeurs Mobilières (BRVM) — ce qu’elle est, ce qui s’y échange, et comment lire une capitalisation. Aucune donnée de marché réelle n’est utilisée ici : c’est une carte, pas une cote.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const instrumentOptions = Object.freeze([
    Object.freeze({ text: 'Une action : une part de propriété de l’entreprise, sans échéance ni remboursement promis.', correct: true, feedback: 'Exact. L’actionnaire est copropriétaire de l’entreprise — il ne prête pas d’argent avec une promesse de remboursement.' }),
    Object.freeze({ text: 'Une obligation : un prêt consenti à l’émetteur, avec un remboursement et des intérêts prévus au contrat.', correct: false, feedback: 'C’est la description d’une obligation, pas d’une action. Une action ne porte aucune promesse de remboursement ni d’intérêt fixe.' }),
    Object.freeze({ text: 'Un dépôt bancaire garanti par l’État.', correct: false, feedback: 'Non. Une action cotée à la BRVM n’est ni un dépôt bancaire, ni garantie par l’État — sa valeur varie selon le marché.' })
  ]);

  const bondOptions = Object.freeze([
    Object.freeze({ text: 'Un prêt que l’investisseur consent à l’émetteur (entreprise ou État), remboursé à une échéance avec des intérêts prévus.', correct: true, feedback: 'Exact. L’obligataire est créancier, pas propriétaire : il prête, et le contrat fixe l’échéance et les intérêts.' }),
    Object.freeze({ text: 'Une part de propriété de l’entreprise, comme une action.', correct: false, feedback: 'Non — c’est la définition d’une action. Une obligation ne donne aucun droit de propriété.' }),
    Object.freeze({ text: 'Un pari sur la hausse ou la baisse du prix d’une action.', correct: false, feedback: 'Non. Une obligation n’est pas un pari sur un prix : c’est un contrat de prêt avec des conditions fixées à l’avance.' })
  ]);

  const capOptions = Object.freeze([
    Object.freeze({ text: 'Le nombre total d’actions émises multiplié par le prix d’une action.', correct: true, feedback: 'Exact. La capitalisation boursière mesure la valeur totale attribuée par le marché à l’ensemble des actions d’une entreprise, à cet instant.' }),
    Object.freeze({ text: 'Le montant des bénéfices annuels de l’entreprise.', correct: false, feedback: 'Non — ce sont deux notions différentes. Les bénéfices mesurent un résultat ; la capitalisation mesure la valeur de marché des actions.' }),
    Object.freeze({ text: 'Le montant total des dettes de l’entreprise.', correct: false, feedback: 'Non. La capitalisation boursière ne mesure pas l’endettement, seulement la valeur de marché attribuée aux actions.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: '10 000 000 actions × 1 500 FCFA = 15 000 000 000 FCFA de capitalisation.', correct: true, feedback: 'Bonne lecture. Tu as appliqué la formule nombre d’actions × prix sans la confondre avec un autre indicateur.' }),
    Object.freeze({ text: 'La capitalisation est égale au prix d’une seule action, soit 1 500 FCFA.', correct: false, feedback: 'Non — le prix d’une seule action n’est pas la capitalisation de l’entreprise entière. Il faut multiplier par le nombre total d’actions.' }),
    Object.freeze({ text: 'La capitalisation ne peut pas être calculée sans connaître les bénéfices de l’entreprise.', correct: false, feedback: 'Non. La capitalisation se calcule uniquement à partir du nombre d’actions et du prix — les bénéfices ne font pas partie de cette formule.' })
  ]);

  const practice = Object.freeze({
    id: 'mbrvm1-exercise',
    label: 'Exercice d’application',
    heading: 'Calculer une capitalisation (exemple pédagogique, aucune donnée réelle)',
    prompt: 'Une entreprise fictive a émis 10 000 000 actions, et le marché valorise chaque action à 1 500 FCFA. Quelle est sa capitalisation boursière ?',
    successText: 'Bonne lecture. Tu as appliqué la formule nombre d’actions × prix sans la confondre avec un autre indicateur.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'mbrvm1-quiz',
    label: 'Quiz de validation',
    heading: 'Que retiens-tu de l’organisation de la BRVM ?',
    prompt: 'Choisis la définition la plus rigoureuse.',
    successText: 'Correct. Tu distingues actions et obligations, et tu sais ce que mesure une capitalisation boursière.',
    choices: Object.freeze([
      Object.freeze({ text: 'La BRVM est une bourse régionale commune à plusieurs pays de l’UEMOA, où s’échangent des actions et des obligations via des intermédiaires agréés (SGI).', correct: true }),
      Object.freeze({ text: 'La BRVM garantit un rendement fixe à tous les épargnants qui y investissent.', correct: false, feedback: 'Jamais. Aucune bourse ne garantit de rendement — la valeur des actions varie selon le marché.' }),
      Object.freeze({ text: 'La BRVM est réservée aux banques et n’accepte aucun épargnant individuel.', correct: false, feedback: 'Non. Un épargnant individuel peut investir à la BRVM, toujours par l’intermédiaire d’une SGI agréée.' })
    ])
  });

  // Une identité propre, distincte de M1.3 (qui situe émetteurs/investisseurs/
  // intermédiaires en général, avec la BRVM comme simple exemple) : ici, le
  // sujet EST la BRVM — son périmètre régional, ses deux grandes familles
  // d'instruments (actions, obligations) et sa mesure de référence
  // (capitalisation boursière). Aucune cote, aucun indice, aucune donnée
  // datée n'est citée — uniquement la mécanique, pour rester vraie quelle que
  // soit la date de lecture.
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'mbrvm1-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'mbrvm1-concept', step: 'lesson', outline: 'Qu’est-ce que la BRVM ?', eyebrow: 'Le concept',
      heading: 'La BRVM est une bourse régionale, commune à 8 pays.',
      body: 'La Bourse Régionale des Valeurs Mobilières (BRVM) est le marché boursier commun aux 8 pays de l’Union Économique et Monétaire Ouest-Africaine (UEMOA). Une entreprise d’un de ces pays peut y être admise et y émettre des titres ; un épargnant de la région peut y investir, toujours par l’intermédiaire d’une société de gestion et d’intermédiation (SGI) agréée — jamais directement.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Une bourse régionale ne change pas la nature des instruments : elle change seulement le lieu et les règles communes qui encadrent leur échange.' })
    }),
    Object.freeze({
      type: 'text_short', id: 'mbrvm1-instruments', step: 'lesson', outline: 'Deux grandes familles de titres', eyebrow: 'Ce qui s’échange',
      heading: 'Actions et obligations : deux contrats très différents.',
      body: 'Une action fait de l’investisseur un copropriétaire de l’entreprise — sans échéance ni remboursement garanti, sa valeur suit la valorisation du marché. Une obligation fait de l’investisseur un créancier — il prête à l’émetteur, qui s’engage à rembourser à une échéance fixée, avec des intérêts prévus au contrat. Les deux se négocient à la BRVM, mais elles n’offrent ni les mêmes droits, ni les mêmes risques.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'mbrvm1-identify-action', step: 'lesson', outline: 'Reconnaître une action', eyebrow: 'À toi de situer',
      heading: 'Laquelle de ces descriptions correspond à une action ?', prompt: 'Choisis la définition exacte.', options: instrumentOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'mbrvm1-identify-bond', step: 'lesson', outline: 'Reconnaître une obligation', eyebrow: 'À toi de situer',
      heading: 'Laquelle de ces descriptions correspond à une obligation ?', prompt: 'Choisis la définition exacte.', options: bondOptions
    }),
    Object.freeze({
      type: 'text_short', id: 'mbrvm1-capitalization', step: 'lesson', outline: 'La capitalisation boursière', eyebrow: 'Une mesure de référence',
      heading: 'La capitalisation boursière, en une formule.',
      body: 'La capitalisation boursière d’une entreprise cotée se calcule en multipliant le nombre total d’actions émises par le prix auquel une action se négocie à cet instant. Elle mesure la valeur que le marché attribue à l’ensemble de l’entreprise — ni ses bénéfices, ni ses dettes, seulement la valeur de ses actions au prix du marché.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Capitalisation = nombre d’actions × prix d’une action. Rien de plus, rien de moins — et jamais une mesure figée : elle varie avec le prix.' })
    }),
    Object.freeze({
      type: 'decision_choice', id: 'mbrvm1-cap-check', step: 'lesson', outline: 'Vérifier la formule', eyebrow: 'Comprendre',
      heading: 'Que mesure exactement la capitalisation boursière ?', prompt: 'Choisis la définition la plus rigoureuse.', options: capOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'mbrvm1-exercise-case', step: 'exercise', outline: 'Exercice d’application', label: 'Exercice d’application',
      text: 'Tu as vu séparément les deux familles de titres et la formule de capitalisation. Applique-la maintenant sur un exemple pédagogique — les chiffres sont fictifs, choisis uniquement pour l’exercice, jamais une cote réelle.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'mbrvm1-exercise', step: 'exercise', outline: 'Calculer une capitalisation', eyebrow: 'Appliquer',
      heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'mbrvm1-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'mbrvm1-journal', step: 'review', prompt: 'Explique dans ton Journal, avec tes propres mots, la différence entre une action et une obligation, et ce que mesure une capitalisation boursière.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'mbrvm1-result', step: 'review', idSuffix: 'mbrvm1', data: Object.freeze({ heading: 'Compréhension de la structure du marché BRVM confirmée.', body: 'Tu as distingué actions et obligations, et tu sais calculer une capitalisation boursière — sans aucune donnée de marché réelle, aucun signal et aucune promesse de rendement.' }) })
  ]);

  return Object.freeze({
    id: 'MBRVM.1',
    title: 'Introduction à la BRVM',
    summary: 'La bourse régionale UEMOA, ses deux familles de titres (actions, obligations) et la capitalisation boursière.',
    estimatedMinutes: 14,
    markUnderstoodLabel: 'Passer à l’exercice',
    competency,
    xp,
    content,
    practice,
    evaluation,
    steps,
    blocks
  });
});
