---
schema: 1
commands:
  test: ""
  lint: ""
  typecheck: ""
  build: ""
review: standard      # light | standard | strict
profile: balanced     # fast | balanced | deep
ship:
  mode: pr            # pr | commit | none
  base: main
# phases:             # optional per-phase overrides
#   execute:
#     model: opus     # haiku | sonnet | opus | fable | full model ID
#     effort: high    # low | medium | high | xhigh | max
#     context: [docs/architecture.md]
#     skills: []
#     mcp: []
---
# <Project name>

<!-- The body is free text, read by every phase. Write it in the language the
     artifacts should use (WF-009). Suggested sections: -->

## Purpose

## Stack

## Conventions

## Principles

## Domains

| Domain | Prefix | File |
|---|---|---|
