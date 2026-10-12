#!/usr/bin/env node
// Guard do Flow. PreToolUse: aplica política da fase ativa. --session-start: limpa .active órfão.
// Node puro, sem pacote npm (GD-007).
import fs from 'node:fs';
import path from 'node:path';

const PHASES = ['discovery', 'plan', 'execute', 'verify', 'doc', 'ship'];
const SHIP_REQUIRES = ['plan', 'execute', 'verify', 'doc'];
const REVIEWER = 'flow:reviewer';
const READ_COMMANDS = ['ls', 'cat', 'head', 'tail', 'wc'];
const READ_GIT = ['diff', 'log', 'show', 'status'];
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];

class Block extends Error {}

function block(what, phase, rule, next) {
  throw new Block(
    `Flow guard blocked: ${what}\nRule: ${rule} (phase: ${phase})\nTo proceed: ${next}`
  );
}

// YAML mínimo do frontmatter: mapa aninhado por indentação, escalar, lista inline e lista em bloco.
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const lines = m[1]
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)#.*$/, '').trimEnd())
    .filter((l) => l.trim());
  const root = {};
  const stack = [{ indent: -1, node: root }];
  lines.forEach((line, i) => {
    const indent = line.length - line.trimStart().length;
    const body = line.trim();
    while (indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].node;
    if (body.startsWith('- ')) {
      if (Array.isArray(parent)) parent.push(scalar(body.slice(2)));
      return;
    }
    const kv = body.match(/^([^:]+):\s*(.*)$/);
    if (!kv || Array.isArray(parent)) return;
    const key = kv[1].trim();
    if (kv[2] !== '') {
      parent[key] = scalar(kv[2]);
      return;
    }
    const next = lines[i + 1];
    const child = next && next.trim().startsWith('- ') ? [] : {};
    parent[key] = child;
    stack.push({ indent, node: child });
  });
  return root;
}

function scalar(v) {
  v = v.trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(',').map((s) => scalar(s)) : [];
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function readFrontmatter(file) {
  return parseFrontmatter(fs.readFileSync(file, 'utf8'));
}

// Segmentos de shell separados por ; && || | e quebra de linha; tokens por espaço.
function segments(command) {
  return command
    .split(/;|&&|\|\||\||\n/)
    .map((s) => s.trim().split(/\s+/).filter(Boolean))
    .map((tokens) => {
      while (tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0])) tokens.shift();
      while (tokens.length && ['sudo', 'command', 'exec', 'time', 'env'].includes(tokens[0])) tokens.shift();
      return tokens;
    })
    .filter((t) => t.length);
}

function gitSubcommand(tokens) {
  if (path.basename(tokens[0]) !== 'git') return null;
  let i = 1;
  while (i < tokens.length && tokens[i].startsWith('-')) {
    if (['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(tokens[i])) i++;
    i++;
  }
  return tokens[i] ?? null;
}

function ghPr(tokens) {
  if (path.basename(tokens[0]) !== 'gh' || tokens[1] !== 'pr') return null;
  return tokens[2] ?? '';
}

function findChange(root, id) {
  const active = path.join(root, 'flow', 'changes', `${id}.md`);
  if (fs.existsSync(active)) return active;
  // Ship arquiva antes do push (WF-008)
  const archive = path.join(root, 'flow', 'archive');
  if (fs.existsSync(archive)) {
    const hit = fs.readdirSync(archive).find((f) => f.endsWith(`-${id}.md`) && /^\d{4}-\d{2}-\d{2}-/.test(f));
    if (hit) return path.join(archive, hit);
  }
  return null;
}

function checkEdit(input, ctx) {
  const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!target) block(`${input.tool_name} without a file path`, ctx.phase, 'GD-003', 'pass an explicit file path.');
  const rel = path.relative(ctx.root, path.resolve(ctx.root, target)).split(path.sep).join('/');
  const inside = !rel.startsWith('../') && rel !== '..' && !path.isAbsolute(rel);
  const inFlow = inside && (rel === 'flow' || rel.startsWith('flow/'));
  if (ctx.phase === 'execute') return;
  if (inFlow) return;
  if (ctx.phase === 'doc' && inside && (/^(README|CHANGELOG)[^/]*$/.test(rel) || rel.startsWith('docs/'))) return;
  const allowed = ctx.phase === 'doc' ? 'flow/, README*, CHANGELOG* and docs/**' : 'flow/';
  block(
    `${input.tool_name} on ${rel}`,
    ctx.phase,
    'GD-003',
    `in phase ${ctx.phase} only ${allowed} can be edited. Code changes belong to the execute phase; record them as tasks in the Plan.`
  );
}

function checkBash(input, ctx) {
  const command = String(input.tool_input?.command ?? '');
  for (const tokens of segments(command)) {
    const git = gitSubcommand(tokens);
    const pr = ghPr(tokens);
    if (git === 'commit' && !['execute', 'ship'].includes(ctx.phase)) {
      block('git commit', ctx.phase, 'GD-003', 'commits happen only in the execute and ship phases.');
    }
    const isPush = git === 'push';
    const isPrCreate = pr === 'create';
    if (pr !== null && !isPrCreate && ctx.phase !== 'ship') {
      block(`gh pr ${pr}`.trim(), ctx.phase, 'GD-003', 'gh pr commands run only in the ship phase.');
    }
    if (isPush || isPrCreate) {
      const what = isPush ? 'git push' : 'gh pr create';
      if (ctx.phase !== 'ship') {
        block(what, ctx.phase, 'GD-005', 'push and PR happen only in the ship phase, after plan, execute, verify and doc are approved.');
      }
      const file = findChange(ctx.root, ctx.change);
      if (!file) block(what, ctx.phase, 'GD-005', `change file for "${ctx.change}" not found in flow/changes/ or flow/archive/.`);
      const approved = [].concat(readFrontmatter(file).approved ?? []);
      const missing = SHIP_REQUIRES.filter((p) => !approved.includes(p));
      if (missing.length) {
        block(what, ctx.phase, 'GD-005', `approve the missing phases first: ${missing.join(', ')}. Run /flow to continue.`);
      }
    }
  }
}

function reviewerCommands(root) {
  const file = path.join(root, 'flow', 'project.md');
  if (!fs.existsSync(file)) return [];
  const commands = readFrontmatter(file).commands ?? {};
  return Object.values(commands).filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim());
}

