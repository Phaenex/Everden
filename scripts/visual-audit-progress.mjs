#!/usr/bin/env node
/**
 * Compute visual + click Playwright audit progress from checklist + screenshots.
 * Usage: npm run audit:creator:progress
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHECKLIST = path.join(ROOT, 'docs/playtests/visual-audit-checklist.json');
const MANIFEST = path.join(ROOT, 'docs/playtests/visual-audit-manifest.json');
const OUT = path.join(ROOT, 'docs/playtests/VISUAL_CLICK_AUDIT.md');

function bar(ratio, width = 20) {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function pct(n, d) {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

function exists(rel) {
  if (!rel) return false;
  return fs.existsSync(path.join(ROOT, rel));
}

const checklist = JSON.parse(fs.readFileSync(CHECKLIST, 'utf8'));
let manifest = null;
if (fs.existsSync(MANIFEST)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

let captured = 0;
let capturedTotal = 0;
let visualPass = 0;
let visualBorderline = 0;
let visualFail = 0;
let visualReviewed = 0;
let visualTotal = 0;

const categoryRows = [];

for (const cat of checklist.categories) {
  let catCaptured = 0;
  let catTotal = 0;
  let catVisualOk = 0;
  let catVisualReviewed = 0;
  const lines = [];

  for (const item of cat.items) {
    if (item.optional && !item.shot) continue;
    catTotal++;
    capturedTotal++;
    if (!item.optional) visualTotal++;

    const hasShot = item.shot ? exists(item.shot) : false;
    if (hasShot) {
      catCaptured++;
      captured++;
    }

    let visualMark = '⬜';
    if (item.visual === 'pass') {
      visualMark = '✅';
      visualReviewed++;
      catVisualReviewed++;
      visualPass++;
      catVisualOk++;
    } else if (item.visual === 'borderline') {
      visualMark = '🟡';
      visualReviewed++;
      catVisualReviewed++;
      visualBorderline++;
      catVisualOk++;
    } else if (item.visual === 'fail') {
      visualMark = '❌';
      visualReviewed++;
      catVisualReviewed++;
      visualFail++;
    } else if (hasShot) {
      visualMark = '🟡';
    }

    const cap = hasShot ? '✅' : '⬜';
    const note = item.note ? ` — ${item.note}` : '';
    lines.push(`| ${cap} | ${visualMark} | ${item.label}${note} |`);
  }

  if (catTotal === 0) continue;

  categoryRows.push({
    id: cat.id,
    label: cat.label,
    captured: catCaptured,
    total: catTotal,
    visualOk: catVisualOk,
    visualReviewed: catVisualReviewed,
    lines,
  });
}

const clickPct = pct(captured, capturedTotal);
const visualPct = pct(visualPass + visualBorderline, visualTotal);
const agentEyePct = pct(visualReviewed, visualTotal);

const md = `# Visual + click Playwright audit

**Auto-generated** — run \`npm run audit:creator:progress\` after screenshots.  
**Last manifest:** ${manifest?.completedAt ?? 'none'} (${manifest?.runId ?? '—'})  
**Playwright:** ${manifest?.playwright ?? '—'}

## Progress bars

\`\`\`
CLICK+SHOT  [${bar(captured / capturedTotal)}] ${clickPct}%  (${captured}/${capturedTotal} screenshots on disk)
AGENT EYE   [${bar(visualReviewed / visualTotal)}] ${agentEyePct}%  reviewed (${visualPass} pass · ${visualBorderline} borderline · ${visualFail} fail)
VISUAL OK   [${bar((visualPass + visualBorderline) / visualTotal)}] ${visualPct}%  (pass + borderline / ${visualTotal} items)
NICK EYE    [░░░░░░░░░░░░░░░░░░░░]  0%  (human gate — not Playwright)
\`\`\`

## Commands

| Command | What it does |
|---------|----------------|
| \`npm run audit:creator:visual\` | Full AR-035 click-through + screenshots + refresh this file |
| \`npm run audit:creator:progress\` | Refresh bars from checklist + screenshot files only |
| \`npx playwright test e2e/character-creation.spec.ts\` | Mechanical save/matrix e2e |

## Category breakdown

| Category | Click+shot | Bar |
|----------|------------|-----|
${categoryRows.map((c) => `| ${c.label} | ${c.captured}/${c.total} | \`[${bar(c.captured / c.total, 10)}]\` |`).join('\n')}

## Checklist detail

${categoryRows
  .map(
    (c) => `### ${c.label} (${c.captured}/${c.total})

| Shot | Agent eye | Item |
|------|-----------|------|
${c.lines.join('\n')}
`,
  )
  .join('\n')}

## Open (not 100% click+shot)

${categoryRows
  .flatMap((c) =>
    c.lines
      .filter((l) => l.startsWith('| ⬜'))
      .map((l) => `- ${c.label}: ${l.split('|')[3]?.trim() ?? 'item'}`),
  )
  .join('\n') || '_All checklist shots present on disk._'}

## Agent rules

1. **Click+shot green ≠ visual PASS** — open each new screenshot before handoff.
2. Update \`visual\` / \`note\` fields in \`visual-audit-checklist.json\` after eye-check.
3. Log run in \`docs/playtests/AGENT_RUNS.md\` (AR-NNN).
`;

fs.writeFileSync(OUT, md);

console.log('=== Visual + click Playwright audit ===');
console.log(`CLICK+SHOT  [${bar(captured / capturedTotal)}] ${clickPct}%  (${captured}/${capturedTotal})`);
console.log(`AGENT EYE   [${bar(visualReviewed / visualTotal)}] ${agentEyePct}%  (${visualPass} pass · ${visualBorderline} borderline · ${visualFail} fail)`);
console.log(`VISUAL OK   [${bar((visualPass + visualBorderline) / visualTotal)}] ${visualPct}%`);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
