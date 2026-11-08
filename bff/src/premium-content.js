'use strict';

/* ==========================================================================
   PREMIUM CONTENT — the real authored text, exercises and quiz answers for
   every lesson/lab that is gated behind DDA Premium (mandate §6 audit,
   MASTER_AUDIT_DDA_LAUNCH.md).

   This module exists because that content used to be embedded in clear text
   in public, statically-served browser files (dist/p2-lessons.js and
   dist/dda-lab.js): anyone — Free or anonymous — could read every Premium
   lesson and every correct quiz answer with a single unauthenticated
   request to those files' public URL, with no need to defeat any
   authentication or client-side gate. The client-side gate (canUnlock /
   serverPremiumConfirmed) only ever controlled whether the already-shipped
   data was *rendered* in the DOM — never whether it was *shipped* at all.

   The fix: this data now lives ONLY here, on the server, imported by
   nothing but bff/src/app.js's authenticated /v1/premium/content/:lessonId
   route (same hasActivePremium() guard /v1/premium/preview already uses).
   It is never required by, bundled into, or copied to anything under
   dist/ — grep dist/ for the strings below and they must not appear there.

   Content is verbatim what dist/p2-lessons.js (P2.1, P2.2) and the LAB4 /
   LABCAP sections of dist/dda-lab.js used to hold — moved, not rewritten,
   so no pedagogical content changes with this fix.
   ========================================================================== */

