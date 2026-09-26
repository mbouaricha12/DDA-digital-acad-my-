'use strict';

/**
 * DDA — Route / Master Register consistency verifier.
 *
 * Purpose:
 *   Validate that the route map, the master build register and the current
 *   runtime do not silently disagree about route existence, route status,
 *   lesson entitlements, sequential gates, or documented governance files.
 *
 * Usage:
 *   node tests/verify_route_register_consistency.js
 *   node tests/verify_route_register_consistency.js --register path/to/register.md --routes path/to/routes.md
 *   node tests/verify_route_register_consistency.js --json
 *
 * Exit code:
 *   0 = no errors (warnings may still be printed)
 *   1 = one or more coherence errors
 *
 * This is intentionally dependency-free and does not mutate the repository.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULTS = {
  register: path.join(ROOT, 'DDA_MASTER_BUILD_REGISTER.md'),
  routes: path.join(ROOT, 'DDA_ROUTE_MAP.md'),
  html: path.join(ROOT, 'dist', 'index.html'),
  app: path.join(ROOT, 'dist', 'app.js'),
  architecture: path.join(ROOT, 'DDA_INFORMATION_ARCHITECTURE_TARGET.md')
};

function parseArgs(argv) {
  const options = { ...DEFAULTS, json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--register') options.register = path.resolve(argv[++i]);
    else if (arg === '--routes') options.routes = path.resolve(argv[++i]);
    else if (arg === '--html') options.html = path.resolve(argv[++i]);
    else if (arg === '--app') options.app = path.resolve(argv[++i]);
    else if (arg === '--architecture') options.architecture = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readRequired(file, label, errors) {
  if (!fs.existsSync(file)) {
    errors.push({ code: 'MISSING_FILE', file, message: `${label} missing: ${file}` });
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function lineNumber(text, needle) {
  const index = text.indexOf(needle);
  return index < 0 ? null : text.slice(0, index).split('\n').length;
}

function parseRouteRows(markdown) {
  const rows = [];
  for (const [index, raw] of markdown.split(/\r?\n/).entries()) {
    const line = raw.trim();
    // Some route ids carry an editorial annotation after the code, for example
    // `landing` (Acquisition V1) or `lesson` (M0.1). The annotation is not
    // part of the route id and must not prevent the row from being parsed.
    const match = line.match(/^\|\s*`([^`]+)`[^|]*\|(.+)\|$/);
    if (!match) continue;
    const cells = match[2].split('|').map(cell => cell.trim());
    if (cells.length < 7) continue;
    rows.push({
      id: match[1],
      inputs: cells[0],
      output: cells[1],
      back: cells[2],
      permission: cells[3],
      deepLink: cells[4],
      anonymous: cells[5],
      registered: cells[6],
      line: index + 1
    });
  }
  return rows;
}

function parseRegisterRows(markdown) {
  const rows = [];
  for (const [index, raw] of markdown.split(/\r?\n/).entries()) {
    const line = raw.trim();
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|$/);
    if (!match || line.includes('---') || line.includes('Domaine')) continue;
    rows.push({
      domain: match[1].trim(),
      element: match[2].trim(),
      status: match[3].trim(),
      evidence: match[4].trim(),
      line: index + 1
    });
  }
  return rows;
}

function check(condition, code, message, errors, warnings = null) {
  if (condition) return true;
  (warnings || errors).push({ code, message });
  return false;
}

function hasAny(text, values) {
  return values.some(value => text.includes(value));
}

function main() {
  const options = parseArgs(process.argv);
  const errors = [];
  const warnings = [];
  const register = readRequired(options.register, 'Master register', errors);
  const routesMarkdown = readRequired(options.routes, 'Route map', errors);
  const html = readRequired(options.html, 'Runtime HTML', errors);
  const app = readRequired(options.app, 'Runtime app', errors);
  const architecture = fs.existsSync(options.architecture);

  if (!register || !routesMarkdown) return report(options, errors, warnings);

  const routes = parseRouteRows(routesMarkdown);
  const registerRows = parseRegisterRows(register);
  const routeIds = new Set(routes.map(route => route.id));

  // Structural route-map checks.
  check(routes.length > 0, 'NO_ROUTE_ROWS', 'No route table rows were found in the route map.', errors);
  check(routeIds.size === routes.length, 'DUPLICATE_ROUTE_ID', 'The route map contains duplicate route ids.', errors);
  for (const route of routes) {
    check(route.permission.length > 0, 'EMPTY_PERMISSION', `${route.id}: permission cell is empty.`, errors);
    check(route.deepLink.includes('✅') || route.deepLink.toLowerCase().includes('fiable'), 'UNVERIFIED_DEEPLINK', `${route.id}: deep-link/reload is not marked reliable.`, errors);
    if (html) {
      check(
        html.includes(`id="${route.id}"`),
        'MISSING_RUNTIME_VIEW',
        `${route.id}: route map entry has no matching id="${route.id}" in dist/index.html.`,
        errors
      );
    }
  }

  // Known entitlement contract from LESSON_REGISTRY and the product register.
  const expectedLessonPermissions = {
    lesson: 'lesson_m01',
    'lesson-m02': 'lesson_m01',
    'lesson-m03': 'lesson_m01',
    'lesson-m11': 'advanced_modules',
    'lesson-m12': 'advanced_modules',
    'lesson-m13': 'advanced_modules'
  };
  for (const [routeId, expected] of Object.entries(expectedLessonPermissions)) {
    const route = routes.find(item => item.id === routeId);
    if (!route) {
      warnings.push({ code: 'MISSING_EXPECTED_LESSON_ROUTE', message: `${routeId}: expected authored lesson route is absent from the route map.` });
      continue;
    }
    check(
      route.permission === expected || route.permission.includes(expected),
      'LESSON_PERMISSION_MISMATCH',
      `${routeId}: expected entitlement ${expected}, found ${route.permission}.`,
      errors
    );
  }

  // Runtime registry checks. These are source-level checks, not string claims in the register.
  if (app) {
    check(app.includes('const LESSON_REGISTRY'), 'MISSING_LESSON_REGISTRY', 'dist/app.js does not declare LESSON_REGISTRY.', errors);
    check(app.includes('LESSON_PREREQUISITE'), 'MISSING_PREREQUISITE_MAP', 'dist/app.js does not declare LESSON_PREREQUISITE.', errors);
    for (const [routeId, expected] of Object.entries(expectedLessonPermissions)) {
      const routeToken = routeId === 'lesson' ? "viewId: 'lesson'" : `viewId: '${routeId}'`;
      if (app.includes(routeToken)) {
        const windowStart = app.indexOf(routeToken);
        const window = app.slice(Math.max(0, windowStart - 500), windowStart + 900);
        check(
          window.includes(`permission: '${expected}'`) || (expected === 'lesson_m01' && window.includes('permission') === false),
          'RUNTIME_LESSON_PERMISSION_MISMATCH',
          `${routeId}: runtime registry does not visibly derive/use expected permission ${expected}.`,
          warnings
        );
      }
    }
  }

  // Cross-document contradictions that previously occurred in the DDA documents.
  const landingRoute = routes.find(route => route.id === 'landing');
  const landingRegister = registerRows.find(row => /Landing Page/i.test(row.element));
  if (landingRoute && landingRegister) {
    check(
      !/PARTIEL/i.test(landingRegister.status) || /CONSTRUIT/i.test(landingRegister.evidence),
      'LANDING_STATUS_CONTRADICTION',
      `Landing is an active route in the route map but the register still marks Landing Page PARTIEL without a constructed-status clarification (register line ${landingRegister.line}).`,
      errors
    );
    check(
      !/non intégrée|seul point d'entrée public existant/i.test(landingRegister.evidence),
      'STALE_PUBLIC_ENTRY_DESCRIPTION',
      `Register contains a stale statement about Landing not being integrated or Access being the only public entry (register line ${landingRegister.line}).`,
      errors
    );
  }

  const routeMapSaysSequentialGate = /verrou séquentiel/i.test(routesMarkdown) && /LESSON_PREREQUISITE/i.test(routesMarkdown);
  const routeRowsClaimNoGate = routes.filter(route => /aucun verrou séquentiel/i.test(route.permission + route.output + route.back + route.registered));
  if (routeMapSaysSequentialGate) {
    check(
      routeRowsClaimNoGate.length === 0,
      'SEQUENTIAL_GATE_CONTRADICTION',
      `Route rows claim no sequential gate while the route-map verification section states that LESSON_PREREQUISITE is active: ${routeRowsClaimNoGate.map(row => row.id).join(', ')}.`,
      errors
    );
  }

  // Governance/reference integrity.
  if (/DDA_INFORMATION_ARCHITECTURE_TARGET\.md/.test(register)) {
    check(architecture, 'MISSING_ARCHITECTURE_REFERENCE', `Register references DDA_INFORMATION_ARCHITECTURE_TARGET.md, but it is absent at ${options.architecture}.`, errors);
  }

  // Detect route-map statements which cannot be reconciled with current runtime mounts.
  if (routes.some(route => route.id === 'landing')) {
    check(
      /landing/i.test(register) && /Acquisition Engine V1/i.test(register),
      'REGISTER_MISSING_LANDING_ADDENDUM',
      'Route map contains landing, but the master register does not visibly contain its Acquisition Engine V1 addendum.',
      warnings
    );
  }

  // Avoid false confidence from historical assertion counts in the register.
  const historicalTestClaims = register.match(/test_dda_v\d+\.js/g) || [];
  for (const testName of new Set(historicalTestClaims)) {
    check(
      fs.existsSync(path.join(ROOT, 'tests', testName)),
      'HISTORICAL_TEST_NOT_PRESENT',
      `Register mentions ${testName}, but the file is not present in the repository. Treat the assertion count as historical/non-auditable.`,
      warnings
    );
  }

  return report(options, errors, warnings, {
    routes: routes.length,
    registerRows: registerRows.length,
    architecturePresent: architecture,
    files: options
  });
}

function report(options, errors, warnings, summary = {}) {
  const result = {
    ok: errors.length === 0,
    errors,
    warnings,
    summary
  };
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('DDA route/register consistency verification');
    console.log(`Result: ${result.ok ? 'PASS' : 'FAIL'}`);
    if (summary.routes !== undefined) console.log(`Routes parsed: ${summary.routes}`);
    if (summary.registerRows !== undefined) console.log(`Register rows parsed: ${summary.registerRows}`);
    if (summary.architecturePresent !== undefined) console.log(`Architecture reference present: ${summary.architecturePresent ? 'yes' : 'no'}`);
    for (const item of errors) console.log(`ERROR [${item.code}] ${item.message}`);
    for (const item of warnings) console.log(`WARN  [${item.code}] ${item.message}`);
  }
  process.exitCode = result.ok ? 0 : 1;
  return result;
}

try {
  main();
} catch (error) {
  console.error(`FATAL ${error.message}`);
  process.exitCode = 1;
}
