'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const checker = path.join(__dirname, 'verify_route_register_consistency.js');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-historical-tests-'));
const register = path.join(tempDir, 'register.md');
const manifest = path.join(tempDir, 'historical-tests.json');

try {
  fs.writeFileSync(register, [
    '# Fixture register',
    '`test_dda_v123.js` is a historical test reference.',
    '`test_dda_v999.js` is an unclassified missing test.',
    ''
  ].join('\n'));
  fs.writeFileSync(manifest, JSON.stringify({ archived: ['test_dda_v123.js'] }));

  const run = spawnSync(process.execPath, [checker, '--json', '--register', register, '--historical-tests', manifest], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(run.status, 0, run.stderr || 'consistency checker should succeed for the fixture');
  const result = JSON.parse(run.stdout);
  assert.ok(result.info.some(item => item.code === 'ARCHIVED_TEST_REFERENCE' && item.message.includes('test_dda_v123.js')),
    'an explicitly archived file should produce an informational result');
  assert.ok(!result.warnings.some(item => item.code === 'HISTORICAL_TEST_NOT_PRESENT' && item.message.includes('test_dda_v123.js')),
    'an explicitly archived file should not produce a missing-test warning');
  assert.ok(result.warnings.some(item => item.code === 'HISTORICAL_TEST_NOT_PRESENT' && item.message.includes('test_dda_v999.js')),
    'a newly missing and unclassified file must continue to warn');
  console.log('RESULT: historical test references are classified without masking new missing tests');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
