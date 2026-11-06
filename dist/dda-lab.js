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
        text: 'Une personne demande à une IA les horaires d’ouverture d’un service administratif précis. L’IA répond avec assurance — mais invente des horaires plausibles. La personne se déplace pour rien : l’information n’a jamais existé dans ce qu’elle a appris, elle l’a simplement complétée pour donner une réponse cohérente.'
      }),
      comparison: Object.freeze({
        heading: 'Deux façons d’utiliser une réponse IA',
        bad: Object.freeze({ label: 'Usage à risque', items: Object.freeze(['Copier-coller la réponse sans la relire', 'Faire confiance parce que le ton est assuré', 'Partager un chiffre ou une date sans vérifier d’où il vient']) }),
        good: Object.freeze({ label: 'Usage maîtrisé', items: Object.freeze(['Vérifier les chiffres, dates et noms propres ailleurs', 'Demander la source quand l’information compte vraiment', 'Traiter la réponse comme un brouillon, jamais comme une preuve']) })
      })
    });
    const practice = Object.freeze({
      id: 'lab1-exercise', label: 'Exercice', heading: 'Repérer une information à vérifier',
      prompt: 'Tu prépares une affiche pour un atelier. L’IA a proposé une date, une adresse et un tarif qui ne figuraient pas dans ton brief. Avant de publier, quelle démarche est la plus sûre ?',
      successText: 'Exactement : un numéro, une adresse ou un prix a un coût réel s’il est faux. Tu le vérifies sur une source officielle avant de t’en servir.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je sépare les éléments fournis par moi des informations ajoutées par l’IA, puis je confirme chaque date, adresse et tarif auprès de l’organisateur.', correct: true, feedback: 'Bonne méthode : tu identifies les ajouts non sourcés et tu vérifies les faits auprès de la personne ou du document qui fait autorité avant publication.' }),
        Object.freeze({ text: 'Je publie l’affiche telle quelle puisque la formulation est professionnelle.', correct: false, feedback: 'La qualité de la mise en forme ne garantit pas la véracité des informations. Une date ou un tarif inventé peut induire les participants en erreur.' }),
        Object.freeze({ text: 'Je demande à une deuxième IA de valider les mêmes informations.', correct: false, feedback: 'Deux outils peuvent reproduire une erreur plausible. La confirmation doit venir d’une source responsable ou officielle, pas d’une IA supplémentaire.' })
      ])
    });
    const evaluation = Object.freeze({
      id: 'lab1-quiz', label: 'Quiz de validation', heading: 'Ce que l’IA fait bien, ce qu’elle fait mal',
      prompt: 'Tu dois publier demain une information sur une fermeture exceptionnelle d’un service. Quelle source constitue la vérification la plus solide ?',
      successText: 'Les faits précis et datés (chiffres, horaires, événements récents) sont exactement ce qu’une IA générative peut inventer avec le plus d’assurance — c’est là que la vérification compte le plus.',
      choices: Object.freeze([
        Object.freeze({ text: 'Reformuler un texte que tu lui donnes toi-même dans un style plus clair.', correct: false, feedback: 'Reformuler un texte que tu fournis est un point fort réel de l’IA : elle travaille sur une matière que tu contrôles déjà.' }),
        Object.freeze({ text: 'Une annonce datée publiée sur le canal officiel du service, ou confirmée directement par celui-ci.', correct: true, feedback: 'Oui : la source responsable est la meilleure preuve pour une information opérationnelle et récente. Vérifie aussi la date de publication et le périmètre de l’annonce.' }),
        Object.freeze({ text: 'Un message vocal transféré sans date ni auteur identifié.', correct: false, feedback: 'Un message transféré peut être ancien, incomplet ou falsifié. Il ne permet pas de confirmer une fermeture officielle.' })
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
        text: 'Avant : « Écris-moi un texte pour vendre mes mangues. » Après : « Je vends des mangues. Écris un statut WhatsApp de 2 phrases, ton chaleureux et direct, avec le prix du kilo à préciser entre crochets, sans emoji. » Le second prompt donne un texte utilisable immédiatement ; le premier donne un texte générique qu’il faut tout réécrire.'
      }),
      comparison: Object.freeze({
        heading: 'Deux façons de demander',
        bad: Object.freeze({ label: 'Demande vague', items: Object.freeze(['« Aide-moi avec mon CV »', 'Aucune précision sur le métier visé ou la longueur', 'Accepter le premier résultat sans préciser ce qui manque']) }),
        good: Object.freeze({ label: 'Demande structurée', items: Object.freeze(['Préciser le contexte (pour qui, pour quoi)', 'Préciser le format attendu (longueur, ton, langue)', 'Redemander en précisant exactement ce qui ne va pas']) })
      })
    });
    const practice = Object.freeze({
      id: 'lab2-exercise', label: 'Exercice', heading: 'Choisir la meilleure version d’un prompt',
      prompt: 'Une association te demande un message WhatsApp pour annoncer une collecte de livres. Quel brief donne à l’IA assez de contexte pour produire un message exploitable ?',
      successText: 'Exactement : préciser la matière, le temps disponible et le format demandé (un planning jour par jour) guide l’IA vers une réponse directement utilisable.',
      choices: Object.freeze([
        Object.freeze({ text: '« Pour une collecte de livres scolaires  samedi, écris un statut WhatsApp de 3 phrases pour les parents : indique les livres recherchés, le lieu à compléter et un ton chaleureux. N’invente aucun contact. »', correct: true, feedback: 'C’est un prompt structuré : matière, délai, temps disponible et format sont tous précisés — la réponse sera directement exploitable.' }),
        Object.freeze({ text: '« Aide-moi à réviser. »', correct: false, feedback: 'Aucune matière, aucun délai, aucun format : l’IA va devoir deviner, et la réponse sera trop générale pour être vraiment utile.' }),
        Object.freeze({ text: '« Donne-moi tout ce qu’il faut savoir en mathématiques. »', correct: false, feedback: 'C’est une demande illimitée dans un domaine entier — sans délai ni niveau précisé, le résultat sera soit trop long, soit hors sujet.' })
      ])
    });
    const evaluation = Object.freeze({
      id: 'lab2-quiz', label: 'Quiz de validation', heading: 'Que faire quand la réponse ne convient pas',
      prompt: 'L’IA a produit un message de collecte correct, mais il manque le lieu et le texte dépasse trois phrases. Quelle correction est la plus efficace ?',
      successText: 'Redemander en précisant exactement ce qui ne va pas (longueur, ton) est toujours plus efficace que recommencer à zéro ou abandonner — c’est la bonne façon d’itérer.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je demande : « Réduis à 3 phrases maximum et laisse [LIEU] visible à compléter. Ne crée aucune adresse. »', correct: true, feedback: 'C’est la bonne méthode : tu gardes la base du travail déjà fait et tu corriges exactement ce qui ne convient pas.' }),
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
      Object.freeze({
        type: 'mission', id: 'lab2-prompt-mission', step: 'exercise', outline: 'Mission : rédiger un prompt',
        eyebrow: 'Mission terrain · 01', heading: 'Prépare une annonce utile pour collecter des livres scolaires ',
        brief: 'Une association organise une collecte. Elle veut publier un statut WhatsApp clair, sans inventer de numéro ni de lieu précis. Rédige un prompt qui permettra à une IA de produire ce statut.',
        placeholder: 'Ex. : Tu es… Rédige… pour… Ton… Contraintes…',
        criteria: Object.freeze([
          'Le rôle ou le contexte de l’IA est précisé',
          'Le public et l’objectif sont explicites',
          'Le format et le ton sont indiqués',
          'Les limites (3 phrases, aucun contact inventé) sont formulées'
        ]),
        example: 'Tu es chargé de communication d’une association . Rédige un statut WhatsApp de 3 phrases pour inviter les familles à donner des livres scolaires. Ton chaleureux et direct. N’invente ni adresse, ni numéro : utilise [lieu à confirmer] et [contact à ajouter].'
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
      prompt: 'Tu relis un résumé de réunion généré par l’IA. Il paraît clair, mais attribue une décision à la mauvaise personne. Quelle action prioritaire adoptes-tu ?',
      successText: 'Exactement : tu demandes une correction précise sur ce point exact, sans tout regénérer — c’est plus rapide et tu gardes le reste du texte qui était bon.',
      choices: Object.freeze([
        Object.freeze({ text: 'Je compare le résumé aux notes de réunion, corrige le nom et la décision, puis vérifie les autres attributions avant diffusion.', correct: true, feedback: 'C’est la bonne méthode : une correction ciblée garde ce qui fonctionnait déjà et règle précisément l’erreur.' }),
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
     L4 et Projet final (Premium) — mandate §6 audit, Lot 2.
     Leur VRAI contenu (texte, exercices, réponses de quiz) ne vit plus ici :
     ce fichier est public et statique, donc tout ce qu'il contenait pouvait
     être lu par un simple curl, sans authentification — exactement la fuite
     que ce lot corrige. Seules les métadonnées non sensibles (déjà visibles
     ailleurs : academy.html affiche déjà ces titres en HTML statique dans le
     catalogue du Lab, y compris pour un visiteur anonyme) restent ici, pour
     que LAB_REGISTRY, le statut du catalogue et la chaîne de prérequis
     continuent de fonctionner sans jamais avoir besoin du vrai contenu.
     Le vrai contenu vit uniquement sur le BFF authentifié
     (bff/src/premium-content.js), derrière GET /v1/premium/content/:id —
     même garde hasActivePremium() que /v1/premium/preview. app.js récupère
     ce contenu via fetchLabPremiumContent() ci-dessous, uniquement après
     confirmation serveur d'un abonnement Premium actif (voir
     refreshServerPremiumEntitlement() dans app.js), et ne monte jamais la
     leçon tant que ses blocks sont vides — jamais un contenu par défaut qui
     ressemblerait au vrai contenu.
     --------------------------------------------------------------------- */
  function buildLab4Meta() {
    return Object.freeze({
      id: 'LAB4', title: 'Produire un livrable complet avec l’IA', prerequisite: 'LAB3', premium: true,
      summary: 'Aller du brief au document fini, et repérer une tâche automatisable.',
      estimatedMinutes: 15, markUnderstoodLabel: 'Passer à l’exercice',
      competency: Object.freeze({ id: 'lab_ai_production', label: 'Produire un livrable complet avec l’IA' }),
      xp: Object.freeze({ lessonViewed: 25, exerciseComplete: 50, quizComplete: 100 }),
      // Real content arrives only via fetchLabPremiumContent() below, once
      // the server has confirmed Premium — until then this stays empty/null
      // and app.js's mountLesson() never renders it.
      content: null, practice: null, evaluation: null, result: null,
      steps: STEPS, blocks: Object.freeze([])
    });
  }

  function buildLabCapstoneMeta() {
    return Object.freeze({
      id: 'LABCAP', title: 'Projet final — Ta page de présentation', prerequisite: 'LAB4', premium: true,
      summary: 'Produire un livrable réel, vérifié contre une grille explicite.',
      estimatedMinutes: 25, markUnderstoodLabel: 'Voir la grille d’auto-évaluation',
      competency: Object.freeze({ id: 'lab_capstone_delivery', label: 'Livrer un document complet et vérifié' }),
      xp: Object.freeze({ lessonViewed: 30, exerciseComplete: 0, quizComplete: 150 }),
      content: null, evaluation: null, result: null,
      steps: Object.freeze([
        Object.freeze({ id: 'lesson', label: 'Comprendre' }),
        Object.freeze({ id: 'exercise', label: 'Produire' }),
        Object.freeze({ id: 'quiz', label: 'Vérifier' }),
        Object.freeze({ id: 'review', label: 'Terminer' })
      ]), blocks: Object.freeze([])
    });
  }

  // Fetches the real LAB4/LABCAP content from the authenticated BFF. Each
  // call returns either the real, complete lesson object the server sends
  // back (id/title/steps/blocks all included — the server's copy, not a
  // merge with the metadata above) or null, honestly, when the BFF is
  // disabled, the learner is not actually entitled, or the request fails —
  // never a fabricated fallback that would resemble real content.
  async function fetchLabPremiumContent() {
    if (!window.DDABFF?.enabled() || typeof window.DDABFF.fetchPremiumContent !== 'function') return { lab4: null, labcap: null };
    let lab4 = null;
    let labcap = null;
    try { lab4 = (await window.DDABFF.fetchPremiumContent('LAB4')).lesson || null; } catch { /* honest failure */ }
    try { labcap = (await window.DDABFF.fetchPremiumContent('LABCAP')).lesson || null; } catch { /* honest failure */ }
    return { lab4, labcap };
  }
  window.DDAFetchLabPremiumContent = fetchLabPremiumContent;

  window.DDALab = Object.freeze({
    track: Object.freeze({
      id: 'ai-foundations',
      title: 'IA pour agir',
      promise: 'Utiliser l’IA pour produire, organiser et construire un petit projet numérique concret — sans jargon, sans outil payant obligatoire.',
      audience: 'Grand débutant, sur téléphone, avec les versions gratuites des outils IA.'
    }),
    lessons: Object.freeze([buildLab1(), buildLab2(), buildLab3(), buildLab4Meta()]),
    capstone: buildLabCapstoneMeta()
  });
})();
