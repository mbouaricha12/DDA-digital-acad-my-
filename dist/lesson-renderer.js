/* DDA Learning & Engagement System V1 — curriculum-agnostic block renderer.
   A lesson is an ordered list of typed BLOCKS (lesson.blocks). Each block is
   dispatched by its `type` to one render function below. Two lessons can use
   a different set of block types, in a different order and count, without
   any change to this file, app.js or index.html — that is the property this
   file exists to prove. M0.1 is one valid composition, not a mandatory
   template: nothing here assumes every lesson has an "exercise" and a
   "quiz", or any fixed number of blocks.
   Renderers only ever turn data into markup — no state, no event binding,
   no hardcoded pedagogical content. app.js still owns interaction. */
(function () {
  'use strict';

  const DIAGRAMS = {
    exchange: () => `
      <div class="exchange-visual">
        <svg class="exchange-diagram" viewBox="0 0 320 130" aria-hidden="true">
          <line class="lane" x1="20" y1="65" x2="300" y2="65"/>
          <path class="flow" d="M65 65h190"/>
          <g class="buyer" transform="translate(20,30)"><use href="#icon-buyer" width="42" height="42"/></g>
          <g class="seller" transform="translate(258,30)"><use href="#icon-seller" width="42" height="42"/></g>
          <circle class="asset" cx="160" cy="65" r="16"/>
          <text x="160" y="70" font-size="11" text-anchor="middle" fill="#050B14" font-weight="700" font-family="Inter, sans-serif">$</text>
          <text x="41" y="112" font-size="10" text-anchor="middle" fill="#93A6BA" font-family="Inter, sans-serif">Acheteur</text>
          <text x="279" y="112" font-size="10" text-anchor="middle" fill="#93A6BA" font-family="Inter, sans-serif">Vendeur</text>
        </svg>
      </div>`
  };

  function renderChoices(question) {
    return question.choices.map(choice => {
      const feedbackAttr = choice.feedback ? ` data-feedback="${choice.feedback}"` : '';
      return `<button data-correct="${choice.correct === true}"${feedbackAttr}>${choice.text}</button>`;
    }).join('');
  }

  /* ---- Block renderers — one per type. Each takes only its own block. ---- */

  const BLOCK_RENDERERS = {
    text_short(block) {
      return `
      <div class="lesson-copy">
        <p class="eyebrow gold">${block.eyebrow || ''}</p>
        <h2>${block.heading}</h2>
        <p>${block.body}</p>
        ${block.principle ? `<div class="principle"><svg class="icon"><use href="#icon-compass"/></svg><div><span>${block.principle.label}</span><strong>${block.principle.text}</strong></div></div>` : ''}
      </div>`;
    },

    diagram(block) {
      return `
      <div class="video-stage">
        ${(DIAGRAMS[block.diagram] || DIAGRAMS.exchange)()}
        <button class="play-button" id="play-demo" aria-label="Lire la démonstration">▶</button>
        <p id="video-caption">${block.caption || ''}</p>
      </div>`;
    },

    image_explainer(block) {
      return `
      <figure class="image-explainer-block" id="${block.id}-block">
        <div class="photo-frame ${block.tone || 'dark'} ratio-wide"><svg class="icon"><use href="#icon-photo"/></svg><span>${block.placeholderLabel || 'Illustration à intégrer'}</span></div>
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
      </figure>`;
    },

    video(block) {
      if (!block.src) {
        return `
        <div class="video-explainer-block" id="${block.id}-block">
          <div class="photo-frame dark ratio-wide"><svg class="icon"><use href="#icon-play"/></svg><span>${block.placeholderLabel || 'Vidéo à intégrer'}</span></div>
          ${block.caption ? `<p class="video-explainer-caption">${block.caption}</p>` : ''}
        </div>`;
      }
      return `
      <div class="video-explainer-block" id="${block.id}-block">
        <video controls src="${block.src}"${block.poster ? ` poster="${block.poster}"` : ''}></video>
        ${block.caption ? `<p class="video-explainer-caption">${block.caption}</p>` : ''}
      </div>`;
    },

    case_study(block) {
      return `
      <div class="example-callout">
        <svg class="icon"><use href="#icon-target"/></svg>
        <div><span>${block.label}</span><p>${block.text}</p></div>
      </div>`;
    },

    scenario(block) {
      return `
      <div class="comparison-block">
        <p class="eyebrow gold">Synthèse</p>
        <h2>${block.heading}</h2>
        <div class="comparison-grid">
          <div class="comparison-col bad"><span><svg class="icon"><use href="#icon-blocked"/></svg> ${block.bad.label}</span><ul>${block.bad.items.map(item => `<li>${item}</li>`).join('')}</ul></div>
          <div class="comparison-col good"><span><svg class="icon"><use href="#icon-check-circle"/></svg> ${block.good.label}</span><ul>${block.good.items.map(item => `<li>${item}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    },

    mini_simulation(block) {
      return `
      <section class="mini-simulation-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Mini-simulation'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p>${block.prompt}</p>` : ''}
        <div class="mini-simulation-stage">${block.state || 'Aperçu structurel — composant non encore relié à un scénario réel.'}</div>
      </section>`;
    },

    graphical_exercise(block) {
      return `
      <section class="graphical-exercise-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Exercice graphique'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p>${block.prompt}</p>` : ''}
        <div class="graphical-exercise-canvas" aria-hidden="true">${block.canvasLabel || 'Aperçu structurel — zone graphique non encore reliée à un contenu réel.'}</div>
      </section>`;
    },

    decision_choice(block) {
      return `
      <section class="decision-choice-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Choix de décision'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p>${block.prompt}</p>` : ''}
        <div class="decision-choice-options">${(block.options || []).map(opt => `<button type="button" class="decision-option">${opt}</button>`).join('')}</div>
      </section>`;
    },

    quiz(block) {
      const q = block.data;
      return `
      <section class="learning-check${block.locked ? ' locked-check' : ''}" id="${q.id}-block"${block.locked ? ' aria-disabled="true"' : ''}>
        <p class="eyebrow gold">${q.label}</p>
        <h2>${q.heading}</h2>
        ${q.prompt ? `<p>${q.prompt}</p>` : ''}
        <div class="answer-grid" data-question="${q.id}">${renderChoices(q)}</div>
        <p class="feedback" id="${q.id}-feedback" aria-live="polite"></p>
      </section>`;
    },

    competency_check(block) {
      if (block.mode === 'targets') {
        return `
        <div class="competency-check-block targets" id="${block.id}-block">
          <svg class="icon"><use href="#icon-target"/></svg>
          <p>Cette leçon travaille une compétence précise : <strong>${block.competency.label}</strong></p>
        </div>`;
      }
      return `
      <div class="competency-check-block confirms" id="${block.id}-block">
        <svg class="icon"><use href="#icon-check-circle"/></svg>
        <p>Compétence confirmée : <strong>${block.competency.label}</strong></p>
      </div>`;
    },

    journal_link(block) {
      return `
      <div class="journal-link-block" id="${block.id}-block">
        <svg class="icon"><use href="#icon-journal"/></svg>
        <p>${block.prompt}</p>
        <button class="secondary-action" data-view="journal">${block.cta} <span>→</span></button>
      </div>`;
    },

    summary(block) {
      const r = block.data;
      return `
      <section class="result-card" id="result-card" hidden>
        <span class="result-icon">✓</span>
        <div>
          <p class="eyebrow">Validation locale</p>
          <h2>${r.heading}</h2>
          <p>${r.body}</p>
          <dl class="result-stats" id="result-stats"></dl>
          <div class="result-actions">
            <button class="secondary-action result-action" data-view="dashboard">Voir mon Terminal</button>
            <button class="secondary-action result-action" data-view="progress">Voir ma Progression</button>
            <button class="text-action result-feedback" data-view="support">Donner mon retour de test</button>
          </div>
        </div>
      </section>`;
    }
  };

  function renderBlock(block) {
    const renderer = BLOCK_RENDERERS[block.type];
    if (!renderer) return '';
    return renderer(block);
  }

  function renderLessonMain(module, lesson) {
    const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id) + 1;
    return `
      <p class="eyebrow gold">${module.title} · Leçon ${lessonIndex}</p>
      <h1 id="lesson-title">${lesson.title}</h1>
      <p class="lesson-lead">${lesson.content.lead}</p>
      <ol class="lesson-loop" id="lesson-loop" aria-label="Progression dans la leçon">
        <li data-step="lesson">Comprendre</li>
        <li data-step="exercise">Exercice</li>
        <li data-step="quiz">Quiz</li>
        <li data-step="review">Résultat</li>
      </ol>

      ${lesson.blocks.map(renderBlock).join('\n')}

      <div class="lesson-actions">
        <button class="secondary-action" data-view="dashboard">Quitter</button>
        <button class="primary-action" id="mark-understood">Passer à l’exercice <span>→</span></button>
      </div>`;
  }

  function renderLessonOutline(lesson) {
    const beats = lesson.blocks.filter(block => block.outline);
    return `
      <p class="eyebrow">Dans cette leçon</p>
      <ol id="lesson-outline-list">${beats.map(beat => `<li data-outline-step="${beat.step}">${beat.outline}</li>`).join('')}</ol>
      <div class="saved-state" id="saved-state">Progression non enregistrée — prototype</div>`;
  }

  window.DDALessonRenderer = Object.freeze({ renderLessonMain, renderLessonOutline, renderBlock, BLOCK_RENDERERS });
})();
