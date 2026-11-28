#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const downloads = path.join(root, 'dist', 'resources', 'downloads');
const checklist = path.join(downloads, 'checklist-avant-decision.pdf');
const glossary = path.join(downloads, 'glossaire-marches.pdf');
const journal = path.join(downloads, 'journal-de-trading-template.xlsx');

for (const file of [checklist, glossary, journal]) assert.ok(fs.existsSync(file), `livrable absent: ${file}`);

function ascii85Decode(input) {
  const source = input.toString('ascii').replace(/\s/g, '').replace(/^<~/, '').replace(/~>$/, '');
  const bytes = [];
  for (let i = 0; i < source.length;) {
    if (source[i] === 'z') {
      bytes.push(0, 0, 0, 0);
      i += 1;
      continue;
    }
    const group = source.slice(i, i + 5);
    i += group.length;
    if (group.length === 0) break;
    const padded = group.padEnd(5, 'u');
    let value = 0;
    for (const char of padded) {
      const code = char.charCodeAt(0) - 33;
      assert.ok(code >= 0 && code <= 84, `flux ASCII85 invalide: ${char}`);
      value = value * 85 + code;
    }
    const chunk = Buffer.from([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
    bytes.push(...chunk.subarray(0, group.length - 1));
  }
  return Buffer.from(bytes);
}

function pdfStreams(file) {
  const pdf = fs.readFileSync(file);
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-', `${path.basename(file)}: signature PDF absente`);
  const source = pdf.toString('latin1');
  const streams = [];
  const streamPattern = /stream\r?\n/g;
  let match;
  while ((match = streamPattern.exec(source))) {
    const end = source.indexOf('endstream', match.index);
    if (end < 0) continue;
    const raw = pdf.subarray(match.index + match[0].length, end).toString('latin1').replace(/[\r\n]+$/, '');
    try {
      streams.push(zlib.inflateSync(ascii85Decode(raw)).toString('latin1'));
    } catch {
      try {
        streams.push(zlib.inflateSync(Buffer.from(raw, 'latin1')).toString('latin1'));
      } catch {
        // Font binaries and other non-text streams are intentionally ignored.
      }
    }
    streamPattern.lastIndex = end + 'endstream'.length;
  }
  return { pdf: source, streams };
}

function pdfText(file) {
  const { streams } = pdfStreams(file);
  const cmap = new Map();
  for (const stream of streams) {
    for (const match of stream.matchAll(/<([0-9A-F]{2})>\s+<([0-9A-F]{4})>/gi)) {
      cmap.set(Number.parseInt(match[1], 16), String.fromCodePoint(Number.parseInt(match[2], 16)));
    }
  }
  const decodeLiteral = (literal) => {
    const bytes = [];
    for (let i = 0; i < literal.length; i += 1) {
      if (literal[i] !== '\\') {
        bytes.push(literal.charCodeAt(i));
        continue;
      }
      const octal = literal.slice(i + 1).match(/^[0-7]{1,3}/);
      if (octal) {
        bytes.push(Number.parseInt(octal[0], 8));
        i += octal[0].length;
      } else {
        const escaped = { n: 10, r: 13, t: 9, b: 8, f: 12, '(': 40, ')': 41, '\\': 92 }[literal[i + 1]];
        bytes.push(escaped ?? literal.charCodeAt(i + 1));
        i += 1;
      }
    }
    return bytes.map((byte) => cmap.get(byte) ?? String.fromCharCode(byte)).join('');
  };
  return streams
    .flatMap((stream) => [...stream.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((match) => decodeLiteral(match[1])))
    .join('\n');
}

function pdfPages(file) {
  const { pdf } = pdfStreams(file);
  return (pdf.match(/\/Type\s*\/Page\b/g) || []).length;
}

const checklistText = pdfText(checklist);
assert.equal(pdfPages(checklist), 2, 'la checklist doit rester imprimable sur deux pages');
for (const marker of ['CONTEXTE ET', 'RISQUE ET DISCIPLINE', 'DÉCISION FINALE', 'NOTES DE RELECTURE', 'invalidation', 'émotionnel']) {
  const normalizedText = checklistText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normalizedMarker = marker.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  assert.ok(normalizedText.includes(normalizedMarker), `checklist: marqueur absent: ${marker}`);
}

const glossaryText = pdfText(glossary);
assert.equal(pdfPages(glossary), 4, 'le glossaire doit rester un guide court de quatre pages');
const normalizedGlossary = glossaryText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
for (const marker of ['Fondamentaux', 'Prix', 'Ordres', 'Lecture technique', 'Exemple.', 'Erreur']) {
  const normalizedMarker = marker.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  assert.ok(normalizedGlossary.includes(normalizedMarker), `glossaire: marqueur absent: ${marker}`);
}

const xlsxEntries = execFileSync('unzip', ['-Z1', journal], { encoding: 'utf8' });
for (const entry of ['xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml']) {
  assert.match(xlsxEntries, new RegExp(`^${entry.replaceAll('/', '\\/')}$`, 'm'), `journal: structure XLSX absente: ${entry}`);
}
const workbookXml = execFileSync('unzip', ['-p', journal, 'xl/workbook.xml'], { encoding: 'utf8' });
for (const sheet of ['Journal de trading', 'Instructions', 'Relecture']) assert.match(workbookXml, new RegExp(sheet), `feuille absente: ${sheet}`);
const sheetXml = execFileSync('unzip', ['-p', journal, 'xl/worksheets/sheet1.xml'], { encoding: 'utf8' });
assert.match(sheetXml, /autoFilter|tableParts/, 'le journal doit exposer un filtre ou une table structurée');
assert.match(sheetXml, /dataValidations/, 'le journal doit exposer des listes de saisie utiles');
const headerCells = [...sheetXml.matchAll(/<c r="([A-Z]+)4"/g)].map((match) => match[1]);
assert.deepEqual(headerCells, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 'le journal doit conserver exactement ses dix champs métier');
assert.doesNotMatch(sheetXml, /<c r="[K-Z]4"/, 'aucune colonne financière chiffrée supplémentaire ne doit être ajoutée');

console.log('Downloadable resources contract: PASS');
