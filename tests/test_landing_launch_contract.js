const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('dist/index.html', 'utf8');
const publicJs = fs.readFileSync('dist/public.js', 'utf8');
const css = fs.readFileSync('dist/alpha-polish.css', 'utf8');

assert(html.includes('href="#landing" data-view="landing"'), 'Le logo doit rester un retour interne vers la landing');
assert(html.includes('class="public-menu"'), 'Le menu mobile public doit exister');
assert(html.includes('class="legal-dialog" id="legal-dialog"'), 'La modale légale doit exister dans le shell public');
for (const key of ['terms', 'privacy', 'cookies', 'imprint']) {
  assert(html.includes(`data-legal="${key}"`), `Le document légal ${key} doit être accessible depuis le footer`);
  assert(publicJs.includes(`${key}: {`), `Le contenu légal ${key} doit être défini dans le runtime public`);
}
assert(publicJs.includes("a[href^=\"#landing\"]"), 'Les ancres publiques doivent être interceptées sans navigation externe');
assert(publicJs.includes('scrollIntoView'), 'Les ancres doivent utiliser le défilement fluide');
assert(publicJs.includes("removeAttribute('open')"), 'Le menu mobile doit se fermer après une rubrique');
assert(publicJs.includes('legalDialog.showModal'), 'Les documents légaux doivent s’ouvrir dans une vraie modale');
assert(css.includes('background:#07111f!important'), 'Le menu mobile doit rester opaque');
assert(css.includes('.legal-dialog::backdrop'), 'La modale légale doit avoir un backdrop accessible');
assert(!html.includes('Conditions — bientôt') && !html.includes('Cookies — bientôt'), 'Le footer ne doit plus afficher de mentions légales provisoires');

console.log('RESULT: Landing launch, legal surface and mobile navigation contract passed');
