'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'dist', 'dda-core.js'), 'utf8');
const academy = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');

// New learners must start from real evidence, never from a presentation fallback.
assert.match(app, /const xp = DDALearning\.totalXp\(DDA\.curriculum, prototypeState\);/, 'Dashboard XP must come from the curriculum engine only');
assert.doesNotMatch(app, /totalXp\(DDA\.curriculum, prototypeState\) \|\| 20/, 'Dashboard must not fabricate +20 XP');
assert.match(academy, /id="week-xp">0 XP/, 'Dashboard shell must start at zero XP');
assert.match(academy, /XP total/, 'Dashboard XP label must not claim a weekly window');

// Activity is a strict seven-day learning signal, not raw page/view traffic.
assert.match(app, /const LEARNING_ACTIVITY_EVENTS = new Set\(/, 'learning activity event allowlist must be explicit');
assert.match(app, /'lesson_understood'.*'exercise_complete'.*'quiz_complete'/s, 'activity must include real lesson milestones');
assert.match(app, /'practice_attempted'/, 'Practice validation must count as a learning action');
assert.match(app, /const windowStart = now - \(7 \* 24 \* 60 \* 60 \* 1000\)/, 'activity must use a strict rolling seven-day window');
assert.match(app, /LEARNING_ACTIVITY_EVENTS\.has\(event\.name\)/, 'view_opened events must be excluded from activity');
assert.match(academy, /Activité \(7 j\)/, 'Dashboard must disclose the seven-day activity window');
assert.match(academy, /Jours actifs \(7 j\)/g, 'Progression and Profil must disclose the same window');

// The new action is centrally allowlisted and metadata remains sanitized.
assert.match(core, /'practice_attempted'/, 'Practice event must be accepted by the core event allowlist');
assert.match(core, /'practice'.*'status'/, 'Practice metadata must pass through the core sanitizer');
assert.match(app, /trackEvent\('practice_attempted', \{ practice: 'm02-zone-identification', status \}\)/, 'Practice action must be recorded after validation');

console.log('RESULT: Dashboard XP and activity metrics contract passed');