function lessonP21() {
  const competency = Object.freeze({ id: 'risk_foundations', label: 'Fondations du risque' });
  const xp = Object.freeze({ lessonViewed: 40, exerciseComplete: 80, quizComplete: 140 });
  const practice = Object.freeze({ id: 'p21-practice', label: 'Décision interactive', heading: 'Définir la limite avant l’entrée', prompt: 'Tu identifies une zone intéressante mais tu ne sais pas où ton scénario serait invalidé. Que fais-tu ?', successText: 'Une zone intéressante ne suffit pas à définir un trade. Sans invalidation claire, le risque ne peut pas être correctement défini.', choices: Object.freeze([
    Object.freeze({ text: 'Entrer avec une petite position.', correct: false, feedback: 'Une petite position ne remplace pas une invalidation définie.' }),
    Object.freeze({ text: 'Entrer maintenant et déplacer le stop plus tard.', correct: false, feedback: 'Déplacer le stop après l’entrée transforme le risque en improvisation.' }),
    Object.freeze({ text: 'Attendre que l’invalidation puisse être clairement définie.', correct: true, feedback: 'Une invalidation claire permet de définir une limite de risque mesurable avant l’exécution.' }),
    Object.freeze({ text: 'Entrer parce que la zone semble forte.', correct: false, feedback: 'La force apparente d’une zone ne définit ni le risque ni la décision.' })
  ]) });
  const evaluation = Object.freeze({ id: 'p21-quiz', label: 'Validation — Le risque avant l’entrée', heading: 'Qu’est-ce qui doit exister avant un trade contrôlé ?', prompt: 'Choisis la séquence qui définit le risque avant l’exécution.', successText: 'Correct. L’invalidation précède le placement du stop, la taille de position et l’entrée.', choices: Object.freeze([
    Object.freeze({ text: 'Entrer d’abord, puis improviser le stop.', correct: false, feedback: 'Le stop ne doit pas être improvisé après l’entrée.' }),
    Object.freeze({ text: 'Invalidation → Stop → Taille de position → Entrée.', correct: true }),
    Object.freeze({ text: 'Taille de position → entrée → stop si besoin.', correct: false, feedback: 'La taille découle du risque accepté et de la distance d’invalidation.' })
  ]) });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'p21-competency', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({ type: 'text_short', id: 'p21-before-trade', step: 'lesson', outline: 'Avant le trade, définir le risque', eyebrow: 'Le risque avant l’entrée', heading: 'Avant le trade, définis le risque.', body: 'Un trader ne contrôle pas le marché. Il contrôle ce qu’il accepte de perdre, les conditions dans lesquelles il entre et le moment où son scénario devient invalide. Avant de chercher une entrée, commence par définir ton risque.', principle: Object.freeze({ label: 'Séquence', text: 'Contexte → Setup → Invalidation → Risque → Entrée' }) }),
    Object.freeze({ type: 'scenario', id: 'p21-control', step: 'lesson', outline: 'Ce que tu contrôles', heading: 'Ce que tu contrôles — et ce que tu ne contrôles pas.', bad: Object.freeze({ label: 'Tu ne contrôles pas', items: Object.freeze(['La prochaine bougie', 'La réaction du marché', 'La vitesse du mouvement', 'Les news imprévues', 'Le résultat individuel du trade']) }), good: Object.freeze({ label: 'Tu contrôles', items: Object.freeze(['Ton risque', 'Ton exposition', 'Ton point d’invalidation', 'Ton processus', 'Ta décision d’entrer ou de ne pas entrer']) }) }),
    Object.freeze({ type: 'case_study', id: 'p21-allowance', step: 'lesson', outline: 'Risque par trade', label: 'Exemple pédagogique — pas une règle universelle DDA', text: 'Capital fictif : $10,000 · Allocation de risque : 0,5 % · Risque maximum : $50. Cet exemple illustre une méthode de calcul ; il ne constitue pas une recommandation ni une règle universelle.' }),
    Object.freeze({ type: 'text_short', id: 'p21-stop-risk', step: 'lesson', outline: 'Stop Loss ≠ Risque', eyebrow: 'Clarifier les mots', heading: 'Un stop loss n’est pas le risque lui-même.', body: 'Stop Loss = niveau d’invalidation. Risque = montant accepté si l’invalidation est atteinte. Placer un stop ne signifie pas automatiquement que le risque est correctement défini.', principle: Object.freeze({ label: 'Relation', text: 'Invalidation ↓ Stop ↓ Taille de position — et non Taille de position ↓ Stop improvisé' }) }),
    Object.freeze({ type: 'decision_choice', id: 'p21-decision', step: 'exercise', outline: 'Décision interactive', eyebrow: 'Vérification de la décision', heading: practice.heading, prompt: practice.prompt, options: practice.choices }),
    Object.freeze({ type: 'text_short', id: 'p21-process', step: 'lesson', outline: 'Risque ≠ Prédiction', eyebrow: 'Le processus avant le résultat', heading: 'RÉSULTAT ≠ PROCESSUS', body: 'Tu peux avoir raison sur la direction générale et perdre un trade. Tu peux aussi avoir tort sur ton scénario et avoir néanmoins respecté parfaitement ton processus. La discipline se mesure d’abord par la qualité de la décision définie avant l’exécution.' }),
    Object.freeze({ type: 'quiz', id: 'p21-quiz', step: 'quiz', locked: true, data: evaluation }),
    Object.freeze({ type: 'summary', id: 'p21-summary', step: 'review', idSuffix: 'p21', data: Object.freeze({ heading: 'Fondations du risque — première preuve construite.', body: 'PAS D’INVALIDATION → PAS DE RISQUE DÉFINI → PAS DE TRADE CONTRÔLÉ. Le premier objectif est de construire des décisions dont le risque est connu avant l’exécution.' }), continueTo: Object.freeze({ view: 'lesson-p22', label: 'Continuer vers L’anatomie d’un trade contrôlé' }) }),
    Object.freeze({ type: 'journal_link', id: 'p21-journal', step: 'review', prompt: 'Tu veux noter ce que tu retiens avant de construire ton premier Risk Plan ?', cta: 'Ouvrir Journal & Plan' })
  ]);
  const content = Object.freeze({ lead: 'Apprendre à contrôler le risque avant de chercher une opportunité.' });
  return Object.freeze({ id: 'P2.1', title: 'Le risque avant l’entrée', summary: 'Définir l’invalidation et le risque avant de chercher une entrée.', estimatedMinutes: 12, competency, xp, content, practice, evaluation, steps, blocks });
}

