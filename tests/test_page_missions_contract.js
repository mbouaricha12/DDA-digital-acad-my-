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
  community: 'Comprendre les futurs espaces d’échange, sans faux flux.',
  practice: 'Prolonger une compétence déjà observée.',
  intelligence: 'Recevoir un jour une aide qui explique, jamais qui décide.',
  profile: 'Ajuster ton environnement, pas refaire ton parcours.'
};

for (const [view, mission] of Object.entries(missions)) {
  const start = html.indexOf(`id="${view}"`);
  assert.ok(start >= 0, `${view} route remains mounted`);
  const end = html.indexOf('</section>', start);
  const chunk = html.slice(start, end < 0 ? html.length : end);
  assert.match(chunk, new RegExp(`data-mission="${view}"`), `${view} declares its page mission`);
  assert.ok(chunk.includes(mission), `${view} mission remains specific and readable`);
}

assert.match(html, /data-view="dashboard" data-scroll-to="analysis-terminal"[^>]*>Manipuler une série pédagogique/, 'Market Intelligence hands off to the Terminal, not back to itself');
assert.match(html, /<strong>Terminal d’observation<\/strong><small>Manipuler une série pédagogique, sans signal/, 'community market link points to the distinct observation mission');
assert.doesNotMatch(html, /<button data-view="access">Marchés financiers<\/button>/, 'footer does not send Markets back to generic Access');
console.log('RESULT: page mission architecture contract passed');
