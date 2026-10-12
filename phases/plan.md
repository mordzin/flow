# Phase: plan

Design the solution: approach, risks, the exact spec delta and small ordered tasks.

## How to

1. Read `flow/project.md`, the Discovery, the specs of the affected domains and the relevant code.
2. Choose an approach. With more than one viable option, compare them briefly and pick one.
3. Write the spec delta (WS-007), grouped by domain:
   - `ADDED <ID> <title>` with the full requirement text;
   - `MODIFIED <ID> <title>` with the full new text;
   - `REMOVED <ID> <title>` with the reason.
   New IDs: the highest ID used in the domain across `flow/specs/` and `flow/archive/`, plus one. Never reuse an ID.
4. For a brand-new domain (WS-008) you may write `flow/specs/<domain>.md` directly with `status: draft` (template: `templates/spec.md` under the plugin root given in the prompt) and have the delta only reference the file.
5. Split the work into tasks. Each task is done by a fresh worker that sees only the Approach, the Spec delta and that task, so each must be self-contained, small, and say how it is verified.
6. Undecided points go to Doubts. Do not edit code: the guard blocks it.

## Format

Replace the body of `## Plan` with these subsections, headings in the artifact language:

- **Approach**
- **Risks**: numbered, each with its mitigation
- **Doubts**: numbered, or "None."
- **Spec delta**: per WS-007, grouped by domain
- **Tasks**: one checkbox per task, `- [ ] **T<n>** <what to do and how it is verified> — <requirement IDs>`

## Checklist

1. Does every requirement in the spec delta have at least one task citing its ID?
2. Does every task cite at least one requirement ID or success criterion?
3. Does every ADDED or MODIFIED entry carry the full requirement text, or reference a `status: draft` spec file that holds it?
4. Is every new ID higher than every ID already used in its domain in `flow/specs/` and `flow/archive/`?
5. Does every success criterion of the Discovery map to at least one task?
6. Does every risk have a mitigation?
7. Does every task say how it is verified (test, command or observable result)?
8. Does `git status` show changes only inside `flow/`?