function lessonP22() {
  const competency = Object.freeze({ id: 'controlled_trade', label: 'Anatomie du trade contrôlé' });
  const xp = Object.freeze({ lessonViewed: 40, exerciseComplete: 80, quizComplete: 140 });
  const practice = Object.freeze({ id: 'p22-practice', label: 'Construire la séquence', heading: 'Construire un trade contrôlé', prompt: 'Quelle séquence transforme une observation de marché en une décision qu’on peut revoir ?', successText: 'Une décision contrôlée relie contexte, setup, entrée, invalidation, risque, objectif puis revue.', choices: Object.freeze([
    Object.freeze({ text: 'Contexte → Setup → Entrée → Invalidation → Risque → Objectif → Revue', correct: true }),
    Object.freeze({ text: 'Objectif → Taille de position → Entrée → Contexte → Revue', correct: false, feedback: 'L’objectif ne remplace pas le contexte et l’invalidation ne vient pas après une taille improvisée.' }),
    Object.freeze({ text: 'Entrée → espoir → résultat → revue', correct: false, feedback: 'Une entrée seule ne constitue pas un plan contrôlé.' })
  ]) });
  const evaluation = Object.freeze({ id: 'p22-quiz', label: 'Validation — Trade contrôlé', heading: 'Revoir le processus, pas seulement le résultat.', prompt: 'Un trade atteint son stop. Quelle conclusion est correcte ?', successText: 'Correct. Un trade perdant peut tout de même avoir été correctement exécuté si le plan et le risque ont été respectés.', choices: Object.freeze([
    Object.freeze({ text: 'La stratégie est mauvaise.', correct: false, feedback: 'Un résultat isolé ne suffit pas à juger la qualité du processus.' }),
    Object.freeze({ text: 'Le marché est manipulé.', correct: false, feedback: 'Cette conclusion n’examine ni le plan ni la preuve de discipline.' }),
    Object.freeze({ text: 'Le trade peut être perdant tout en ayant été correctement exécuté.', correct: true }),
    Object.freeze({ text: 'Doubler le risque sur le prochain trade.', correct: false, feedback: 'Augmenter le risque pour compenser n’est pas une revue de processus.' })
  ]) });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'p22-competency', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({ type: 'text_short', id: 'p22-anatomy', step: 'lesson', outline: 'L’anatomie d’un trade contrôlé', eyebrow: 'Trade contrôlé', heading: 'Un trade est une séquence, pas un clic.', body: 'Un trade contrôlé se construit dans cet ordre : CONTEXTE → SETUP → ENTRÉE → INVALIDATION → RISQUE → OBJECTIF → REVUE. L’entrée est la conséquence du raisonnement, pas son point de départ.', principle: Object.freeze({ label: 'Question clé', text: 'Dans quel environnement suis-je, et pourquoi cette opportunité correspond-elle à mon système ?' }) }),
    Object.freeze({ type: 'scenario', id: 'p22-questions', step: 'lesson', outline: 'Les questions qui pilotent le plan', heading: 'Chaque étape de la séquence répond à une question.', bad: Object.freeze({ label: 'Improvisation', items: Object.freeze(['Ça monte donc j’achète', 'Le stop vient après la position', 'Le résultat décide si le plan était bon']) }), good: Object.freeze({ label: 'Décision contrôlée', items: Object.freeze(['Contexte : dans quel environnement suis-je ?', 'Invalidation : quand mon hypothèse n’est plus valable ?', 'Risque : combien suis-je prêt à perdre si elle est invalidée ?']) }) }),
    Object.freeze({ type: 'case_study', id: 'p22-rmultiple', step: 'lesson', outline: 'Le R-multiple', label: 'R est une unité de risque définie', text: 'Exemple pédagogique : 1R = $50, 2R = $100, -1R = -$50. R mesure le risque défini sur le trade ; ce n’est pas une garantie de résultat.' }),
    Object.freeze({ type: 'case_study', id: 'p22-review', step: 'lesson', outline: 'La revue', label: 'Un trade se termine par une revue', text: 'Ai-je respecté mon plan ? Ai-je respecté mon risque ? Mon setup était-il présent ? Ai-je modifié ma décision ? Qu’ai-je appris ? Le trade ne se termine pas au résultat.' }),
    Object.freeze({ type: 'decision_choice', id: 'p22-sequence', step: 'exercise', outline: 'Construire la séquence', eyebrow: 'Pratique', heading: practice.heading, prompt: practice.prompt, options: practice.choices }),
    Object.freeze({ type: 'quiz', id: 'p22-quiz', step: 'quiz', locked: true, data: evaluation }),
    Object.freeze({ type: 'summary', id: 'p22-summary', step: 'review', idSuffix: 'p22', data: Object.freeze({ heading: 'Décision contrôlée — prête pour le Risk Plan.', body: 'La discipline se prouve par le respect du processus défini avant l’exécution, pas par un résultat isolé.' }), continueTo: Object.freeze({ view: 'premium-lab', label: 'Construire le Risk Plan' }) }),
    Object.freeze({ type: 'journal_link', id: 'p22-journal', step: 'review', prompt: 'Après le Lab, tu pourras transférer ton Risk Plan dans le Journal & Plan.', cta: 'Ouvrir Journal & Plan' })
  ]);
  const content = Object.freeze({ lead: 'Une décision contrôlée se construit avant le clic et se termine par une revue.' });
  return Object.freeze({ id: 'P2.2', title: 'L’anatomie d’un trade contrôlé', summary: 'Relier contexte, setup, invalidation, risque, objectif et revue.', estimatedMinutes: 12, competency, xp, content, practice, evaluation, steps, blocks });
}

