'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const landing = fs.readFileSync('dist/index.html', 'utf8');
const academy = fs.readFileSync('dist/academy.html', 'utf8');
const app = fs.readFileSync('dist/app.js', 'utf8');
const styles = fs.readFileSync('dist/styles.css', 'utf8');

assert(!academy.includes('class="prototype-banner"'), 'La bannière de version ne doit plus dominer l’Academy');
assert(academy.includes('id="profile-name">Apprenant'), 'Le shell doit avoir une identité neutre avant onboarding');
assert(academy.includes('id="dashboard-name">Apprenant'), 'Le dashboard ne doit pas afficher un prénom codé en dur');
assert(academy.includes('id="topbar-profile-avatar">A</span>'), 'Le topbar doit afficher l’avatar neutre avant le rendu de l’identité réelle');
assert(!/\bRichard\b/.test(academy), 'Aucun prénom de démonstration ne doit rester dans Academy');
assert(!/\bRichard\b/.test(app), 'Le runtime ne doit pas utiliser un fallback d’identité fictif');
assert(academy.includes('Profil d’apprentissage'), 'Le profil doit être présenté comme une surface produit');
// Commercial preparation / public polish mandate (2026-11-14): "Démonstration
// pédagogique" was removed from Premium's public-facing labels as devaluing
// jargon — the honesty it stood for is still asserted, just in plainer words.
assert(academy.includes('pas un abonnement actif'), 'La limite Premium doit rester honnête sans jargon local');
// Commercial positioning correction (2026-11-14): Premium is a real offer to
// launch, not a future/preview feature — "Aperçu pédagogique" was retired in
// favour of the real price, so Premium is never presented as devalued.
assert(landing.includes('12 000 FCFA/mois'), 'La landing doit afficher le prix réel de Premium, pas une étiquette dévalorisante');
assert(styles.includes('top:var(--banner-h,0px)'), 'Le shell ne doit pas réserver 29px à une bannière absente');
assert(styles.includes('scroll-margin-top:calc(var(--banner-h,0px)'), 'Les ancres doivent utiliser la hauteur réelle du shell');
console.log('RESULT: UX-1 confidence and orientation contract passed');
