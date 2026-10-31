'use strict';

// Contract for the landing's FAQ extract and DDA Free / DDA Premium cards
// (DDA — Plan de construction landing, sections 1 et 2, 30/10/2026).
// Verifies: the FAQ answers are copied verbatim from /faq/ (never a second,
// divergent version of the same answer), the offer cards only describe
// already-confirmed product features, and no payment mechanism is exposed.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const faq = fs.readFileSync(path.join(root, 'dist', 'faq', 'index.html'), 'utf8');

// --- FAQ extract ---

const faqSection = index.match(/<section class="landing-faq"[\s\S]*?<\/section>/)?.[0];
assert.ok(faqSection, 'landing must expose a #landing-faq section');
assert.match(faqSection, /id="landing-faq"/, 'FAQ section must be anchorable');

const QUESTIONS = [
  'Qu’est-ce que DDA ?',
  'Que comprend DDA Free ?',
  'DDA Free est-il vraiment gratuit ?',
  'Où est conservée ma progression ?',
  'DDA donne-t-elle des signaux ou des recommandations ?'
].map(q => q.replace(' ', ' ')); // normalize the nbsp used before '?' in French typography

function extractAnswer(html, question) {
  const escaped = question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<h3>${escaped}</h3><p>([\\s\\S]*?)</p>`));
  return match ? match[1] : null;
}
function extractSummaryAnswer(html, question) {
  const escaped = question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<summary>${escaped}</summary><p>([\\s\\S]*?)</p>`));
  return match ? match[1] : null;
}

assert.equal((faqSection.match(/<details>/g) || []).length, 5, 'the homepage extract must show exactly the 5 selected questions, not the full 8');

for (const question of QUESTIONS) {
  const fullAnswer = extractAnswer(faq, question);
  assert.ok(fullAnswer, `/faq/ must still contain the question "${question}" this extract relies on`);
  const extractAnswerText = extractSummaryAnswer(faqSection, question);
  assert.ok(extractAnswerText, `landing FAQ extract must contain the question "${question}"`);
  assert.equal(extractAnswerText, fullAnswer, `the landing's answer to "${question}" must be byte-for-byte identical to /faq/ — never a second, divergent copy`);
}

assert.match(faqSection, /href="faq\/"/, 'the extract must link to the full FAQ page for the remaining questions');

// --- DDA Free / DDA Premium cards ---

const plansBlock = index.match(/<div class="landing-plans plan-rail"[\s\S]*?<\/div>\s*<\/section>/)?.[0] || index.match(/<div class="landing-plans plan-rail"[\s\S]*?<\/div>/)?.[0];
assert.ok(plansBlock, 'landing must expose the DDA Free / DDA Premium plan cards');
assert.equal((plansBlock.match(/class="landing-plan-card/g) || []).length, 2, 'exactly two plan cards — Free and Premium, no invented third tier');

assert.match(plansBlock, /aucun paiement actif/i, 'the Premium card must explicitly say no real payment is active');
assert.doesNotMatch(plansBlock, /<button[^>]*>(?:(?!<\/button>).)*(?:Payer|Souscrire|S'abonner|Acheter)/i, 'the plan cards must never expose a payment action');
assert.doesNotMatch(plansBlock, /chariow/i, 'the landing must never reference the payment provider directly');

// Premium card content must be drawn from already-built, real product features
// (dist/academy.html's #membership panel), not invented marketing copy.
const academy = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
for (const feature of ['Risk Before Entry', 'The Anatomy of a Controlled Trade', 'Risk Plan Lab', 'Controlled Decision']) {
  assert.ok(academy.includes(feature), `"${feature}" must be a real, already-built feature in dist/academy.html for the landing to reference it`);
  assert.ok(plansBlock.includes(feature), `the Premium card must mention the real feature "${feature}"`);
}

console.log('RESULT: Landing FAQ extract and DDA Free/Premium offer cards contract passed');
