'use strict';

const fs = require('node:fs');
const path = require('node:path');

function sqlFiles(root) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...sqlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.sql')) result.push(full);
  }
  return result;
}

function normalizeSql(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function auditSql(sql, source = '<inline>') {
  const normalized = normalizeSql(sql);
  const tables = [...normalized.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(public\.[a-z_][a-z0-9_]*)/g)].map(match => match[1]);
  const findings = [];
  for (const table of [...new Set(tables)]) {
    if (!new RegExp(`alter\\s+table\\s+${table.replace('.', '\\.') }\\s+enable\\s+row\\s+level\\s+security`).test(normalized)) {
      findings.push(`${source}: ${table} is created without ALTER TABLE ... ENABLE ROW LEVEL SECURITY`);
    }
    const policyPattern = new RegExp(`create\\s+policy\\s+[a-z_][a-z0-9_]*\\s+on\\s+${table.replace('.', '\\.')}`);
    if (!policyPattern.test(normalized)) {
      findings.push(`${source}: ${table} is created without a CREATE POLICY bound to the table`);
    }
    if (!new RegExp(`revoke\\s+all\\s+on\\s+table\\s+${table.replace('.', '\\.') }\\s+from\\s+anon`).test(normalized)) {
      findings.push(`${source}: ${table} does not explicitly revoke direct anon privileges`);
    }
  }
  if (/grant\s+all\s+on\s+(?:table\s+)?public\.[a-z_][a-z0-9_]*\s+to\s+anon/.test(normalized)) {
    findings.push(`${source}: broad ALL grant to anon is forbidden`);
  }
  return { source, tables: [...new Set(tables)], findings };
}

function auditPaths(paths) {
  const reports = paths.map(file => auditSql(fs.readFileSync(file, 'utf8'), file));
  // A versioned migration set is cumulative: a table created in 0002 may receive
  // its RLS and policy in 0003. Auditing each file in isolation creates false
  // blockers and does not reflect the schema produced by replaying the sequence.
  const cumulative = auditSql(paths.map(file => fs.readFileSync(file, 'utf8')).join('\n'), paths.join(', '));
  return { reports, tables: cumulative.tables, findings: cumulative.findings };
}

if (require.main === module) {
  const repo = path.resolve(__dirname, '..');
  const roots = [path.join(repo, 'bff', 'supabase'), path.join(repo, 'supabase', 'migrations')];
  const files = roots.flatMap(sqlFiles);
  if (!files.length) {
    console.error('RLS audit failed: no SQL migration/schema files found.');
    process.exit(1);
  }
  const report = auditPaths(files);
  console.log(`RLS static audit: ${report.tables.length} public table declaration(s) inspected`);
  if (report.findings.length) {
    for (const finding of report.findings) console.error(`FAIL: ${finding}`);
    process.exit(1);
  }
  console.log('RLS static audit: PASS');
}

module.exports = { auditSql, auditPaths, normalizeSql };
