'use strict';

// Decision (31/10/2026): DDA is built as an institution independent of its
// founder's person. No personal bio, photo or social link on the landing —
// the "Qui est derrière DDA ?" idea is replaced by an institutional block
// (vision / mission / pedagogy / learner commitments / ambition for
// Francophone Africa). This mirrors the guardrail already enforced on
// /commencer/ (tests/test_commencer_route_contract.js) but for the main
// landing itself, where a founder LinkedIn link had been added (PR #163)
// before this decision superseded it.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const landing = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');

assert.doesNotMatch(landing, /linkedin\.com/i, 'the landing must never link to a personal social profile');
assert.doesNotMatch(landing, /fondateur|founder|biographie/i, 'the landing must never present founder content — DDA is an institution, not a person');
assert.doesNotMatch(landing, /richard[\s-]?darius/i, 'the landing must never name the founder personally');

const missionSection = landing.match(/<section class="landing-mission"[\s\S]*?<\/section>/)?.[0];
assert.ok(missionSection, 'the landing must expose an institutional block replacing the founder idea');
assert.match(missionSection, /id="landing-mission"/, 'the institutional block must be anchorable');
assert.equal((missionSection.match(/<article>/g) || []).length, 5, 'the institutional block must cover exactly the 5 agreed pillars: vision, mission, pedagogy, learner commitments, ambition');
for (const pillar of ['Vision', 'Mission', 'Approche pédagogique', 'Engagements envers les apprenants', 'Ambition']) {
  assert.ok(missionSection.includes(`<span>${pillar}</span>`), `institutional block must cover the "${pillar}" pillar`);
}

console.log('RESULT: Landing never presents founder content; institutional block in place');