function checkReviewer(input, ctx) {
  if (EDIT_TOOLS.includes(input.tool_name)) {
    block(`${input.tool_name} by the reviewer`, ctx.phase, 'GD-004', 'the reviewer is read-only; report the issue in the verdict.');
  }
  if (input.tool_name !== 'Bash') return;
  const command = String(input.tool_input?.command ?? '').trim();
  if (reviewerCommands(ctx.root).includes(command)) return;
  const next = 'the reviewer may run only the configured commands, git diff/log/show/status and ls/cat/head/tail/wc, without redirection or chaining.';
  if (/[;&|<>`$\n]/.test(command)) block(`Bash "${command}" by the reviewer`, ctx.phase, 'GD-004', next);
  const tokens = command.split(/\s+/);
  if (READ_COMMANDS.includes(tokens[0])) return;
  const git = gitSubcommand(tokens);
  if (git && READ_GIT.includes(git) && !tokens.some((t) => t.startsWith('--output'))) return;
  block(`Bash "${command}" by the reviewer`, ctx.phase, 'GD-004', next);
}

function evaluate(input, root) {
  const marker = path.join(root, 'flow', '.active');
  if (!fs.existsSync(marker)) return; // GD-002
  let active;
  try {
    active = JSON.parse(fs.readFileSync(marker, 'utf8'));
  } catch {
    block('tool call', '?', 'GD-007', 'flow/.active is not valid JSON. Run /flow to rewrite it, or delete flow/.active if no phase is running.');
  }
  if (!PHASES.includes(active.phase) || !active.change) {
    block('tool call', String(active.phase), 'GD-007', 'flow/.active has no valid change/phase. Run /flow to rewrite it, or delete flow/.active if no phase is running.');
  }
  const ctx = { root, phase: active.phase, change: active.change };
  if (input.agent_type === REVIEWER) return checkReviewer(input, ctx);
  if (EDIT_TOOLS.includes(input.tool_name)) return checkEdit(input, ctx);
  if (input.tool_name === 'Bash') return checkBash(input, ctx);
}

function sessionStart(root) {
  // .active órfão de sessão anterior (GD-001); matcher "startup" garante sessão nova
  const marker = path.join(root, 'flow', '.active');
  if (fs.existsSync(marker)) fs.rmSync(marker, { force: true });
}

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {}
  let input = {};
  try {
    input = raw.trim() ? JSON.parse(raw) : {};
  } catch {}
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  if (process.argv.includes('--session-start')) {
    try {
      sessionStart(root);
    } catch {}
    return process.exit(0);
  }
  try {
    evaluate(input, root);
    process.exit(0);
  } catch (err) {
    if (err instanceof Block) {
      process.stderr.write(err.message + '\n');
      return process.exit(2);
    }
    // erro interno: com .active presente, bloqueia (GD-007)
    let active = false;
    try {
      active = fs.existsSync(path.join(root, 'flow', '.active'));
    } catch {}
    if (!active) process.exit(0);
    process.stderr.write(
      `Flow guard blocked: internal error (${err?.message ?? err})\nRule: GD-007\nTo proceed: report the bug; delete flow/.active only if no Flow phase is running.\n`
    );
    process.exit(2);
  }
}

main();
