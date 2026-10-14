'use strict';
const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const publicJs = fs.readFileSync('dist/public.js', 'utf8');
const css = fs.readFileSync('dist/alpha-polish.css', 'utf8');

for (const key of ['about', 'risks', 'contact', 'faq', 'accessibility']) {
  assert(html.includes(`data-public-doc="${key}"`), `Le footer doit exposer le document public ${key}`);
  assert(publicJs.includes(`${key}: {`), `Le contenu public ${key} doit être défini dans le runtime`);
}
assert(html.includes('id="public-info-dialog"'), 'La surface d’information publique doit disposer d’une vraie modale accessible');
assert(html.includes('id="public-info-dialog-content"'), 'La modale publique doit disposer d’une zone de contenu');
assert(publicJs.includes('publicInfoDialog.showModal'), 'La modale publique doit utiliser showModal quand disponible');
assert(publicJs.includes("publicInfoDialog?.addEventListener('click'"), 'La modale publique doit pouvoir être fermée depuis son backdrop');
assert(publicJs.includes("event.key === 'Escape' && publicInfoDialog?.open"), 'La modale publique doit être fermable au clavier');
assert(publicJs.includes('dariusdigitalacademy@gmail.com'), 'Le contact doit utiliser l’adresse officielle fournie par DDA');
assert(publicJs.includes('Aucun rendement'), 'Les risques financiers doivent être explicitement documentés');
assert(publicJs.includes('Dernière mise à jour'), 'Les documents légaux doivent afficher une date de mise à jour');
assert(publicJs.includes('préfère') || publicJs.includes('prefers-reduced-motion'), 'Les limites d’accessibilité doivent être documentées');
assert(!/contact@|support@|hello@|info@/i.test(publicJs), 'Aucune adresse e-mail fictive ne doit être inventée');
assert(publicJs.includes('dariusdigitalacademy@gmail.com'), 'L’adresse officielle DDA doit être publiée dans les surfaces de contact');
assert(publicJs.includes('https://t.me/+Wny_VS9f-blmOWFk'), 'Le canal Telegram officiel doit être publié');
assert(publicJs.includes('https://whatsapp.com/channel/0029VbCISPsI1rcb3sbxiI0A'), 'La chaîne WhatsApp officielle doit être publiée');
assert(publicJs.includes('Que comprend DDA Free ?') && publicJs.includes('DDA Free est-il vraiment gratuit ?'), 'La FAQ doit expliquer l’offre Free et l’absence de paiement actuel');
assert(publicJs.includes('Comment obtenir de l’aide ?'), 'La FAQ doit expliquer les canaux de support');
assert(html.includes('mailto:dariusdigitalacademy@gmail.com') && html.includes('Canal Telegram') && html.includes('Chaîne WhatsApp'), 'Le footer doit exposer les canaux de contact officiels');
assert(css.includes('.public-info-content'), 'Les documents publics doivent disposer d’un style dédié');
console.log('RESULT: Public information and legal depth contract passed');
