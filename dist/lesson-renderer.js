/* DDA Lesson Renderer — curriculum-agnostic. Turns a lesson's structured content
   into the DDA pedagogical component markup. No state, no event binding: app.js
   still owns interaction and progress logic, this file only ever produces HTML
   strings from (module, lesson) data so the same rendering serves every future
   authored lesson (M0.2–M9) without touching this file or index.html again. */
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

  function renderQuestionSection(question, { id, locked }) {
    return `
      <section class="learning-check${locked ? ' locked-check' : ''}" id="${id}-block"${locked ? ' aria-disabled="true"' : ''}>
        <p class="eyebrow gold">${question.label}</p>
        <h2>${question.heading}</h2>
        ${question.prompt ? `<p>${question.prompt}</p>` : ''}
        <div class="answer-grid" data-question="${question.id}">${renderChoices(question)}</div>
        <p class="feedback" id="${question.id}-feedback" aria-live="polite"></p>
      </section>`;
  }

  function renderLessonMain(module, lesson) {
    const c = lesson.content;
    const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id) + 1;
    return `
      <p class="eyebrow gold">${module.title} · Leçon ${lessonIndex}</p>
      <h1 id="lesson-title">${lesson.title}</h1>
      <p class="lesson-lead">${c.lead}</p>
      <ol class="lesson-loop" id="lesson-loop" aria-label="Progression dans la leçon">
        <li data-step="lesson">Comprendre</li>
        <li data-step="exercise">Exercice</li>
        <li data-step="quiz">Quiz</li>
        <li data-step="review">Résultat</li>
      </ol>

      <div class="lesson-copy">
        <p class="eyebrow gold">Le concept</p>
        <h2>${c.concept.heading}</h2>
        <p>${c.concept.body}</p>
        <div class="principle"><svg class="icon"><use href="#icon-compass"/></svg><div><span>${c.principle.label}</span><strong>${c.principle.text}</strong></div></div>
      </div>

      <div class="video-stage">
        ${(DIAGRAMS[c.diagram] || DIAGRAMS.exchange)()}
        <button class="play-button" id="play-demo" aria-label="Lire la démonstration">▶</button>
        <p id="video-caption">Une décision commence par l’observation.</p>
      </div>

      <div class="example-callout">
        <svg class="icon"><use href="#icon-target"/></svg>
        <div><span>${c.example.label}</span><p>${c.example.text}</p></div>
      </div>

      <div class="comparison-block">
        <p class="eyebrow gold">Synthèse</p>
        <h2>${c.comparison.heading}</h2>
        <div class="comparison-grid">
          <div class="comparison-col bad"><span><svg class="icon"><use href="#icon-blocked"/></svg> ${c.comparison.bad.label}</span><ul>${c.comparison.bad.items.map(item => `<li>${item}</li>`).join('')}</ul></div>
          <div class="comparison-col good"><span><svg class="icon"><use href="#icon-check-circle"/></svg> ${c.comparison.good.label}</span><ul>${c.comparison.good.items.map(item => `<li>${item}</li>`).join('')}</ul></div>
        </div>
      </div>

      ${renderQuestionSection(lesson.practice, { id: 'exercise', locked: false })}
      ${renderQuestionSection(lesson.evaluation, { id: 'quiz', locked: true })}

      <section class="result-card" id="result-card" hidden>
        <span class="result-icon">✓</span>
        <div>
          <p class="eyebrow">Validation locale</p>
          <h2>${lesson.result.heading}</h2>
          <p>${lesson.result.body}</p>
          <dl class="result-stats" id="result-stats"></dl>
          <div class="result-actions">
            <button class="secondary-action result-action" data-view="dashboard">Voir mon Terminal</button>
            <button class="secondary-action result-action" data-view="progress">Voir ma Progression</button>
            <button class="text-action result-feedback" data-view="support">Donner mon retour de test</button>
          </div>
        </div>
      </section>

      <div class="lesson-actions">
        <button class="secondary-action" data-view="dashboard">Quitter</button>
        <button class="primary-action" id="mark-understood">Passer à l’exercice <span>→</span></button>
      </div>`;
  }

  function renderLessonOutline(lesson) {
    const c = lesson.content;
    const beats = [
      { step: 'lesson', label: c.concept.heading },
      { step: 'lesson', label: c.example.label },
      { step: 'lesson', label: c.comparison.heading },
      { step: 'exercise', label: lesson.practice.heading },
      { step: 'quiz', label: lesson.evaluation.heading }
    ];
    return `
      <p class="eyebrow">Dans cette leçon</p>
      <ol id="lesson-outline-list">${beats.map(beat => `<li data-outline-step="${beat.step}">${beat.label}</li>`).join('')}</ol>
      <div class="saved-state" id="saved-state">Progression non enregistrée — prototype</div>`;
  }

  window.DDALessonRenderer = Object.freeze({ renderLessonMain, renderLessonOutline });
})();
