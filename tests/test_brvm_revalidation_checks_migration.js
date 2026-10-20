'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/0006_brvm_revalidation_checks.sql'), 'utf8');

assert.match(sql, /create table if not exists public\.dda_brvm_revalidation_checks/);
assert.match(sql, /references public\.dda_brvm_documents\(document_id\)/);
assert.match(sql, /outcome text not null/);
assert.match(sql, /outcome in \('current', 'stale', 'error', 'skipped'\)/);
assert.match(sql, /http_status between 100 and 599/);
assert.match(sql, /final_url ~ '\^https:\/\/\[\^\[:space:\]\]\+\$'/);
assert.match(sql, /observed_checksum_sha256.*\^\[0-9a-f\]\{64\}\$/s);
assert.match(sql, /error_code.*\^\[A-Z\]\[A-Z0-9_\]\{1,79\}\$/s);
assert.match(sql, /outcome <> 'current'/);
assert.match(sql, /http_status is not null/);
assert.match(sql, /alter table public\.dda_brvm_revalidation_checks enable row level security/);
assert.match(sql, /create policy dda_brvm_revalidation_checks_no_browser_access/);
assert.match(sql, /using \(false\)/);
assert.match(sql, /with check \(false\)/);
assert.match(sql, /revoke all on table public\.dda_brvm_revalidation_checks from service_role/);
assert.match(sql, /dda_brvm_revalidation_document_idx/);
assert.match(sql, /dda_brvm_revalidation_job_run_idx/);
assert.doesNotMatch(sql, /check \([^\n]*now\(\)/, 'check constraints must not depend on a non-immutable clock expression');
console.log('BRVM revalidation checks migration contract: PASS');