const LAB_STEPS = Object.freeze([
  Object.freeze({ id: 'lesson', label: 'Comprendre' }),
  Object.freeze({ id: 'exercise', label: 'Essayer' }),
  Object.freeze({ id: 'quiz', label: 'Vérifier' }),
  Object.freeze({ id: 'review', label: 'Continuer' })
]);

function buildLab4() {
  const competency = Object.freeze({ id: 'lab_ai_production', label: 'Produire un livrable complet avec l’IA' });
  const xp = Object.freeze({ lessonViewed: 25, exerciseComplete: 50, quizComplete: 100 });
  const content = Object.freeze({
    lead: 'Tu sais déjà vérifier et corriger. Cette leçon t’apprend à aller jusqu’au bout : un document fini, prêt à partager — et à repérer les tâches répétitives qu’on peut automatiser.',
    concept: Object.freeze({
      heading: 'Produire un document complet, en quatre étapes',
      body: '1) Un brief précis (à qui s’adresse le document, pour quoi faire, quelle longueur). 2) Un premier brouillon généré par l’IA. 3) Une relecture ciblée, en corrigeant un point à la fois (jamais tout en même temps). 4) Une mise en forme finale lisible sur téléphone : titres courts, phrases courtes, un seul message par paragraphe.'
    }),
    principle: Object.freeze({ label: 'Principe essentiel', text: 'Un livrable fini n’est jamais le premier brouillon accepté tel quel — c’est le résultat d’au moins une correction ciblée.' }),
    example: Object.freeze({
      label: 'Exemple complet',
      text: 'Fatou répare des téléphones . Brief donné à l’IA : « Rédige une courte page de présentation pour mon activité de réparation de téléphones, pour des clients qui me trouveraient sur WhatsApp : qui je suis, ce que je répare, pourquoi me faire confiance, comment me contacter. Ton simple et rassurant, 150 mots maximum. » Premier brouillon trop long → relecture ciblée : « Raccourcis à 100 mots et commence directement par ce que tu répares. » Résultat : un texte prêt à coller dans son statut WhatsApp Business.'
    })
  });
  const automation = Object.freeze({
    heading: 'Qu’est-ce qu’une automatisation simple ?',
    body: 'Une automatisation relie trois éléments : un déclencheur (ce qui se passe), une action (ce qui doit arriver automatiquement) et parfois une condition (seulement si…). Exemple entièrement gratuit : un formulaire Google Forms où chaque nouvelle réponse (déclencheur) s’ajoute automatiquement comme une ligne dans un Google Sheets (action) — sans qu’un abonnement payant soit nécessaire. L’automatisation ne remplace pas ton jugement : elle ne sert que pour les tâches répétitives, jamais pour une décision qui demande de réfléchir à chaque fois.'
  });
  const comparison = Object.freeze({
    heading: 'Quelle tâche automatiser, laquelle garder manuelle',
    bad: Object.freeze({ label: 'À garder manuel', items: Object.freeze(['Répondre à une réclamation d’un client mécontent', 'Décider d’un prix spécial pour une situation particulière', 'Rédiger un message pour une occasion unique et sensible']) }),
    good: Object.freeze({ label: 'Bon candidat à l’automatisation', items: Object.freeze(['Enregistrer chaque nouvelle commande reçue par formulaire', 'Envoyer un message de confirmation identique à chaque inscription', 'Classer automatiquement les réponses d’un sondage par catégorie']) })
  });
  const practice = Object.freeze({
    id: 'lab4-exercise', label: 'Exercice', heading: 'Repérer une bonne candidate à l’automatisation',
    prompt: 'Tu gères les inscriptions à un petit atelier de couture via un formulaire en ligne. Chaque semaine, tu recopies à la main les réponses dans un tableau. Est-ce une bonne tâche à automatiser ?',
    successText: 'Oui : c’est une tâche répétitive, sans jugement à exercer — exactement le type de tâche qu’une automatisation simple (formulaire → tableau) peut faire à ta place.',
    choices: Object.freeze([
      Object.freeze({ text: 'Oui : recopier les mêmes informations chaque semaine est répétitif et ne demande aucune décision.', correct: true, feedback: 'Exactement — c’est le profil parfait d’une automatisation simple : répétitif, sans jugement, toujours la même action.' }),
      Object.freeze({ text: 'Non : il vaut mieux tout recopier soi-même pour garder le contrôle.', correct: false, feedback: 'Le contrôle n’est pas perdu : tu choisis l’outil et tu vérifies le résultat. Recopier à la main une tâche identique chaque semaine fait perdre du temps sans ajouter de valeur.' })
    ])
  });
  const evaluation = Object.freeze({
    id: 'lab4-quiz', label: 'Quiz de validation', heading: 'Produire et automatiser avec méthode',
    prompt: 'Quelle affirmation décrit le mieux une automatisation « simple » telle que vue dans cette leçon ?',
    successText: 'Une automatisation simple relie toujours un déclencheur à une action — rien de plus. Elle ne prend jamais de décision à ta place sur un cas particulier.',
    choices: Object.freeze([
      Object.freeze({ text: 'Elle relie un événement déclencheur à une action qui se répète toujours de la même façon.', correct: true, feedback: 'C’est la définition vue dans cette leçon : déclencheur → action, parfois avec une condition « seulement si ».' }),
      Object.freeze({ text: 'Elle remplace ton jugement pour toutes les décisions répétitives de ton activité.', correct: false, feedback: 'Une automatisation ne juge jamais un cas particulier — elle répète une action identique, elle ne remplace pas une décision qui dépend du contexte.' }),
      Object.freeze({ text: 'Elle nécessite toujours un abonnement payant pour fonctionner.', correct: false, feedback: 'L’exemple formulaire → tableau de cette leçon est entièrement gratuit — une automatisation simple ne demande pas nécessairement un outil payant.' })
    ])
  });
  const result = Object.freeze({ heading: 'Quatrième leçon terminée.', body: 'Tu es prêt(e) pour le projet final : construire ta propre page de présentation, du brief jusqu’au résultat fini.' });
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'lab4-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({ type: 'text_short', id: 'lab4-concept', outline: content.concept.heading, step: 'lesson', eyebrow: 'Le concept', heading: content.concept.heading, body: content.concept.body, principle: content.principle }),
    Object.freeze({ type: 'case_study', id: 'lab4-example', outline: content.example.label, step: 'lesson', label: content.example.label, text: content.example.text }),
    Object.freeze({ type: 'text_short', id: 'lab4-automation-concept', outline: automation.heading, step: 'lesson', eyebrow: 'Introduction à l’automatisation', heading: automation.heading, body: automation.body }),
    Object.freeze({ type: 'scenario', id: 'lab4-comparison', outline: comparison.heading, step: 'lesson', heading: comparison.heading, bad: comparison.bad, good: comparison.good }),
    Object.freeze({ type: 'quiz', id: 'lab4-exercise', outline: practice.heading, step: 'exercise', locked: false, data: practice }),
    Object.freeze({ type: 'quiz', id: 'lab4-quiz', outline: evaluation.heading, step: 'quiz', locked: true, data: evaluation }),
    Object.freeze({ type: 'summary', id: 'lab4-result', step: 'review', idSuffix: 'lab4', data: result, continueTo: Object.freeze({ view: 'lesson-lab-capstone', label: 'Commencer le projet final' }) })
  ]);
  return Object.freeze({
    id: 'LAB4', title: 'Produire un livrable complet avec l’IA', prerequisite: 'LAB3', premium: true,
    summary: 'Aller du brief au document fini, et repérer une tâche automatisable.',
    estimatedMinutes: 15, markUnderstoodLabel: 'Passer à l’exercice',
    competency, xp, content, practice, evaluation, result, steps: LAB_STEPS, blocks
  });
}

