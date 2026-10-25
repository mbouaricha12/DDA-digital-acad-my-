/* ==========================================================================
   DDA LAB — parcours pilote « IA pour agir » (AI Foundations).
   Contenu pur, dans le même format qu'une leçon du curriculum principal
   (dda-core.js) : { id, title, summary, estimatedMinutes, competency, xp,
   content:{lead}, steps, blocks }. Rendu par le même DDALessonRenderer que
   M0.1-M1.3 (aucun nouveau moteur), via un registre et un état de progression
   séparés (voir app.js LAB_REGISTRY) — volontairement hors de
   DDA.curriculum et de DDALearning.nextActionable(), pour ne jamais
   s'insérer dans la recommandation « prochaine action » du parcours trading.
   Littéral de données pures, sans référence externe — testable tel quel.
   ========================================================================== */
(function () {
  'use strict';

  const STEPS = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Comprendre' }),
    Object.freeze({ id: 'exercise', label: 'Essayer' }),
    Object.freeze({ id: 'quiz', label: 'Vérifier' }),
    Object.freeze({ id: 'review', label: 'Continuer' })
  ]);

  /* ---------------------------------------------------------------------
     L1 — Ce que l'IA sait faire, et où elle se trompe
     Compétence : évaluer la fiabilité d'une réponse IA avant de l'utiliser.
     --------------------------------------------------------------------- */
  function buildLab1() {
    const competency = Object.freeze({ id: 'lab_ai_reliability', label: 'Évaluer la fiabilité d’une réponse IA' });
    const xp = Object.freeze({ lessonViewed: 20, exerciseComplete: 40, quizComplete: 80 });
    const content = Object.freeze({
      lead: 'Avant d’utiliser l’IA pour travailler, comprends ce qu’elle fait réellement — et à quel moment elle se trompe avec assurance.',
      concept: Object.freeze({
        heading: 'Une IA comme ChatGPT ne « sait » rien',
        body: 'Un assistant comme ChatGPT ou Gemini fonctionne en prédisant le mot le plus probable à la suite de ce que tu as écrit, à partir de millions de textes lus pendant son entraînement. Il ne consulte pas internet en direct par défaut, ne connaît pas forcément l’actualité du jour, et peut inventer un chiffre, une date ou un nom avec exactement le même ton assuré qu’une information vraie.'
      }),
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Une réponse qui sonne juste n’est pas une réponse vérifiée.' }),
      example: Object.freeze({
        label: 'Exemple concret',
        text: 'Une personne à Abidjan demande à une IA les horaires d’ouverture d’un service administratif précis. L’IA répond avec assurance — mais invente des horaires plausibles. La personne se déplace pour rien : l’information n’a jamais existé dans ce qu’elle a appris, elle l’a simplement complétée pour donner une réponse cohérente.'
      }),
      comparison: Object.freeze({
        heading: 'Deux façons d’utiliser une réponse IA',
        bad: Object.freeze({ label: 'Usage à risque', items: Object.freeze(['Copier-coller la réponse sans la relire', 'Faire confiance parce que le ton est assuré', 'Partager un chiffre ou une date sans vérifier d’où il vient']) }),
        good: Object.freeze({ label: 'Usage maîtrisé', items: Object.freeze(['Vérifier les chiffres, dates et noms propres ailleurs', 'Demander la source quand l’information compte vraiment', 'Traiter la réponse comme un brouillon, jamais comme une preuve']) })
      })
    });
    const practice = Object.freeze({
      id: 'lab1-exercise', label: 'Exercice', heading: 'Repérer une information à vérifier',
      prompt: 'Tu demandes à une IA le numéro officiel d’un service public pour un proche. Elle te donne un numéro précis, présenté avec assurance. Que fais-tu avant de le communiquer ?',
      successText: 'Exactement : un numéro, une adresse ou un prix a un coût réel s’il est faux. Tu le vérifies sur une source officielle avant de t’en servir.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je le vérifie sur le site officiel du service ou un document récent avant de le communiquer.', correct: true, feedback: 'C’est le bon réflexe : une information qui a une conséquence réelle (appeler, se déplacer, payer) se vérifie toujours avant usage.' }),
        Object.freeze({ text: 'Je le communique directement : l’IA a dû le trouver quelque part.', correct: false, feedback: 'L’IA n’a pas « trouvé » ce numéro dans une base à jour — elle a généré la réponse la plus probable. Sans vérification, tu risques de transmettre une erreur avec assurance.' }),
        Object.freeze({ text: 'Je redemande la même question à la même IA pour confirmer.', correct: false, feedback: 'Reposer la même question au même outil donne souvent la même réponse, vraie ou fausse — ce n’est pas une vérification, juste une répétition.' })
      ])
    });
    const evaluation = Object.freeze({
      id: 'lab1-quiz', label: 'Quiz de validation', heading: 'Ce que l’IA fait bien, ce qu’elle fait mal',
      prompt: 'Pour quel type de tâche une IA générative est-elle la MOINS fiable sans vérification ?',
      successText: 'Les faits précis et datés (chiffres, horaires, événements récents) sont exactement ce qu’une IA générative peut inventer avec le plus d’assurance — c’est là que la vérification compte le plus.',
      choices: Object.freeze([
        Object.freeze({ text: 'Reformuler un texte que tu lui donnes toi-même dans un style plus clair.', correct: false, feedback: 'Reformuler un texte que tu fournis est un point fort réel de l’IA : elle travaille sur une matière que tu contrôles déjà.' }),
        Object.freeze({ text: 'Donner un chiffre précis, une date ou un événement récent sans le signaler comme incertain.', correct: true, feedback: 'C’est exactement le point faible à surveiller : l’IA peut produire un fait précis totalement inventé, avec le même ton que les faits exacts.' }),
        Object.freeze({ text: 'Proposer plusieurs façons de présenter une même idée.', correct: false, feedback: 'Proposer des variantes autour d’une idée que tu donnes est un usage fiable — il n’y a pas de fait à vérifier, seulement une formulation.' })
      ])
    });
    const result = Object.freeze({ heading: 'Première leçon du Lab terminée.', body: 'Tu sais maintenant repérer une réponse IA à vérifier avant de l’utiliser — la base de tout le reste.' });
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'lab1-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'lab1-concept', outline: content.concept.heading, step: 'lesson', eyebrow: 'Le concept', heading: content.concept.heading, body: content.concept.body, principle: content.principle }),
      Object.freeze({ type: 'case_study', id: 'lab1-example', outline: content.example.label, step: 'lesson', label: content.example.label, text: content.example.text }),
      Object.freeze({ type: 'scenario', id: 'lab1-comparison', outline: content.comparison.heading, step: 'lesson', heading: content.comparison.heading, bad: content.comparison.bad, good: content.comparison.good }),
      Object.freeze({
        type: 'decision_choice', id: 'lab1-practice-choice', step: 'lesson', outline: 'À toi de juger', eyebrow: 'Mettre en pratique',
        heading: 'L’IA te donne un prix pour un trajet en taxi dans une ville que tu ne connais pas. Que fais-tu ?',
        prompt: 'Applique ce que tu viens de voir.',
        options: Object.freeze([
          Object.freeze({ text: 'Je pars du principe que ce prix est approximatif et je le confirme sur place ou avec une personne qui connaît la ville.', correct: true, feedback: 'Bonne lecture : un prix local change vite et varie selon le quartier — tu traites la réponse comme une estimation, pas un tarif garanti.' }),
          Object.freeze({ text: 'Je négocie directement à partir de ce prix, l’IA est précise sur ce genre de détail.', correct: false, feedback: 'Un prix local n’est pas le genre d’information qu’une IA connaît avec précision et à jour — tu risques de négocier à partir d’un chiffre inventé.' })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'lab1-exercise', outline: practice.heading, step: 'exercise', locked: false, data: practice }),
      Object.freeze({ type: 'quiz', id: 'lab1-quiz', outline: evaluation.heading, step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'summary', id: 'lab1-result', step: 'review', idSuffix: 'lab1', data: result, continueTo: Object.freeze({ view: 'lesson-lab2', label: 'Continuer vers Formuler une demande claire' }) })
    ]);
    return Object.freeze({
      id: 'LAB1', title: 'Ce que l’IA sait faire, et où elle se trompe',
      summary: 'Comprendre comment une IA générative répond, pour savoir quand la croire.',
      estimatedMinutes: 10, markUnderstoodLabel: 'Passer à l’exercice',
      competency, xp, content, practice, evaluation, result, steps: STEPS, blocks
    });
  }

  /* ---------------------------------------------------------------------
     L2 — Formuler une demande claire et l'améliorer
     Compétence : écrire un prompt structuré, puis le corriger.
     --------------------------------------------------------------------- */
  function buildLab2() {
    const competency = Object.freeze({ id: 'lab_prompt_craft', label: 'Formuler un prompt clair et l’améliorer' });
    const xp = Object.freeze({ lessonViewed: 20, exerciseComplete: 40, quizComplete: 80 });
    const content = Object.freeze({
      lead: 'Une bonne réponse commence presque toujours par une bonne question. Apprends à structurer ta demande au lieu de la deviner.',
      concept: Object.freeze({
        heading: 'Un prompt utile a quatre ingrédients',
        body: 'Qui tu es ou dans quel contexte tu écris, ce que tu veux exactement (la tâche), sous quelle forme (longueur, ton, format) et les contraintes à respecter (public visé, ce qu’il faut éviter). Plus ces quatre points sont clairs, moins l’IA a besoin de deviner — et moins elle devine, moins elle se trompe.'
      }),
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Si ta demande est vague, la réponse sera vague — précise la demande avant de juger la réponse.' }),
      example: Object.freeze({
        label: 'Avant / après',
        text: 'Avant : « Écris-moi un texte pour vendre mes mangues. » Après : « Je vends des mangues à Bouaké. Écris un statut WhatsApp de 2 phrases, ton chaleureux et direct, avec le prix du kilo à préciser entre crochets, sans emoji. » Le second prompt donne un texte utilisable immédiatement ; le premier donne un texte générique qu’il faut tout réécrire.'
      }),
      comparison: Object.freeze({
        heading: 'Deux façons de demander',
        bad: Object.freeze({ label: 'Demande vague', items: Object.freeze(['« Aide-moi avec mon CV »', 'Aucune précision sur le métier visé ou la longueur', 'Accepter le premier résultat sans préciser ce qui manque']) }),
        good: Object.freeze({ label: 'Demande structurée', items: Object.freeze(['Préciser le contexte (pour qui, pour quoi)', 'Préciser le format attendu (longueur, ton, langue)', 'Redemander en précisant exactement ce qui ne va pas']) })
      })
    });
    const practice = Object.freeze({
      id: 'lab2-exercise', label: 'Exercice', heading: 'Choisir la meilleure version d’un prompt',
      prompt: 'Tu veux un plan de révision pour un examen dans 3 semaines. Quel prompt donnera le résultat le plus utile ?',
      successText: 'Exactement : préciser la matière, le temps disponible et le format demandé (un planning jour par jour) guide l’IA vers une réponse directement utilisable.',
      choices: Object.freeze([
        Object.freeze({ text: '« Fais-moi un planning de révision de mathématiques pour un examen dans 3 semaines, 1h par jour en semaine, présenté jour par jour. »', correct: true, feedback: 'C’est un prompt structuré : matière, délai, temps disponible et format sont tous précisés — la réponse sera directement exploitable.' }),
        Object.freeze({ text: '« Aide-moi à réviser. »', correct: false, feedback: 'Aucune matière, aucun délai, aucun format : l’IA va devoir deviner, et la réponse sera trop générale pour être vraiment utile.' }),
        Object.freeze({ text: '« Donne-moi tout ce qu’il faut savoir en mathématiques. »', correct: false, feedback: 'C’est une demande illimitée dans un domaine entier — sans délai ni niveau précisé, le résultat sera soit trop long, soit hors sujet.' })
      ])
    });
    const evaluation = Object.freeze({
      id: 'lab2-quiz', label: 'Quiz de validation', heading: 'Que faire quand la réponse ne convient pas',
      prompt: 'L’IA te donne un texte trop long et trop formel pour un message WhatsApp à un client. Quelle est la meilleure prochaine étape ?',
      successText: 'Redemander en précisant exactement ce qui ne va pas (longueur, ton) est toujours plus efficace que recommencer à zéro ou abandonner — c’est la bonne façon d’itérer.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je précise : « Raccourcis à 2 phrases et rends le ton plus simple, comme à un ami. »', correct: true, feedback: 'C’est la bonne méthode : tu gardes la base du travail déjà fait et tu corriges exactement ce qui ne convient pas.' }),
        Object.freeze({ text: 'Je recommence une nouvelle conversation depuis zéro en espérant un meilleur résultat.', correct: false, feedback: 'Recommencer à zéro fait perdre le contexte déjà construit — il est presque toujours plus rapide de corriger ce qui ne va pas.' }),
        Object.freeze({ text: 'Je copie le texte tel quel, il est globalement correct.', correct: false, feedback: 'Un ton inadapté au bon destinataire peut nuire à la relation avec un client — corriger le ton ne prend qu’une phrase de plus.' })
      ])
    });
    const result = Object.freeze({ heading: 'Deuxième leçon du Lab terminée.', body: 'Tu sais maintenant structurer une demande et la corriger au lieu de la refaire à zéro.' });
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'lab2-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'lab2-concept', outline: content.concept.heading, step: 'lesson', eyebrow: 'Le concept', heading: content.concept.heading, body: content.concept.body, principle: content.principle }),
      Object.freeze({ type: 'case_study', id: 'lab2-example', outline: content.example.label, step: 'lesson', label: content.example.label, text: content.example.text }),
      Object.freeze({ type: 'scenario', id: 'lab2-comparison', outline: content.comparison.heading, step: 'lesson', heading: content.comparison.heading, bad: content.comparison.bad, good: content.comparison.good }),
      Object.freeze({
        type: 'decision_choice', id: 'lab2-practice-choice', step: 'lesson', outline: 'À toi de choisir', eyebrow: 'Mettre en pratique',
        heading: 'Tu veux un message pour relancer un client qui n’a pas payé une facture. Quel prompt est le mieux construit ?',
        prompt: 'Applique les quatre ingrédients vus plus haut.',
        options: Object.freeze([
          Object.freeze({ text: '« Écris-moi un message professionnel mais ferme pour relancer un client sur une facture impayée de 15 jours, en gardant une porte ouverte pour continuer à travailler ensemble. »', correct: true, feedback: 'Contexte, ton et objectif sont précisés — le résultat sera directement utilisable, sans devoir tout réécrire.' }),
          Object.freeze({ text: '« Écris-moi un message pour un client. »', correct: false, feedback: 'Aucun contexte (quel sujet, quel ton, quel objectif) : l’IA va produire un message générique qu’il faudra entièrement adapter.' })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'lab2-exercise', outline: practice.heading, step: 'exercise', locked: false, data: practice }),
      Object.freeze({ type: 'quiz', id: 'lab2-quiz', outline: evaluation.heading, step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'summary', id: 'lab2-result', step: 'review', idSuffix: 'lab2', data: result, continueTo: Object.freeze({ view: 'lesson-lab3', label: 'Continuer vers Vérifier et corriger' }) })
    ]);
    return Object.freeze({
      id: 'LAB2', title: 'Formuler une demande claire, et l’améliorer', prerequisite: 'LAB1',
      summary: 'Structurer un prompt et savoir le corriger au lieu de recommencer.',
      estimatedMinutes: 10, markUnderstoodLabel: 'Passer à l’exercice',
      competency, xp, content, practice, evaluation, result, steps: STEPS, blocks
    });
  }

  /* ---------------------------------------------------------------------
     L3 — Vérifier, corriger et améliorer un résultat IA
     Compétence : contrôle qualité d'un livrable IA avant usage.
     --------------------------------------------------------------------- */
  function buildLab3() {
    const competency = Object.freeze({ id: 'lab_ai_qc', label: 'Contrôler et corriger un résultat IA' });
    const xp = Object.freeze({ lessonViewed: 20, exerciseComplete: 40, quizComplete: 80 });
    const content = Object.freeze({
      lead: 'Un bon résultat IA n’est presque jamais le premier brouillon — c’est celui que tu as relu et corrigé avec méthode.',
      concept: Object.freeze({
        heading: 'Trois relectures, pas une seule',
        body: 'Relis d’abord pour les faits (chiffres, noms, dates — rien d’inventé ne doit rester). Relis ensuite pour le ton (est-ce adapté à la personne qui va lire : client, administration, ami ?). Relis enfin pour ce qui manque (une information essentielle a-t-elle été oubliée ?). Ces trois relectures prennent quelques minutes et évitent la plupart des erreurs visibles.'
      }),
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Ce que tu publies t’engage, pas l’IA — la relecture finale est toujours la tienne.' }),
      example: Object.freeze({
        label: 'Exemple concret',
        text: 'Une IA rédige un message pour annoncer un retard de livraison à un client. Le texte est correct sur le fond, mais trop familier pour ce client précis, et il oublie de proposer une nouvelle date. Après relecture, le ton est ajusté et une phrase est ajoutée pour proposer un nouveau délai — le message devient réellement utilisable.'
      }),
      comparison: Object.freeze({
        heading: 'Deux façons de finir un travail avec l’IA',
        bad: Object.freeze({ label: 'Publication directe', items: Object.freeze(['Copier-coller sans relire', 'Ne pas vérifier si un chiffre ou un nom est exact', 'Envoyer sans se demander si le ton convient au destinataire']) }),
        good: Object.freeze({ label: 'Relecture en trois temps', items: Object.freeze(['Vérifier les faits avant tout', 'Ajuster le ton au bon destinataire', 'Vérifier qu’aucune information essentielle ne manque']) })
      })
    });
    const practice = Object.freeze({
      id: 'lab3-exercise', label: 'Exercice', heading: 'Corriger au bon endroit',
      prompt: 'L’IA a rédigé un texte correct, mais il contient une date de rendez-vous qui ne correspond pas à celle que tu avais donnée dans ta demande. Quelle est la meilleure réaction ?',
      successText: 'Exactement : tu demandes une correction précise sur ce point exact, sans tout regénérer — c’est plus rapide et tu gardes le reste du texte qui était bon.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je précise la bonne date à l’IA et je lui demande de corriger uniquement cette phrase.', correct: true, feedback: 'C’est la bonne méthode : une correction ciblée garde ce qui fonctionnait déjà et règle précisément l’erreur.' }),
        Object.freeze({ text: 'Je corrige moi-même la date directement dans le texte sans rien dire à l’IA.', correct: false, feedback: 'Ce n’est pas faux en soi, mais tu perds l’occasion de vérifier si l’erreur vient d’un malentendu qui pourrait se reproduire ailleurs dans le texte.' }),
        Object.freeze({ text: 'Je redemande tout le texte depuis le début en espérant que la date soit juste cette fois.', correct: false, feedback: 'Régénérer tout le texte sans préciser l’erreur ne garantit rien — le plus efficace est de signaler exactement ce qui doit changer.' })
      ])
    });
    const evaluation = Object.freeze({
      id: 'lab3-quiz', label: 'Quiz de validation', heading: 'Les trois relectures',
      prompt: 'Tu relis un message professionnel écrit par l’IA et tu remarques qu’il est factuellement juste, mais beaucoup trop familier pour la personne qui va le recevoir. Quelle relecture a détecté ce problème ?',
      successText: 'C’est la relecture du ton : les faits peuvent être exacts tout en étant mal adaptés à la personne qui lit — c’est pour ça que les trois relectures sont complémentaires, pas interchangeables.',
      choices: Object.freeze([
        Object.freeze({ text: 'La relecture des faits.', correct: false, feedback: 'La relecture des faits vérifie que rien n’est inventé — ici le contenu est exact, le problème est ailleurs.' }),
        Object.freeze({ text: 'La relecture du ton.', correct: true, feedback: 'Exactement : un texte peut être parfaitement exact tout en étant inadapté à son destinataire — c’est précisément ce que cette relecture détecte.' }),
        Object.freeze({ text: 'La relecture de ce qui manque.', correct: false, feedback: 'Cette relecture cherche une information absente, pas un ton mal choisi.' })
      ])
    });
    const result = Object.freeze({ heading: 'Troisième leçon du Lab terminée.', body: 'Tu sais relire et corriger un résultat IA avant de l’utiliser. La suite — produire un livrable complet et découvrir l’automatisation — fait partie de DDA Premium.' });
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'lab3-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'lab3-concept', outline: content.concept.heading, step: 'lesson', eyebrow: 'Le concept', heading: content.concept.heading, body: content.concept.body, principle: content.principle }),
      Object.freeze({ type: 'case_study', id: 'lab3-example', outline: content.example.label, step: 'lesson', label: content.example.label, text: content.example.text }),
      Object.freeze({ type: 'scenario', id: 'lab3-comparison', outline: content.comparison.heading, step: 'lesson', heading: content.comparison.heading, bad: content.comparison.bad, good: content.comparison.good }),
      Object.freeze({
        type: 'decision_choice', id: 'lab3-practice-choice', step: 'lesson', outline: 'À toi de juger', eyebrow: 'Mettre en pratique',
        heading: 'Un texte IA pour un devoir scolaire est bien écrit, mais tu ne reconnais pas certains mots que tu n’utiliserais jamais toi-même. Que fais-tu ?',
        prompt: 'Applique la relecture du ton.',
        options: Object.freeze([
          Object.freeze({ text: 'Je redemande une version qui ressemble davantage à ma façon d’écrire habituelle, avec des mots plus simples.', correct: true, feedback: 'Bon réflexe : un travail doit rester crédible venant de toi — ajuster le style fait partie de la relecture du ton.' }),
          Object.freeze({ text: 'Je le rends tel quel, les mots compliqués font bonne impression.', correct: false, feedback: 'Un texte qui ne te ressemble pas peut éveiller des doutes — et surtout, tu n’apprends rien si tu ne comprends pas ce que tu rends.' })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'lab3-exercise', outline: practice.heading, step: 'exercise', locked: false, data: practice }),
      Object.freeze({ type: 'quiz', id: 'lab3-quiz', outline: evaluation.heading, step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'summary', id: 'lab3-result', step: 'review', idSuffix: 'lab3', data: result })
    ]);
    return Object.freeze({
      id: 'LAB3', title: 'Vérifier, corriger et améliorer un résultat IA', prerequisite: 'LAB2',
      summary: 'Relire avec méthode avant d’utiliser un résultat IA.',
      estimatedMinutes: 10, markUnderstoodLabel: 'Passer à l’exercice',
      competency, xp, content, practice, evaluation, result, steps: STEPS, blocks
    });
  }

  /* ---------------------------------------------------------------------
     L4 (Premium) — Produire un livrable complet + introduction à l'automatisation
     Compétence : construire un document fini avec l'IA ; reconnaître une
     tâche automatisable simple. Aucun outil payant, aucune API DDA appelée.
     --------------------------------------------------------------------- */
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
        text: 'Fatou répare des téléphones à Lomé. Brief donné à l’IA : « Rédige une courte page de présentation pour mon activité de réparation de téléphones, pour des clients qui me trouveraient sur WhatsApp : qui je suis, ce que je répare, pourquoi me faire confiance, comment me contacter. Ton simple et rassurant, 150 mots maximum. » Premier brouillon trop long → relecture ciblée : « Raccourcis à 100 mots et commence directement par ce que tu répares. » Résultat : un texte prêt à coller dans son statut WhatsApp Business.'
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
      competency, xp, content, practice, evaluation, result, steps: STEPS, blocks
    });
  }

  /* ---------------------------------------------------------------------
     Projet final (Premium) — page de présentation réalisée avec l'IA.
     Aucune correction automatique : auto-évaluation guidée contre une
     grille explicite, jamais présentée comme une évaluation serveur.
     --------------------------------------------------------------------- */
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

  window.DDALab = Object.freeze({
    track: Object.freeze({
      id: 'ai-foundations',
      title: 'IA pour agir',
      promise: 'Utiliser l’IA pour produire, organiser et construire un petit projet numérique concret — sans jargon, sans outil payant obligatoire.',
      audience: 'Grand débutant, sur téléphone, avec les versions gratuites des outils IA.'
    }),
    lessons: Object.freeze([buildLab1(), buildLab2(), buildLab3(), buildLab4()]),
    capstone: buildLabCapstone()
  });
})();
