#!/bin/sh
# T1: confirma premissas (a) agent_type no PreToolUse de subagente de plugin,
# (b) model/effort por chamada, (c) skill dispara subagente quando instruída.
set -e
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
export PROBE_LOG="$work/hook-log.jsonl"
cd "$work"
claude -p "/probe:go" --plugin-dir "$here/probe" --allowedTools "Bash(echo probe-ok)" > "$work/out.txt"
echo "== resposta"; cat "$work/out.txt"
echo "== (a) agent_type nos hooks"; grep -o '"agent_type":"[^"]*"' "$PROBE_LOG" | sort | uniq -c || echo "nenhum agent_type"
echo "== (b) esperado: modelo haiku na resposta acima"
echo "== (c) esperado: probe:probe em (a)"