function buildLabCapstone() {
  const competency = Object.freeze({ id: 'lab_capstone_delivery', label: 'Livrer un document complet et vérifié' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 0, quizComplete: 150 });
  const brief = Object.freeze({
    heading: 'Ton projet : une page de présentation prête à partager',
    body: 'Choisis un petit service ou produit — le tien, celui d’un proche, ou un exemple imaginé (couture, réparation, cours particuliers, petite restauration, revente). Avec une IA gratuite (ChatGPT ou Gemini), rédige une page de présentation courte : qui, quoi, pourquoi te faire confiance, comment te contacter. Utilise exactement la méthode des 4 leçons précédentes : brief précis → brouillon → relecture ciblée (faits, ton, ce qui manque) → mise en forme finale lisible sur téléphone.'
  });
  const template = Object.freeze({
    label: 'Gabarit à suivre',
    text: '1) Une phrase d’accroche (qui tu es, ce que tu fais). 2) Trois à cinq lignes sur ce que tu proposes concrètement. 3) Une phrase sur pourquoi te faire confiance (expérience, exemple, garantie). 4) Un appel à l’action clair (numéro, WhatsApp, lieu). Conserve le prompt final que tu as utilisé : c’est ta preuve de démarche, pas seulement le résultat.'
  });
  const checklist = Object.freeze({
    heading: 'Grille d’auto-évaluation',
    good: Object.freeze({ label: 'Mon livrable respecte ces points', items: Object.freeze(['Chaque fait annoncé (prix, lieu, contact) est vrai et vérifié par moi', 'Le ton correspond à la personne qui va lire ce texte', 'Le texte suit le gabarit en 4 parties, sans partie manquante', 'Le texte est lisible en une seule fois sur un petit écran de téléphone', 'J’ai gardé le prompt final utilisé comme preuve de ma démarche']) }),
    bad: Object.freeze({ label: 'Signes qu’il faut encore corriger', items: Object.freeze(['Un chiffre, un nom ou un prix non vérifié reste dans le texte', 'Le texte est trop long pour être lu d’un coup sur téléphone', 'Le ton ne ressemble pas à la façon dont tu parles vraiment à tes clients']) })
  });
  const evaluation = Object.freeze({
    id: 'labcap-quiz', label: 'Vérification finale', heading: 'As-tu vérifié ces points avant de publier ?',
    prompt: 'Ce quiz vérifie que tu as bien appliqué la méthode — il ne lit pas ton texte : c’est à toi de comparer ton livrable à la grille ci-dessus avant de répondre honnêtement.',
    successText: 'C’est la bonne réponse : la méthode complète inclut toujours une relecture ciblée contre une grille explicite, jamais une publication directe du premier brouillon.',
    choices: Object.freeze([
      Object.freeze({ text: 'J’ai comparé mon texte final à la grille d’auto-évaluation et corrigé ce qui manquait avant de considérer le projet terminé.', correct: true, feedback: 'C’est exactement la méthode enseignée dans ce parcours : produire, puis vérifier contre des critères explicites — jamais publier le premier résultat tel quel.' }),
      Object.freeze({ text: 'J’ai utilisé directement le premier texte généré par l’IA, sans le comparer à la grille.', correct: false, feedback: 'Reviens à la grille d’auto-évaluation ci-dessus : compare ton texte point par point avant de considérer le projet terminé — c’est le cœur de la méthode de ce parcours.' })
    ])
  });
  const result = Object.freeze({ heading: 'Projet final complété.', body: 'Tu as produit un livrable réel avec l’IA, du brief jusqu’à la vérification finale — déclaré terminé par toi, selon la grille ci-dessus. Aucune note serveur n’est attribuée : seule ta propre vérification compte ici.' });
  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'labcap-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({ type: 'text_short', id: 'labcap-brief', outline: brief.heading, step: 'lesson', eyebrow: 'Le projet', heading: brief.heading, body: brief.body }),
    Object.freeze({ type: 'case_study', id: 'labcap-template', outline: template.label, step: 'lesson', label: template.label, text: template.text }),
    Object.freeze({ type: 'scenario', id: 'labcap-checklist', outline: checklist.heading, step: 'exercise', heading: checklist.heading, bad: checklist.bad, good: checklist.good }),
    Object.freeze({ type: 'quiz', id: 'labcap-quiz', outline: evaluation.heading, step: 'quiz', locked: false, data: evaluation }),
    Object.freeze({ type: 'summary', id: 'labcap-result', step: 'review', idSuffix: 'labcap', data: result })
  ]);
  return Object.freeze({
    id: 'LABCAP', title: 'Projet final — Ta page de présentation', prerequisite: 'LAB4', premium: true,
    summary: 'Produire un livrable réel, vérifié contre une grille explicite.',
    estimatedMinutes: 25, markUnderstoodLabel: 'Voir la grille d’auto-évaluation',
    competency, xp, content: Object.freeze({ lead: brief.body }), evaluation, result, steps: Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Comprendre' }),
      Object.freeze({ id: 'exercise', label: 'Produire' }),
      Object.freeze({ id: 'quiz', label: 'Vérifier' }),
      Object.freeze({ id: 'review', label: 'Terminer' })
    ]), blocks
  });
}

// Keyed by the exact lesson ids the client already uses (LESSON_REGISTRY /
// LAB_REGISTRY in dist/app.js) — the route just looks this up, nothing more.
const PREMIUM_CONTENT = Object.freeze({
  'P2.1': lessonP21(),
  'P2.2': lessonP22(),
  LAB4: buildLab4(),
  LABCAP: buildLabCapstone()
});

// P2.1 is the Premium Track's free preview (mandate §5): any authenticated
// learner may read it, Premium or not — only P2.2/LAB4/LABCAP require a
// real, server-confirmed Premium entitlement.
const FREE_PREVIEW_IDS = Object.freeze(new Set(['P2.1']));

module.exports = { PREMIUM_CONTENT, FREE_PREVIEW_IDS };
