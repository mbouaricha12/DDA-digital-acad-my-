'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const academy = fs.readFileSync('dist/academy.html', 'utf8');
const app = fs.readFileSync('dist/app.js', 'utf8');
const styles = fs.readFileSync('dist/styles.css', 'utf8');

assert.match(academy, /id="analysis-terminal-title">Observer avant de décider\./, 'le Terminal conserve sa promesse pédagogique');
assert.match(academy, /Un espace pédagogique pour manipuler une série historique contrôlée, annoter ton observation et la relier à ton Journal\./, 'le Terminal ne présente plus son fonctionnement comme un prototype technique');
assert.match(academy, /id="profile-sync-status"[^>]*role="status"/, 'le Profil expose un statut de synchronisation accessible');
assert.match(academy, /Mode appareil · non synchronisé/, 'le mode appareil est explicite avant connexion');
assert.match(app, /function renderProfileSyncStatus\(\)/, 'le statut de synchronisation est rendu dynamiquement');
assert.match(app, /Compte DDA connecté · profil et leçons synchronisables/, 'le statut connecté reste limité à ce qui est réellement synchronisable');
assert.match(app, /Compte DDA · connexion indisponible/, 'la perte de connexion possède un état distinct');
assert.match(app, /Mode appareil · non synchronisé/, 'le mode local ne peut pas être confondu avec un compte synchronisé');
assert.match(app, /window\.addEventListener\('online', updateNetworkState\)/, 'le statut est réévalué au retour réseau');
assert.match(styles, /\.profile-sync-status\[data-state="connected"\]/, 'le statut connecté possède un traitement visuel dédié');
assert.match(styles, /\.profile-sync-status\[data-state="offline"\]/, 'le statut hors connexion possède un traitement visuel dédié');
assert.match(styles, /\.profile-sync-status\[data-state="device"\]/, 'le statut appareil possède un traitement visuel dédié');
console.log('RESULT: Tranche 0 trust and orientation contract passed');
