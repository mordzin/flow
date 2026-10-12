#!/usr/bin/env node
// Roda guard.mjs contra fixtures: entrada do hook → código de saída esperado.
// Cada caso monta projeto temporário com flow/.active, mudança e project.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const guard = path.resolve(here, '../../hooks/guard.mjs');
const cases = JSON.parse(fs.readFileSync(path.join(here, 'cases.json'), 'utf8'));

const PROJECT = `---
schema: 1
commands:
  test: "npm test"   # comentário
  lint: npm run lint
review: standard
---
# Exemplo
`;

function setup(c) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-guard-'));
  fs.mkdirSync(path.join(root, 'flow', 'changes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'flow', 'archive'), { recursive: true });
  fs.writeFileSync(path.join(root, 'flow', 'project.md'), PROJECT);
  if (c.active !== undefined) {
    const body = typeof c.active === 'string' ? c.active : JSON.stringify({ started: '2026-10-12T00:00:00Z', ...c.active });
    fs.writeFileSync(path.join(root, 'flow', '.active'), body);
  }
  if (c.approved) {
    const dir = c.archived ? 'archive' : 'changes';
    const name = c.archived ? '2026-10-12-demo.md' : 'demo.md';
    fs.writeFileSync(
      path.join(root, 'flow', dir, name),
      `---\nid: demo\nphase: ship\napproved: [${c.approved.join(', ')}]\n---\n# Demo\n`
    );
  }
  return root;
}

function resolvePaths(value, root) {
  return JSON.parse(JSON.stringify(value).replaceAll('$ROOT', root));
}

let failed = 0;
for (const c of cases) {
  const root = setup(c);
  const input = resolvePaths({ hook_event_name: 'PreToolUse', cwd: root, ...c.input }, root);
  const args = [guard, ...(c.args ?? [])];
  const res = spawnSync('node', args, {
    input: JSON.stringify(input),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    encoding: 'utf8',
  });
  const problems = [];
  if (res.status !== c.exit) problems.push(`exit ${res.status}, expected ${c.exit}`);
  for (const s of [].concat(c.stderr ?? [])) {
    if (!res.stderr.includes(s)) problems.push(`stderr missing "${s}"`);
  }
  if (c.activeRemoved && fs.existsSync(path.join(root, 'flow', '.active'))) problems.push('flow/.active not removed');
  fs.rmSync(root, { recursive: true, force: true });
  if (problems.length) {
    failed++;
    console.log(`FAIL ${c.name}: ${problems.join('; ')}${res.stderr ? `\n  stderr: ${res.stderr.trim()}` : ''}`);
  }
}
console.log(`${cases.length - failed}/${cases.length} guard cases passed`);
process.exit(failed ? 1 : 0);
