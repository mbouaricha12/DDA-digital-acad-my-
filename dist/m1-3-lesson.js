// DDA M1.3 — Golden Lesson #6 : Comment les marchés s'organisent ?
// Même contrat authored que m1-1-lesson.js / m1-2-lesson.js : fichier dédié,
// global DDAM13GoldenLesson promu dans le curriculum par dda-core.js, zéro
// signal / zéro prédiction / zéro promesse — contenu pédagogique statique.
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM13GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // M1's real module summary (dda-core.js) promises two things: « Pourquoi
  // les prix évoluent » (M1.1, M1.2 covered) « et comment les marchés
  // s'organisent » — the remaining, real gap this lesson closes. It must NOT
  // step onto M2's territory (risque et discipline): no position sizing, no
  // loss management here, only the map of actors and venues.
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

  // Une identité propre, différente de M1.1 (raisonnement cause→effet sur le
  // prix, zéro organisation) et de M1.2 (lire une cotation/une exécution) :
  // ici, l'acte est de SITUER — un rôle, un lieu, un circuit — jamais de
  // juger où va le prix. Aucune donnée de marché, réelle ou synthétique.
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm13-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm13-concept', step: 'lesson', outline: 'Qui fait quoi ?', eyebrow: 'Le concept',
      heading: 'Un marché organisé est une organisation, pas un endroit magique.',
      body: 'Sur un marché financier, deux besoins se rencontrent : des émetteurs (entreprises, États) cherchent des capitaux, et des investisseurs cherchent à placer leur épargne. Entre eux, des intermédiaires agréés transmettent les ordres, et un lieu de cotation encadré fixe les règles du jeu.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Comprends d’abord la carte des acteurs — qui émet, qui investit, qui sert d’intermédiaire, où les titres se négocient. La lecture des prix vient ensuite, jamais l’inverse.' })
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
});
