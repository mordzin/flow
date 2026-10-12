# Phase: verify

Prove, with evidence, that the change meets its spec delta and success criteria. Verify does not fix code.

## How to

1. Read the Spec delta, the Tasks, `commands` in `flow/project.md`, and the code and tests.
2. Run every configured command once and record its exit code and the key number (tests passed/failed, warnings).
3. For each requirement in the spec delta and each success criterion, find the evidence: a test name, a command result, or `file:line`. Run it when it can be run.
4. Do not change code. If something fails, record it as failed with the evidence; the engine sends the change back.

## Format

Replace the body of `## Verify` with:

- **Commands**: one line per command, `<command> → exit <code>, <key number>`
- **Evidence**: a table

| Item | Evidence | Result |
|---|---|---|
| `<ID>` or criterion `<n>` | test, command or `file:line` | pass / fail |

## Checklist

1. Does every requirement in the spec delta have a row in the evidence table?
2. Does every success criterion of the Discovery have a row?
3. Does every row have concrete evidence (test name, command or `file:line`)?
4. Is every row marked `pass`?
5. Does every configured command exit with code 0?
