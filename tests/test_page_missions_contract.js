'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');

const missions = {
  dashboard: 'Choisir l’action utile d’aujourd’hui.',
  path: 'Choisir une seule prochaine validation.',
  progress: 'Vérifier les preuves, pas collectionner des chiffres.',
  journal: 'Conserver le raisonnement pendant qu’il est encore frais.',
  resources: 'Prendre un outil précis, puis retourner pratiquer.',
  membership: 'Comprendre ce qui est disponible avant de choisir un accès.',
  markets: 'Lire un contexte régional sans le confondre avec un signal.',
  brokers: 'Filtrer selon ton besoin avant toute comparaison.',
  support: 'Résoudre un blocage précis avant de reprendre.',
  community: 'Un fil utile, jamais un flux de bruit.',
  practice: 'Prolonger une compétence déjà observée.',
  intelligence: 'Obtenir une aide qui explique, jamais qui décide.',
  profile: 'Ajuster ton environnement, pas refaire ton parcours.'
};

for (const [view, mission] of Object.entries(missions)) {
  const start = html.indexOf(`id="${view}"`);
  assert.ok(start >= 0, `${view} route remains mounted`);
  const end = html.indexOf('</section>', start);
  const chunk = html.slice(start, end < 0 ? html.length : end);
  if (view === "dashboard") {
    assert.doesNotMatch(chunk, /data-mission="dashboard"/, "dashboard stays free of a redundant mission banner");
    assert.doesNotMatch(chunk, /Choisir l’action utile d’aujourd’hui\./, "dashboard keeps its action-first hierarchy");
  } else {
    const pageHeading = chunk.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    assert.ok(pageHeading, `${view} exposes a clear page heading`);
    assert.ok(pageHeading[1].trim().length > 5, `${view} heading is meaningful`);
    assert.ok(chunk.includes('<p'), `${view} provides explanatory content`);
    if (chunk.includes(`data-mission="${view}"`)) {
      assert.ok(chunk.includes(mission), `${view} mission remains specific and readable`);
    }
  }
}

assert.match(html, /data-view="dashboard" data-scroll-to="analysis-terminal"[^>]*>Manipuler une série pédagogique/, 'Market Intelligence hands off to the Terminal, not back to itself');
assert.match(html, /<strong>Terminal d’observation<\/strong><small>Manipuler une série pédagogique, sans signal/, 'community market link points to the distinct observation mission');
assert.doesNotMatch(html, /<button data-view="access">Marchés financiers<\/button>/, 'footer does not send Markets back to generic Access');
console.log('RESULT: page mission architecture contract passed');
