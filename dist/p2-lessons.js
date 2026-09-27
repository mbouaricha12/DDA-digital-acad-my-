/* DDA Premium P2 — authored local/demo lessons. No live market data, signals or financial advice. */
(function () {
  'use strict';

  function lessonP21() {
    const competency = Object.freeze({ id: 'risk_foundations', label: 'Risk Foundations' });
    const xp = Object.freeze({ lessonViewed: 40, exerciseComplete: 80, quizComplete: 140 });
    const practice = Object.freeze({ id: 'p21-practice', label: 'Interactive Decision', heading: 'Define the boundary before the entry', prompt: 'You identify an interesting zone but do not know where your scenario would be invalidated. What do you do?', successText: 'Une zone intéressante ne suffit pas à définir un trade. Sans invalidation claire, le risque ne peut pas être correctement défini.', choices: Object.freeze([
      Object.freeze({ text: 'Enter with a small position.', correct: false, feedback: 'Une petite position ne remplace pas une invalidation définie.' }),
      Object.freeze({ text: 'Enter now and move the stop later.', correct: false, feedback: 'Déplacer le stop après l’entrée transforme le risque en improvisation.' }),
      Object.freeze({ text: 'Wait until the invalidation can be clearly defined.', correct: true, feedback: 'Une invalidation claire permet de définir une limite de risque mesurable avant l’exécution.' }),
      Object.freeze({ text: 'Enter because the zone looks strong.', correct: false, feedback: 'La force apparente d’une zone ne définit ni le risque ni la décision.' })
    ]) });
    const evaluation = Object.freeze({ id: 'p21-quiz', label: 'Validation — Risk Before Entry', heading: 'What must exist before a controlled trade?', prompt: 'Choose the sequence that defines risk before execution.', successText: 'Correct. Invalidation comes before stop placement, position size and entry.', choices: Object.freeze([
      Object.freeze({ text: 'Entry first, then improvise the stop.', correct: false, feedback: 'Le stop ne doit pas être improvisé après l’entrée.' }),
      Object.freeze({ text: 'Invalidation → Stop → Position Size → Entry.', correct: true }),
      Object.freeze({ text: 'Position size → entry → stop if needed.', correct: false, feedback: 'La taille découle du risque accepté et de la distance d’invalidation.' })
    ]) });
    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Understand' }),
      Object.freeze({ id: 'exercise', label: 'Apply' }),
      Object.freeze({ id: 'quiz', label: 'Validate' }),
      Object.freeze({ id: 'review', label: 'Review' })
    ]);
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'p21-competency', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'p21-before-trade', step: 'lesson', outline: 'Before the Trade, Define the Risk', eyebrow: 'Risk Before Entry', heading: 'Before the trade, define the risk.', body: 'Un trader ne contrôle pas le marché. Il contrôle ce qu’il accepte de perdre, les conditions dans lesquelles il entre et le moment où son scénario devient invalide. Avant de chercher une entrée, commence par définir ton risque.', principle: Object.freeze({ label: 'Sequence', text: 'Context → Setup → Invalidation → Risk → Entry' }) }),
      Object.freeze({ type: 'scenario', id: 'p21-control', step: 'lesson', outline: 'What You Control', heading: 'What you control — and what you do not.', bad: Object.freeze({ label: 'You don’t control', items: Object.freeze(['La prochaine bougie', 'La réaction du marché', 'La vitesse du mouvement', 'Les news imprévues', 'Le résultat individuel du trade']) }), good: Object.freeze({ label: 'You control', items: Object.freeze(['Ton risque', 'Ton exposition', 'Ton point d’invalidation', 'Ton processus', 'Ta décision d’entrer ou de ne pas entrer']) }) }),
      Object.freeze({ type: 'case_study', id: 'p21-allowance', step: 'lesson', outline: 'Risk per Trade', label: 'Exemple pédagogique — pas une règle universelle DDA', text: 'Capital fictif : $10,000 · Risk allowance : 0.5 % · Maximum risk : $50. Cet exemple illustre une méthode de calcul ; il ne constitue pas une recommandation ni une règle universelle.' }),
      Object.freeze({ type: 'text_short', id: 'p21-stop-risk', step: 'lesson', outline: 'Stop Loss ≠ Risk', eyebrow: 'Clarifier les mots', heading: 'A stop loss is not the risk itself.', body: 'Stop Loss = niveau d’invalidation. Risk = montant accepté si l’invalidation est atteinte. Placer un stop ne signifie pas automatiquement que le risque est correctement défini.', principle: Object.freeze({ label: 'Relation', text: 'Invalidation ↓ Stop ↓ Position Size — et non Position Size ↓ Stop improvisé' }) }),
      Object.freeze({ type: 'decision_choice', id: 'p21-decision', step: 'exercise', outline: 'Interactive Decision', eyebrow: 'Decision check', heading: practice.heading, prompt: practice.prompt, options: practice.choices }),
      Object.freeze({ type: 'text_short', id: 'p21-process', step: 'lesson', outline: 'Risk ≠ Prediction', eyebrow: 'Process over outcome', heading: 'RESULT ≠ PROCESS', body: 'Tu peux avoir raison sur la direction générale et perdre un trade. Tu peux aussi avoir tort sur ton scénario et avoir néanmoins respecté parfaitement ton processus. La discipline se mesure d’abord par la qualité de la décision définie avant l’exécution.' }),
      Object.freeze({ type: 'quiz', id: 'p21-quiz', step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'summary', id: 'p21-summary', step: 'review', idSuffix: 'p21', data: Object.freeze({ heading: 'Risk Foundations — première preuve construite.', body: 'NO INVALIDATION → NO DEFINED RISK → NO CONTROLLED TRADE. Le premier objectif est de construire des décisions dont le risque est connu avant l’exécution.' }), continueTo: Object.freeze({ view: 'lesson-p22', label: 'Continuer vers The Anatomy of a Controlled Trade' }) }),
      Object.freeze({ type: 'journal_link', id: 'p21-journal', step: 'review', prompt: 'Tu veux noter ce que tu retiens avant de construire ton premier Risk Plan ?', cta: 'Ouvrir Journal & Plan' })
    ]);
    const content = Object.freeze({ lead: 'Apprendre à contrôler le risque avant de chercher une opportunité.' });
    return Object.freeze({ id: 'P2.1', title: 'Risk Before Entry', summary: 'Définir l’invalidation et le risque avant de chercher une entrée.', estimatedMinutes: 12, competency, xp, content, practice, evaluation, steps, blocks });
  }

  function lessonP22() {
    const competency = Object.freeze({ id: 'controlled_trade', label: 'Controlled Trade Anatomy' });
    const xp = Object.freeze({ lessonViewed: 40, exerciseComplete: 80, quizComplete: 140 });
    const practice = Object.freeze({ id: 'p22-practice', label: 'Build sequence', heading: 'Build a controlled trade', prompt: 'Which sequence turns a market observation into a reviewable decision?', successText: 'Une décision contrôlée relie contexte, setup, entrée, invalidation, risque, objectif puis revue.', choices: Object.freeze([
      Object.freeze({ text: 'Context → Setup → Entry → Invalidation → Risk → Target → Review', correct: true }),
      Object.freeze({ text: 'Target → Position size → Entry → Context → Review', correct: false, feedback: 'L’objectif ne remplace pas le contexte et l’invalidation ne vient pas après une taille improvisée.' }),
      Object.freeze({ text: 'Entry → hope → result → review', correct: false, feedback: 'Une entrée seule ne constitue pas un plan contrôlé.' })
    ]) });
    const evaluation = Object.freeze({ id: 'p22-quiz', label: 'Validation — Controlled Trade', heading: 'Review the process, not only the result.', prompt: 'A trade reaches its stop. Which conclusion is correct?', successText: 'Correct. A losing trade can still be correctly executed when the plan and risk were respected.', choices: Object.freeze([
      Object.freeze({ text: 'The strategy is bad.', correct: false, feedback: 'Un résultat isolé ne suffit pas à juger la qualité du processus.' }),
      Object.freeze({ text: 'The market is rigged.', correct: false, feedback: 'Cette conclusion n’examine ni le plan ni la preuve de discipline.' }),
      Object.freeze({ text: 'The trade can be losing while correctly executed.', correct: true }),
      Object.freeze({ text: 'Double the risk on the next trade.', correct: false, feedback: 'Augmenter le risque pour compenser n’est pas une revue de processus.' })
    ]) });
    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Understand' }),
      Object.freeze({ id: 'exercise', label: 'Apply' }),
      Object.freeze({ id: 'quiz', label: 'Validate' }),
      Object.freeze({ id: 'review', label: 'Review' })
    ]);
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'p22-competency', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'p22-anatomy', step: 'lesson', outline: 'The Anatomy of a Controlled Trade', eyebrow: 'Controlled Trade', heading: 'A trade is a sequence, not a click.', body: 'Un trade contrôlé se construit dans cet ordre : CONTEXT → SETUP → ENTRY → INVALIDATION → RISK → TARGET → REVIEW. L’entrée est la conséquence du raisonnement, pas son point de départ.', principle: Object.freeze({ label: 'Key question', text: 'Dans quel environnement suis-je, et pourquoi cette opportunité correspond-elle à mon système ?' }) }),
      Object.freeze({ type: 'scenario', id: 'p22-questions', step: 'lesson', outline: 'Questions that control the plan', heading: 'Every part of the sequence answers one question.', bad: Object.freeze({ label: 'Improvisation', items: Object.freeze(['Ça monte donc j’achète', 'Le stop vient après la position', 'Le résultat décide si le plan était bon']) }), good: Object.freeze({ label: 'Controlled decision', items: Object.freeze(['Context : dans quel environnement suis-je ?', 'Invalidation : quand mon hypothèse n’est plus valable ?', 'Risk : combien suis-je prêt à perdre si elle est invalidée ?']) }) }),
      Object.freeze({ type: 'case_study', id: 'p22-rmultiple', step: 'lesson', outline: 'R-multiple', label: 'R est une unité de risque définie', text: 'Exemple pédagogique : 1R = $50, 2R = $100, -1R = -$50. R mesure le risque défini sur le trade ; ce n’est pas une garantie de résultat.' }),
      Object.freeze({ type: 'case_study', id: 'p22-review', step: 'lesson', outline: 'Review', label: 'A trade ends with a review', text: 'Ai-je respecté mon plan ? Ai-je respecté mon risque ? Mon setup était-il présent ? Ai-je modifié ma décision ? Qu’ai-je appris ? Le trade ne se termine pas au résultat.' }),
      Object.freeze({ type: 'decision_choice', id: 'p22-sequence', step: 'exercise', outline: 'Build the sequence', eyebrow: 'Practice', heading: practice.heading, prompt: practice.prompt, options: practice.choices }),
      Object.freeze({ type: 'quiz', id: 'p22-quiz', step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'summary', id: 'p22-summary', step: 'review', idSuffix: 'p22', data: Object.freeze({ heading: 'Controlled Decision — prête pour le Risk Plan.', body: 'La discipline se prouve par le respect du processus défini avant l’exécution, pas par un résultat isolé.' }), continueTo: Object.freeze({ view: 'premium-lab', label: 'Construire le Risk Plan' }) }),
      Object.freeze({ type: 'journal_link', id: 'p22-journal', step: 'review', prompt: 'Après le Lab, tu pourras transférer ton Risk Plan dans le Journal & Plan.', cta: 'Ouvrir Journal & Plan' })
    ]);
    const content = Object.freeze({ lead: 'Une décision contrôlée se construit avant le clic et se termine par une revue.' });
    return Object.freeze({ id: 'P2.2', title: 'The Anatomy of a Controlled Trade', summary: 'Relier contexte, setup, invalidation, risque, objectif et revue.', estimatedMinutes: 12, competency, xp, content, practice, evaluation, steps, blocks });
  }

  window.DDAP2Lessons = Object.freeze({ p21: lessonP21(), p22: lessonP22() });
})();
