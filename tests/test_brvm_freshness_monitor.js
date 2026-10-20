'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isHttpsUrl, validPublication } = require('../bff/jobs/monitor-brvm-freshness');

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/brvm-freshness-daily.yml'), 'utf8');
const now = Date.parse('2026-10-20T12:00:00.000Z');
const publication = {
  id: 'doc-1',
  title: 'Publication contrôlée',
  source: 'Source institutionnelle',
  sourceUrl: 'https://source.example/publication',
  documentUrl: 'https://source.example/publication.pdf',
  referenceDate: '2026-10-01',
  retrievedAt: '2026-10-02T12:00:00.000Z',
  freshUntil: '2026-11-01T12:00:00.000Z',
  verificationStatus: 'verified',
  freshnessStatus: 'current',
  redistributionRights: 'authorized'
};

assert.equal(isHttpsUrl('https://source.example/file.pdf'), true);
assert.equal(isHttpsUrl('http://source.example/file.pdf'), false);
assert.equal(isHttpsUrl('https://user:pass@source.example/file.pdf'), false);
assert.equal(validPublication(publication, now), true);
assert.equal(validPublication({ ...publication, freshUntil: '2026-10-19T12:00:00.000Z' }, now), false);
assert.equal(validPublication({ ...publication, verificationStatus: 'pending' }, now), false);
assert.equal(validPublication({ ...publication, documentUrl: 'http://source.example/file.pdf' }, now), false);
assert.match(workflow, /cron: '17 3 \* \* \*'/, 'daily UTC schedule is configured');
assert.match(workflow, /concurrency:/, 'overlapping runs are prevented');
assert.match(workflow, /upload-artifact@v4/, 'structured logs are retained');
assert.match(workflow, /BRVM_REVALIDATION_ENABLED/, 'activation is explicit');
console.log('BRVM daily freshness monitor contract: PASS');
