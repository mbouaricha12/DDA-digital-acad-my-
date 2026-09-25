// DDA M2.1 — Golden Lesson #7 : Le risque d'abord (ouverture du module M2
// « Risque et discipline », seul titre de module au-delà de M1 validé par la
// roadmap officielle). Même contrat authored que m1-x-lesson.js : fichier
// dédié, global DDAM21GoldenLesson promu dans le curriculum par dda-core.js,
// zéro signal / zéro prédiction / zéro promesse / aucune donnée chiffrée.
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM21GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const competency = Object.freeze({ id: 'risk_discipline_foundations', label: 'Fondations du risque et de la discipline' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon t’aide à mettre le risque à la bonne place — avant le gain — et à comprendre pourquoi la discipline se décide à tête reposée, jamais sous pression.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const whatIsRiskOptions = Object.freeze([
    Object.freeze({ text: 'La perte possible si la décision se déroule mal — elle existe toujours, même quand tout semble favorable.', correct: true, feedback: 'Exact. Le risque est la perte possible, présente dans toute décision de marché — jamais le gain espéré.' }),
    Object.freeze({ text: 'Le gain espéré : plus il est grand, plus il est risqué de le viser.', correct: false, feedback: 'Attention aux mots : un gain espéré n’est ni certain ni « risqué » en soi — le risque désigne la perte possible, pas l’ampleur du gain espéré.' }),
    Object.freeze({ text: 'Le risque n’existe que si l’on utilise un effet de levier.', correct: false, feedback: 'Non. L’effet de levier amplifie la perte possible, mais toute exposition à un marché comporte une perte possible, même sans levier.' })
  ]);

  const beforeAfterOptions = Object.freeze([
    Object.freeze({ text: 'Avant d’entrer : une limite de perte maximale supportable, décidée à tête reposée, fait partie de la décision elle-même.', correct: true, feedback: 'Oui. Décider à l’avance, c’est ce qui distingue une limite choisie d’une perte subie sous pression.' }),
    Object.freeze({ text: 'Après, une fois que l’on voit comment le marché réagit : on s’adapte mieux à chaud.', correct: false, feedback: 'À chaud, la pression décide à ta place. La discipline consiste précisément à fixer la limite avant, quand le jugement est calme.' }),
    Object.freeze({ text: 'Jamais : une limite gâche le potentiel de gain.', correct: false, feedback: 'Une limite ne supprime ni le gain espéré ni la perte possible — elle rend la perte possible supportable et connue à l’avance.' })
  ]);

  const protectOptions = Object.freeze([
    Object.freeze({ text: 'Dimensionner le risque pour qu’une erreur reste supportable et permette de continuer — sans jamais croire que le risque a disparu.', correct: true, feedback: 'Exact. Protéger son capital, c’est garder la capacité de continuer à apprendre et à décider — pas s’interdire tout risque ni se croire à l’abri.' }),
    Object.freeze({ text: 'Éviter toute décision de marché : à l’abri de tout risque, le capital est préservé.', correct: false, feedback: 'C’est renoncer à apprendre par la pratique — et l’inaction a ses propres coûts. Le sujet ici est d’apprendre à dimensionner le risque, pas à le fuir.' }),
    Object.freeze({ text: 'Suivre une règle miracle qui garantit de ne jamais perdre.', correct: false, feedback: 'Cette règle n’existe pas : aucune méthode ne garantit contre la perte. Méfie-toi de quiconque prétend le contraire.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: 'D’abord évaluer la perte possible, puis fixer la limite supportable, puis seulement regarder le gain espéré — en sachant qu’aucune limite ne supprime le risque.', correct: true, feedback: 'Bonne séquence. Le gain espéré vient en dernier, et la lucidité sur l’absence de garantie reste jusqu’au bout.' }),
    Object.freeze({ text: 'D’abord estimer le gain espéré : s’il est assez grand, la perte possible devient acceptable.', correct: false, feedback: 'C’est laisser l’appétit de gain calibrer le risque — l’exact inverse de la discipline. La perte possible se mesure d’abord, indépendamment du gain espéré.' }),
    Object.freeze({ text: 'Fixer une limite suffit : une fois posée, elle garantit le capital.', correct: false, feedback: 'Une limite rend la perte supportable et connue, elle ne la supprime pas. « Garantir le capital » n’existe pas sur un marché.' })
  ]);

  const practice = Object.freeze({
    id: 'm21-exercise',
    label: 'Exercice d’application',
    heading: 'Dans quel ordre réfléchir ?',
    prompt: 'Une personne s’intéresse à une opportunité. Quelle séquence suit la logique « risque d’abord » ?',
    successText: 'Bonne séquence. Le gain espéré vient en dernier, et la lucidité sur l’absence de garantie reste jusqu’au bout.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm21-quiz',
    label: 'Quiz de validation',
    heading: 'La discipline face au risque, c’est quoi ?',
    prompt: 'Choisis la définition la plus rigoureuse.',
    successText: 'Correct. Tu distingues dimensionnement décidé à l’avance et illusion de garantie — la fondation de M2.',
    choices: Object.freeze([
      Object.freeze({ text: 'Décider à l’avance des limites de perte supportables, les respecter même sous pression, et rester lucide : aucune règle ne supprime le risque.', correct: true }),
      Object.freeze({ text: 'Trouver la méthode qui garantit de ne jamais perdre, puis l’appliquer sans réfléchir.', correct: false, feedback: 'Aucune méthode ne garantit contre la perte — chercher la garantie est déjà une erreur de raisonnement, pas une discipline.' }),
      Object.freeze({ text: 'Risquer gros quand on est sûr de soi : la confiance remplace la limite.', correct: false, feedback: 'La confiance ne réduit pas la perte possible — elle la fait souvent sous-estimer. La discipline tient la limite justement quand on est trop sûr de soi.' })
    ])
  });

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm21-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm21-concept', step: 'lesson', outline: 'Le risque d’abord', eyebrow: 'Le concept',
      heading: 'Avant le gain possible, la perte possible.',
      body: 'Toute décision sur un marché associe deux issues : un gain espéré — jamais garanti — et une perte possible — toujours réelle. Le risque, c’est cette perte possible : il ne se supprime pas, il se dimensionne et il s’assume à l’avance.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'La question disciplinée n’est pas « combien puis-je gagner ? » mais « combien cette décision peut-elle me coûter — et est-ce supportable pour moi ? ».' })
    }),
    Object.freeze({
      type: 'case_study', id: 'm21-case-two-doors', step: 'lesson', outline: 'Deux façons d’entrer', label: 'Cas concret · deux comportements',
      text: 'Deux personnes envisagent la même décision. La première se demande d’abord combien elle accepte de perdre au maximum si tout se passe mal, puis seulement regarde le gain espéré. La seconde regarde le gain espéré, entre, et découvrira le montant de sa perte quand elle la subira. Même marché, même opportunité — deux rapports au risque complètement différents.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-what-is-risk', step: 'lesson', outline: 'Où est le risque ?', eyebrow: 'À toi de distinguer',
      heading: 'Où est le risque, exactement ?', prompt: 'Pour une même opportunité, trois façons d’en parler. Laquelle décrit le risque ?', options: whatIsRiskOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-before-after', step: 'lesson', outline: 'Décider avant', eyebrow: 'À toi de trancher',
      heading: 'Quand faut-il décider de sa limite ?', prompt: 'Choisis le moment qui fait honnêtement partie de la discipline.', options: beforeAfterOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-protect', step: 'lesson', outline: 'Protéger sans illusion', eyebrow: 'Comprendre',
      heading: '« Protéger son capital », ça veut dire quoi ?', prompt: 'Choisis sans chercher de garantie — il n’y en a pas.', options: protectOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm21-exercise-case', step: 'exercise', outline: 'Exercice d’application', label: 'Exercice d’application',
      text: 'Tu as séparé les pièces : la perte possible, la limite décidée à l’avance, l’absence de garantie. Replace-les maintenant dans une seule séquence complète, dans le bon ordre.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm21-exercise', step: 'exercise', outline: 'Ordonner la réflexion', eyebrow: 'Appliquer',
      heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm21-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm21-journal', step: 'review', prompt: 'Note dans ton Journal, avec tes propres mots, la différence entre une limite de perte décidée à l’avance et une perte subie sous pression.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm21-result', step: 'review', idSuffix: 'm21', data: Object.freeze({ heading: 'Compréhension des fondations du risque et de la discipline confirmée.', body: 'Tu sais placer la perte possible avant le gain espéré, fixer une limite à tête reposée et rester lucide : aucune règle ne supprime le risque — seulement son dimensionnement.' }) })
  ]);

  return Object.freeze({
    id: 'M2.1',
    title: 'Le risque d’abord',
    summary: 'La perte possible avant le gain espéré, la limite décidée à l’avance, l’absence de garantie — les fondations de la discipline.',
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