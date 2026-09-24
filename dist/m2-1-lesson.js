// DDA M2.1 — Golden Lesson #7 : Protéger son capital
// Leçon authored du module M2 « Risque et discipline » : asymétrie des
// pertes/gains, invalidation préparée avant la décision et survie du capital.
// Zéro signal, zéro prédiction, zéro promesse, zéro cotation en direct.
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM21GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const competency = Object.freeze({ id: 'capital_protection', label: 'Protection du capital et discipline du risque' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 90, quizComplete: 150 });
  const content = Object.freeze({
    lead: 'Avant de rechercher la rentabilité, apprends à protéger la capacité de continuer : les pertes et les gains ne sont pas symétriques, et une limite d’invalidation se prépare avant la décision.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Comprendre' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const asymmetryOptions = Object.freeze([
    Object.freeze({ text: 'Après une perte de 50 %, il faut un gain de 100 % sur le capital restant pour revenir au capital initial.', correct: true, feedback: 'Exact. Le pourcentage de récupération se calcule sur le capital restant, pas sur le capital de départ.' }),
    Object.freeze({ text: 'Après une perte de 50 %, un gain de 50 % suffit toujours pour revenir au point de départ.', correct: false, feedback: 'Non. 50 % du capital restant représente seulement la moitié de ce qui a été perdu : la base de calcul a changé.' }),
    Object.freeze({ text: 'Une perte de 50 % et un gain de 50 % s’annulent parce que les pourcentages sont identiques.', correct: false, feedback: 'Les pourcentages ne portent pas sur la même base. La perte s’applique au capital initial, le gain au capital déjà diminué.' })
  ]);

  const invalidationOptions = Object.freeze([
    Object.freeze({ text: 'Définir avant la décision ce qui invaliderait l’idée et quelle action de protection serait prévue si cela se produit.', correct: true, feedback: 'Oui. Une limite d’invalidation est une condition préparée avant l’émotion du moment, pas une réaction improvisée.' }),
    Object.freeze({ text: 'Attendre que la perte devienne inconfortable, puis chercher après coup une raison de sortir.', correct: false, feedback: 'Cela transforme la discipline en réaction émotionnelle. La limite d’invalidation doit être réfléchie avant l’exposition.' }),
    Object.freeze({ text: 'Choisir un stop uniquement parce qu’un niveau est populaire, sans expliquer ce qui rendrait l’idée fausse.', correct: false, feedback: 'Un stop n’est pas un nombre rituel. Il doit être relié à l’invalidation de l’idée et aux contraintes réelles de la décision.' })
  ]);

  const disciplineOptions = Object.freeze([
    Object.freeze({ text: 'Une taille cohérente avec l’invalidation définie, les contraintes de la situation et une perte que l’on peut réellement accepter — sans pourcentage universel.', correct: true, feedback: 'Bonne discipline. La protection du capital ne repose pas sur un chiffre magique : elle commence par une perte définie et supportable.' }),
    Object.freeze({ text: 'Appliquer exactement la même taille à chaque situation, car une règle unique protège toujours le capital.', correct: false, feedback: 'Non. Les situations, les instruments, la liquidité et les contraintes varient. DDA n’impose aucun dogme rigide de sizing.' }),
    Object.freeze({ text: 'Augmenter la taille après une perte pour récupérer plus vite le capital initial.', correct: false, feedback: 'C’est l’escalade émotionnelle que cette leçon cherche à éviter : accélérer la récupération peut fragiliser davantage le capital restant.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: 'Je clarifie ce qui invaliderait l’idée, je prévois ma limite avant la décision, puis je choisis une exposition compatible avec la survie du capital.', correct: true, feedback: 'Bonne synthèse. Tu relies l’asymétrie des pertes, l’invalidation préalable et la priorité donnée à la survie du capital.' }),
    Object.freeze({ text: 'Je cherche d’abord la rentabilité espérée, puis je déciderai de la limite si le résultat devient inconfortable.', correct: false, feedback: 'La séquence est inversée. DDA place la protection et l’invalidation avant toute recherche de rentabilité.' }),
    Object.freeze({ text: 'Je choisis une taille fixe et un stop identique pour toutes les situations afin de ne plus avoir à réfléchir.', correct: false, feedback: 'Une mécanique identique n’est pas une discipline universelle. La situation, l’invalidation et les contraintes doivent être comprises avant la taille.' })
  ]);

  const practice = Object.freeze({
    id: 'm21-exercise',
    label: 'Exercice d’application',
    heading: 'Construire une décision défendable',
    prompt: 'Quelle séquence protège le mieux ta capacité à continuer d’apprendre, sans promettre de résultat ?',
    successText: 'Bonne synthèse. Tu relies l’asymétrie des pertes, l’invalidation préalable et la priorité donnée à la survie du capital.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm21-quiz',
    label: 'Quiz de validation',
    heading: 'Quel principe doit passer avant la rentabilité ?',
    prompt: 'Choisis la formulation la plus rigoureuse.',
    successText: 'Correct. Tu sais pourquoi une perte se récupère de façon asymétrique, pourquoi l’invalidation se prépare avant la décision et pourquoi le capital doit survivre.',
    choices: Object.freeze([
      Object.freeze({ text: 'Protéger la capacité de continuer : comprendre la perte possible, définir l’invalidation et éviter qu’une décision menace la survie du capital.', correct: true }),
      Object.freeze({ text: 'Chercher la meilleure rentabilité possible, puis ajuster la protection si le scénario ne se déroule pas comme prévu.', correct: false, feedback: 'Non. Une rentabilité espérée ne doit jamais passer avant une limite d’invalidation réfléchie et la survie du capital.' }),
      Object.freeze({ text: 'Utiliser un pourcentage et une taille identiques dans toutes les situations pour garantir une discipline parfaite.', correct: false, feedback: 'Aucun chiffre universel ne garantit une discipline parfaite. Le contexte et l’invalidation doivent être compris, sans dogme rigide de sizing.' })
    ])
  });

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm21-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm21-asymmetry', step: 'lesson', outline: 'L’asymétrie des pertes', eyebrow: 'Le mécanisme',
      heading: 'Une perte et un gain ne se compensent pas sur la même base.',
      body: 'Une perte de 50 % laisse seulement la moitié du capital initial. En notation simple, -50% exige +100% pour revenir au capital initial : ce gain se calcule sur le capital restant. La perte a donc augmenté l’effort nécessaire de récupération : c’est une contrainte mathématique, pas une opinion sur le marché.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Le capital restant devient la nouvelle base de calcul. Plus une perte est profonde, plus le retour au point de départ exige un gain disproportionné.' })
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-asymmetry-check', step: 'lesson', outline: 'Vérifier le calcul',
      eyebrow: 'À toi de raisonner', heading: 'Que faut-il pour revenir après une perte de 50 % ?',
      prompt: 'Ne compare pas seulement les nombres : regarde la base sur laquelle chaque pourcentage s’applique.', options: asymmetryOptions
    }),
    Object.freeze({
      type: 'text_short', id: 'm21-invalidation', step: 'lesson', outline: 'Préparer l’invalidation', eyebrow: 'Avant la décision',
      heading: 'Une limite d’invalidation se définit avant l’exposition.',
      body: 'Une limite d’invalidation (stop) décrit à l’avance ce qui montrerait que l’idée de départ n’est plus valable et quelle action de protection serait alors prévue. Elle ne prédit pas le marché et ne garantit ni une exécution ni une perte exacte : elle rend la décision vérifiable avant que l’émotion ne prenne le dessus.',
      principle: Object.freeze({ label: 'Question à écrire avant toute décision', text: 'Qu’est-ce qui invaliderait mon idée, et que ferai-je si cette condition apparaît ?' })
    }),
    Object.freeze({
      type: 'case_study', id: 'm21-invalidation-case', step: 'lesson', outline: 'Cas pédagogique · plan écrit', label: 'Cas pédagogique · aucune cotation en direct',
      text: 'Avant toute exposition, une personne écrit son hypothèse, l’observation qui l’invaliderait et l’action de protection prévue. Si l’invalidation survient, elle applique le plan au lieu de déplacer la limite pour éviter d’admettre l’erreur. Le cas ne contient aucun prix réel, aucun flux en direct et aucun signal à suivre.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-invalidation-check', step: 'lesson', outline: 'Reconnaître un vrai stop',
      eyebrow: 'Distinguer le plan de la réaction', heading: 'Quelle formulation décrit une limite d’invalidation saine ?',
      prompt: 'Cherche une condition préparée, pas une réaction après la perte.', options: invalidationOptions
    }),
    Object.freeze({
      type: 'text_short', id: 'm21-survival', step: 'lesson', outline: 'La survie du capital', eyebrow: 'Priorité DDA',
      heading: 'Survivre vient avant rechercher la rentabilité.',
      body: 'La priorité n’est pas de gagner sur chaque décision : c’est de préserver la capacité à observer, apprendre, réévaluer et continuer. La survie du capital passe avant la recherche de rentabilité. Une décision qui menace cette capacité doit être questionnée avant toute promesse de performance. DDA ne fournit ni signal, ni prédiction, ni rendement attendu.',
      principle: Object.freeze({ label: 'Ordre des priorités', text: 'Survie du capital d’abord. Compréhension et discipline ensuite. La rentabilité n’est jamais une promesse ni le point de départ du raisonnement.' })
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-sizing-discipline', step: 'lesson', outline: 'Éviter le dogme de taille',
      eyebrow: 'Sans chiffre magique', heading: 'Comment penser l’exposition sans appliquer une recette rigide ?',
      prompt: 'Une taille n’a de sens qu’après l’invalidation et les contraintes de la situation.', options: disciplineOptions,
      note: 'Le sizing est une décision de contexte, pas une consigne universelle. Si la perte possible ou l’invalidation ne sont pas claires, l’incertitude doit rester visible.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-exercise', step: 'exercise', outline: 'Exercice d’application',
      eyebrow: 'Appliquer', heading: practice.heading, prompt: practice.prompt, options: exerciseOptions,
      successText: practice.successText
    }),
    Object.freeze({ type: 'quiz', id: 'm21-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm21-journal', step: 'review', prompt: 'Écris avec tes mots ce qui invaliderait une idée et comment tu protégerais ta capacité à continuer.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm21-result', step: 'review', idSuffix: 'm21', data: Object.freeze({ heading: 'Compétence de protection du capital confirmée.', body: 'Tu as compris l’asymétrie entre pertes et gains, le rôle d’une limite d’invalidation préparée avant la décision et la priorité de la survie du capital — sans signal, prédiction, promesse ni dogme rigide de sizing.' }) })
  ]);

  return Object.freeze({
    id: 'M2.1',
    title: 'Protéger son capital',
    summary: 'Comprendre l’asymétrie des pertes, préparer une limite d’invalidation et faire passer la survie du capital avant la rentabilité.',
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
