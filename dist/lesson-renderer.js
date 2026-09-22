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

  // Hand-authored synthetic pedagogical price geometry — never real market data.
  // Every chart_observe/zone_identify block renders through here and always
  // carries an explicit "no real data" caption (see those renderers below).
  function renderPriceChart(chart, options) {
    const opts = options || {};
    const path = chart.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    const dots = (chart.reactions || []).map(r => `<circle class="reaction-dot" cx="${r.x}" cy="${r.y}" r="4"/>`).join('');
    // The reaction zone always exists in the markup but starts visually hidden by CSS
    // (scoped per block type below) — a zone_identify block reveals it only once the
    // learner has answered; a chart_observe block never reveals it at all (observation
    // must come before the answer, never after it). The flawed annotation is the
    // opposite: it is the thing chart_observe shows immediately, on purpose.
    const zoneRect = chart.zone ? `<rect class="reaction-zone" x="6" y="${chart.zone.y}" width="288" height="${chart.zone.height}" rx="6"/>` : '';
    const flawRect = opts.showFlaw && chart.flawReaction ? `<rect class="reaction-zone flawed" x="${chart.flawReaction.x - 22}" y="${chart.flawReaction.y - 12}" width="44" height="24" rx="6"/>` : '';
    return `
      <svg class="price-chart" viewBox="0 0 300 160" role="img" aria-label="${chart.ariaLabel || 'Graphique pédagogique synthétique.'}">
        ${zoneRect}${flawRect}
        <path class="price-line" d="${path}"/>
        ${dots}
      </svg>`;
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
      const visual = block.src
        ? `<div class="photo-frame ${block.tone || 'dark'} ratio-wide"><img src="${block.src}" alt="${block.alt || ''}" loading="lazy"></div>`
        : `<div class="photo-frame ${block.tone || 'dark'} ratio-wide"><svg class="icon"><use href="#icon-photo"/></svg><span>${block.placeholderLabel || 'Illustration à intégrer'}</span></div>`;
      return `
      <figure class="image-explainer-block" id="${block.id}-block">
        ${visual}
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

    // Structural-preview mode (plain string options, no grading) is unchanged —
    // test_dda_v18.js exercises exactly that. Passing option OBJECTS instead
    // ({text, correct, feedback}) additively turns this into a real graded
    // reasoning check, reusing the same [data-question]/data-correct contract
    // as `quiz`, so app.js's existing bindQuestion binds it with no new code.
    decision_choice(block) {
      const graded = Array.isArray(block.options) && block.options.length > 0 && typeof block.options[0] === 'object';
      const options = graded ? block.options : (block.options || []).map(text => ({ text }));
      return `
      <section class="decision-choice-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Choix de décision'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p>${block.prompt}</p>` : ''}
        <div class="decision-choice-options"${graded ? ` data-question="${block.id}"` : ''}>${options.map(opt => `<button type="button" class="decision-option" data-correct="${opt.correct === true}"${opt.feedback ? ` data-feedback="${opt.feedback}"` : ''}>${opt.text}</button>`).join('')}</div>
        ${graded ? `<p class="feedback" id="${block.id}-feedback" aria-live="polite"></p>` : ''}
        ${block.note ? `<p class="decision-note">${block.note}</p>` : ''}
      </section>`;
    },

    // Passive observation — a synthetic pedagogical chart plus minimal text, never
    // an answer. Reactions are visible; the reaction zone stays hidden (CSS-scoped
    // to .chart-observe-block) so a following zone_identify block on the same
    // chart is a genuine, unspoiled identification exercise. A flawed annotation
    // (Phase F: "spot the error") is the one thing this block shows immediately.
    chart_observe(block) {
      return `
      <section class="chart-observe-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Observer'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p class="chart-prompt">${block.prompt}</p>` : ''}
        <div class="chart-frame">${renderPriceChart(block.chart, { showFlaw: Boolean(block.flaw) })}</div>
        <p class="chart-caption">Graphique pédagogique synthétique — aucune donnée de marché réelle.</p>
      </section>`;
    },

    // "Touch the zone" — tappable bands laid over the same synthetic chart, reusing
    // the exact [data-question]/data-correct/data-feedback contract `quiz` uses, so
    // app.js's existing bindQuestion binds it with zero new interaction code. Real
    // buttons (not SVG hit-areas) so the interaction works by keyboard too, with no
    // pixel-precision required. `reveal` (optional) is extra explanatory text shown
    // once the learner has answered, alongside the CSS-driven zone reveal.
    zone_identify(block) {
      const zones = block.zones || [];
      return `
      <section class="zone-identify-block" id="${block.id}-block">
        <p class="eyebrow gold">${block.eyebrow || 'Identifier'}</p>
        <h2>${block.heading}</h2>
        ${block.prompt ? `<p class="chart-prompt">${block.prompt}</p>` : ''}
        <div class="chart-zone-picker">
          <div class="chart-frame">${renderPriceChart(block.chart)}</div>
          <div class="zone-band-options" data-question="${block.id}" role="group" aria-label="Zones proposées">
            ${zones.map(z => `<button type="button" class="zone-band" data-correct="${z.correct === true}"${z.feedback ? ` data-feedback="${z.feedback}"` : ''}><span>${z.label}</span></button>`).join('')}
          </div>
        </div>
        <p class="feedback" id="${block.id}-feedback" aria-live="polite"></p>
        ${block.reveal ? `<div class="zone-reveal" id="${block.id}-reveal" hidden><svg class="icon"><use href="#icon-check-circle"/></svg><p>${block.reveal}</p></div>` : ''}
        <p class="chart-caption">Graphique pédagogique synthétique — aucune donnée de marché réelle.</p>
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

    // block.idSuffix (optional) keeps a second lesson's result card from colliding
    // with id="result-card" — omitted, it renders byte-for-byte what M0.1 always has.
    summary(block) {
      const r = block.data;
      const suffix = block.idSuffix ? `-${block.idSuffix}` : '';
      return `
      <section class="result-card" id="result-card${suffix}" hidden>
        <span class="result-icon">✓</span>
        <div>
          <p class="eyebrow">Validation locale</p>
          <h2>${r.heading}</h2>
          <p>${r.body}</p>
          <dl class="result-stats" id="result-stats${suffix}"></dl>
          <div class="result-actions">
            ${block.continueTo ? `<button class="primary-action result-action" data-view="${block.continueTo.view}">${block.continueTo.label} <span>→</span></button>` : ''}
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
    const markup = renderer(block);
    // Lesson Experience V2: every authored beat gets one visual rhythm hook.
    // Content/state remain owned by the existing block renderer; this wrapper
    // only gives CSS a stable semantic surface so lessons stop looking like a
    // long stack of unrelated cards.
    const quiet = block.type === 'competency_check' || block.type === 'summary';
    return `<div class="lesson-beat lesson-beat-${block.type}${quiet ? ' lesson-beat-quiet' : ''}" data-lesson-step="${block.step || 'lesson'}" data-block-type="${block.type}">${markup}</div>`;
  }

  // idSuffix (optional) lets a second lesson mount alongside M0.1 without id
  // collisions (#lesson-title, #lesson-loop, #mark-understood). Omitted, this
  // renders the exact same ids M0.1 has always used — zero behavior change.
  function renderLessonMain(module, lesson, idSuffix) {
    const suffix = idSuffix ? `-${idSuffix}` : '';
    const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id) + 1;
    return `
      <p class="eyebrow gold">${module.title} · Leçon ${lessonIndex}</p>
      <h1 id="lesson-title${suffix}">${lesson.title}</h1>
      <p class="lesson-lead">${lesson.content.lead}</p>
      <ol class="lesson-loop" id="lesson-loop${suffix}" aria-label="Progression dans la leçon">${lesson.steps.map(s => `<li data-step="${s.id}"><i class="loop-bead"></i><span>${s.label}</span></li>`).join('')}</ol>

      ${lesson.blocks.map(renderBlock).join('\n')}

      <div class="lesson-actions">
        <button class="secondary-action" data-view="back">Quitter</button>
        <button class="primary-action" id="mark-understood${suffix}">${lesson.markUnderstoodLabel || 'Passer à l’exercice'} <span>→</span></button>
      </div>`;
  }

  function renderLessonOutline(lesson, idSuffix) {
    const suffix = idSuffix ? `-${idSuffix}` : '';
    const beats = lesson.blocks.filter(block => block.outline);
    return `
      <p class="eyebrow">Dans cette leçon</p>
      <ol id="lesson-outline-list${suffix}">${beats.map(beat => `<li data-outline-step="${beat.step}">${beat.outline}</li>`).join('')}</ol>
      <div class="saved-state" id="saved-state${suffix}">Progression enregistrée sur cet appareil — jamais envoyée à un serveur</div>`;
  }

  window.DDALessonRenderer = Object.freeze({ renderLessonMain, renderLessonOutline, renderBlock, BLOCK_RENDERERS });
})();
