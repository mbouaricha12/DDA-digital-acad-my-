'use strict';
/*
 * feat/academy-sidebar-structure-premium-card — contract for the founder's
 * reference maquettes: the restructured Academy sidebar (Accueil /
 * collapsible Academy section with its 4 sub-items / DDA Lab / DDA AI /
 * Ressources / Communauté / Marchés / Mes progrès / Profil), the
 * bottom-of-sidebar "DDA Premium" card, and the public landing header's
 * relabeled navigation (Accueil/Apprendre/Parcours/Formations/Ressources/
 * Market Intelligence/Communauté).
 *
 * Updated 2026-11-14 for the founder's full product maquette set (Lot 1 —
 * navigation): Accueil (was "Mon Espace"), Ressources and Profil promoted
 * to top-level items, Marchés/Mes progrès relabeled — every change is a
 * label/position change onto the exact same real destinations, never a
 * new or fabricated route.
 *
 * Every mockup label here is wired to a real, already-built destination —
 * this file checks that wiring stays real, not just that the label text
 * matches the maquette.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const academyHtml = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');
const coreJs = fs.readFileSync(path.join(root, 'dist', 'dda-core.js'), 'utf8');

// ---------------------------------------------------------------------
// Desktop sidebar + mobile drawer: both rails get the SAME restructure —
// a coordinator requirement (parity, not a desktop-only pass).
// ---------------------------------------------------------------------
const sidebarMatch = academyHtml.match(/<aside class="sidebar"[\s\S]*?<\/aside>/);
const drawerMatch = academyHtml.match(/<nav class="mobile-drawer"[\s\S]*?<\/nav>/);
assert.ok(sidebarMatch, 'the desktop sidebar markup is present');
assert.ok(drawerMatch, 'the mobile drawer markup is present');
const sidebar = sidebarMatch[0];
const drawer = drawerMatch[0];

for (const [label, rail] of [['desktop sidebar', sidebar], ['mobile drawer', drawer]]) {
  assert.match(rail, /data-view="dashboard">[\s\S]*?Accueil/, `${label}: "Accueil" opens the real dashboard view`);
  assert.match(rail, /nav-section-toggle[\s\S]*?Academy/, `${label}: the Academy section header is present`);
  assert.match(rail, /aria-expanded="true"/, `${label}: the Academy section is expanded by default, matching the maquette`);

  // The 4 real sub-items, each routed to its real, already-built destination.
  // Ressources moved out to a top-level item below (founder's full product
  // maquette set, 2026-11-14) — it is no longer nested under Academy.
  assert.match(rail, /data-view="path">[\s\S]*?Mes Parcours/, `${label}: Mes Parcours routes to the real ordered curriculum (path view)`);
  assert.match(rail, /data-view="lesson">[\s\S]*?Mes Leçons/, `${label}: Mes Leçons routes to the real current/continue lesson`);
  assert.match(rail, /data-scroll-to="lesson-panel-exercise"[\s\S]*?Exercices/, `${label}: Exercices & Quiz deep-links into the lesson's real Exercice/Quiz tab`);
  assert.match(rail, /data-view="progress" data-scroll-to="certificate-panel"[\s\S]*?Certificats/, `${label}: Certificats routes to the real certification-preview panel inside Progression — DDA has no standalone Certificats page, so this is an honest deep link, not a fabricated route`);

  // Standalone items (unchanged real destinations, just relocated/relabeled
  // per the maquette).
  assert.match(rail, /data-view="lab">[\s\S]*?DDA Lab/, `${label}: DDA Lab stays reachable`);
  assert.match(rail, /data-view="intelligence">[\s\S]*?DDA AI<span class="nav-status-tag">Beta/, `${label}: DDA AI keeps its real Beta badge`);
  assert.match(rail, /data-view="resources">[\s\S]*?Ressources/, `${label}: Ressources is now a direct top-level nav entry to the real resources view`);
  assert.match(rail, /data-view="journal">[\s\S]*?Journal de trading/, `${label}: Journal de trading stays reachable`);
  assert.match(rail, /data-view="progress">[\s\S]*?Mes progrès/, `${label}: Progression is relabeled "Mes progrès" per the founder's full product maquette set, routing stays unchanged`);
  assert.match(rail, /data-view="community">[\s\S]*?Communauté/, `${label}: Communauté is a direct nav entry to the real (honest "coming soon") community view, not just a buried future-label link`);
  assert.match(rail, /data-view="profile">[\s\S]*?Profil/, `${label}: Profil is now a direct top-level nav entry, no longer confined to the "Compte" section`);

  // Real, non-mockup functionality (Terminal, BRVM, Broker Hub, Premium
  // demo tools) must never be deleted by this restructure.
  assert.match(rail, /data-scroll-to="analysis-terminal"/, `${label}: the Darius Analysis Terminal shortcut survives the restructure`);
  assert.match(rail, /data-view="markets">[\s\S]*?Marchés/, `${label}: Marchés & BRVM survives the restructure (relabeled "Marchés" per the founder's maquette, same real view)`);
  assert.match(rail, /data-view="brokers">[\s\S]*?Broker Hub/, `${label}: Broker Hub survives the restructure`);
  assert.match(rail, /data-view="practice">[\s\S]*?Pratique avancée/, `${label}: Pratique avancée survives the restructure`);

  // The bottom-of-sidebar "DDA Premium" card (maquette: gold card, crown,
  // real copy, real CTA to the already-built honest Premium preview).
  assert.match(rail, /class="sidebar-premium-card"/, `${label}: the DDA Premium card is present`);
  assert.match(rail, /sidebar-premium-card[\s\S]*?DDA Premium[\s\S]*?data-view="membership">Découvrir Premium/, `${label}: the Premium card's CTA opens the real membership/preview view, never a fake checkout`);
}

// ---------------------------------------------------------------------
// The Premium card's copy must describe things that are REALLY true in the
// product today (per the mission's honesty mandate) — check against the
// real entitlement set and the real DDA Lab / P2 views it references.
// ---------------------------------------------------------------------
assert.match(coreJs, /premium_track/, 'premium_track is a real entitlement');
assert.match(academyHtml, /<section class="view premium-view" id="lesson-lab4"/, 'the Lab "livrable" (LAB4) premium-gated lesson really exists');
assert.match(academyHtml, /<section class="view premium-view" id="lesson-lab-capstone"/, 'the Lab "projet final" (Capstone) premium-gated lesson really exists');
assert.match(academyHtml, /Revue hebdomadaire guidée/, 'the weekly review referenced by the Premium card copy really exists in the Journal view');
assert.match(academyHtml, /Le risque avant l.entrée|L.anatomie d.un trade contrôlé/, 'the "leçons Premium" referenced by the Premium card copy really exist (P2.1/P2.2)');

// ---------------------------------------------------------------------
// Dynamic routing: Mes Leçons / Exercices & Quiz follow the real
// current-lesson target, not a hardcoded M0.1 — same engine the existing
// "Cours en cours" shortcut already used, now kept in sync across BOTH rails.
// ---------------------------------------------------------------------
assert.match(app, /function renderNavCurrentLesson\(continueTarget\)/, 'Mes Leçons keeps following the real continue-target resolver');
assert.match(app, /function renderNavCurrentExercise\(continueTarget\)/, 'Exercices & Quiz is driven by its own real resolver');
assert.match(app, /\['nav-current-lesson', 'drawer-current-lesson'\]/, 'Mes Leçons is kept in sync on both the desktop sidebar and the mobile drawer');
assert.match(app, /\['nav-current-exercise', 'drawer-current-exercise'\]/, 'Exercices & Quiz is kept in sync on both the desktop sidebar and the mobile drawer');
assert.match(app, /renderNavCurrentLesson\(continueTarget\);\s*\n\s*renderNavCurrentExercise\(continueTarget\);/, 'both resolvers run together on every state refresh');

// ---------------------------------------------------------------------
// Collapsible Academy section: real toggle wiring, not a dead chevron.
// ---------------------------------------------------------------------
assert.match(app, /\['nav-academy', 'drawer-academy'\]\.forEach/, 'the Academy section toggle is wired on both rails');

// ---------------------------------------------------------------------
// Public landing header (index.html): founder-confirmed relabeling —
// Accueil/Apprendre/Parcours/Formations/Ressources/Market Intelligence/
// Communauté — each pointed at the closest REAL section, never a blank page.
// ---------------------------------------------------------------------
const headerNavMatch = indexHtml.match(/<nav class="public-header-nav"[^>]*>[\s\S]*?<\/nav>/);
assert.ok(headerNavMatch, 'the public header nav is present');
const headerNav = headerNavMatch[0];
const expectedPublicLabels = [
  ['Accueil', '#landing'],
  ['Apprendre', '#landing-experience'],
  ['Parcours', '#landing-product'],
  ['Formations', '#landing-free'],
  ['Ressources', '#landing-faq'],
  ['Market Intelligence', '#landing-markets'],
  ['Communauté', 'community/'],
];
for (const [label, href] of expectedPublicLabels) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(headerNav, new RegExp(`href="${escapedHref}"[^>]*>${label}<`), `public nav: "${label}" links to its real destination (${href})`);
}
// Every anchor target must actually exist as a real section on the landing
// page (never a dangling link to a section that was renamed/removed).
for (const anchor of ['landing', 'landing-experience', 'landing-product', 'landing-free', 'landing-faq', 'landing-markets']) {
  assert.match(indexHtml, new RegExp(`id="${anchor}"`), `landing exposes a real id="${anchor}" target for the public nav`);
}
// Communauté is a real, separately-served public page (not a 404 placeholder).
assert.ok(fs.existsSync(path.join(root, 'dist', 'community', 'index.html')), 'dist/community/ is a real, already-built public page');

// The mobile "Menu" panel must mirror the same 7 relabeled links (mobile
// parity — the same coordinator requirement as the Academy sidebar above).
const mobileMenuMatch = indexHtml.match(/<div class="public-menu-panel"[^>]*>[\s\S]*?<\/div>/);
assert.ok(mobileMenuMatch, 'the public mobile menu panel is present');
const mobileMenu = mobileMenuMatch[0];
// The mobile menu panel never repeats "Accueil" (closing the menu already
// shows the landing top, and the header logo itself is the Home link) — a
// pre-existing pattern this restructure does not change.
for (const [label, href] of expectedPublicLabels.filter(([l]) => l !== 'Accueil')) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(mobileMenu, new RegExp(`href="${escapedHref}"[^>]*>${label}<`), `mobile menu: "${label}" links to its real destination (${href}), matching the desktop header`);
}

// The public nav must still never expose a protected app route directly
// (same boundary test_landing_structure_contract.js already enforces for
// the previous label set — re-asserted here for the new one).
assert.doesNotMatch(`${headerNav}${mobileMenu}`, /data-view="(dashboard|path|progress|journal|resources|markets|community|intelligence|profile|membership)"/, 'public nav must not expose protected app routes or a direct membership shortcut');

// ---------------------------------------------------------------------
// CSS: the new nav section/premium-card styling exists and is defined
// outside any desktop-only media query, so it also renders inside the
// always-in-DOM mobile drawer (coordinator's mobile-parity requirement).
// ---------------------------------------------------------------------
assert.match(styles, /\.nav-section-toggle\{/, 'the Academy section toggle has real styling');
assert.match(styles, /\.nav-group\{/, 'the Academy sub-item group has real styling');
assert.match(styles, /\.nav-group\[hidden\]\{display:none\}/, 'collapsing the Academy section actually hides its sub-items');
assert.match(styles, /\.sidebar-premium-card\{/, 'the Premium card has real styling');
assert.match(styles, /\.sidebar-premium-card \.secondary-action\{/, 'the Premium card CTA keeps a tappable size, not the full-width default button');

console.log('RESULT: Academy sidebar structure / DDA Premium card / public nav relabel contract passed');
