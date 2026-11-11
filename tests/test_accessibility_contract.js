const fs = require('fs');
const assert = require('assert');

const academy = fs.readFileSync('dist/academy.html', 'utf8');
const renderer = fs.readFileSync('dist/lesson-renderer.js', 'utf8');
const app = fs.readFileSync('dist/app.js', 'utf8');
const polish = fs.readFileSync('dist/alpha-polish.css', 'utf8');
const styles = fs.readFileSync('dist/styles.css', 'utf8');

const outlineCount = (academy.match(/class="lesson-outline"[^>]*tabindex="0"[^>]*role="region"/g) || []).length;
assert.strictEqual(outlineCount, 14, 'Chaque vue de leçon doit exposer son outline au clavier');
assert(renderer.includes('class="lesson-loop" id="lesson-loop${suffix}" tabindex="0"'), 'Le rail de progression doit être focusable');
assert(renderer.includes('aria-label="Progression dans la leçon — utilise les flèches'), 'Le rail doit expliquer son contrôle clavier');
assert(app.includes("const rail = event.target.closest?.('.lesson-loop, .lesson-outline')"), 'Le pilotage clavier des rails doit rester délégué');
assert(app.includes("event.key === 'Home' || event.key === 'End'"), 'Home/End doivent rester disponibles sur les rails');
assert((renderer.match(/role="status" aria-live="polite" aria-atomic="true"/g) || []).length >= 4, 'Les feedbacks générés doivent être annoncés');
assert(polish.includes('.lesson-loop[tabindex="0"]:focus-visible'), 'Le focus du rail doit rester visible');
assert(polish.includes('#premium-assessment .premium-assessment-form label{color:#cbd5e1}'), 'Le contraste Premium doit rester renforcé');
assert(polish.includes('#access .access-card small{color:#c3cfdb}'), 'Le contraste Access doit rester renforcé');
assert(academy.includes("data-boot-view"), 'Academy doit marquer la vue initiale avant le chargement du runtime');
assert(polish.includes('html[data-boot-view="access"] .dda-public-surface'), 'La surface Access doit être dans le flux avant le boot pour éviter le CLS du footer');
assert(styles.includes('.academy-footer small{max-width:34ch;color:#9aa9ba;'), 'Le texte secondaire du footer doit conserver un contraste lisible');

console.log('RESULT: WCAG keyboard, live-region and contrast contract passed');
