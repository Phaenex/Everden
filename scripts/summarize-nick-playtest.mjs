#!/usr/bin/env node
/**
 * Print a human-readable summary of docs/playtests/NICK_RESPONSES.json
 * Usage: npm run nick:summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '../docs/playtests/NICK_RESPONSES.json');

if (!fs.existsSync(file)) {
  console.log('No NICK_RESPONSES.json yet. Run npm run playtest:nick and Save.');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!data.updatedAt) {
  console.log('NICK_RESPONSES.json exists but empty (no updatedAt). Nick has not saved yet.');
  process.exit(0);
}

console.log('=== Nick playtest summary ===');
console.log(`Updated: ${data.updatedAt}`);
console.log(`Session: ${data.session?.tester ?? '?'} · ${data.session?.species || 'species?'} · ${data.session?.build ?? ''}`);
console.log(`Verdict: ${data.overallVerdict ?? 'not set'}`);
console.log('');

let yes = 0, no = 0, skip = 0, open = 0;
const failures = [];

for (const sec of data.sections ?? []) {
  for (const it of sec.items ?? []) {
    if (it.answer === 'yes') yes++;
    else if (it.answer === 'no') {
      no++;
      failures.push({ section: sec.title, label: it.label, comment: it.comment });
    } else if (it.answer === 'skip') skip++;
    else open++;
  }
}

console.log(`Items: ${yes} yes · ${no} no · ${skip} n/a · ${open} unanswered`);
console.log('');

if (failures.length) {
  console.log('--- NO answers ---');
  for (const f of failures) {
    console.log(`[${f.section}] ${f.label}`);
    if (f.comment) console.log(`  → ${f.comment}`);
  }
  console.log('');
}

if (data.p0Bugs?.trim()) {
  console.log('--- P0 bugs ---');
  console.log(data.p0Bugs.trim());
  console.log('');
}

if (data.globalNotes?.trim()) {
  console.log('--- Global notes ---');
  console.log(data.globalNotes.trim());
  console.log('');
}

const metrics = (data.metrics ?? []).filter((m) => m.pass !== null);
if (metrics.length) {
  console.log('--- Metrics ---');
  for (const m of metrics) {
    console.log(`${m.pass ? 'PASS' : 'FAIL'}: ${m.label}${m.notes ? ` — ${m.notes}` : ''}`);
  }
}
