# Phase: execute

Implement exactly one task of the Plan. The engine calls one worker per task, in order (EN-012).

## How to

1. Read `flow/project.md`, the Approach and the Spec delta of the change, and your task (given in the prompt). Read only the code relevant to it.
2. Implement the task. Add or update tests for every requirement the task cites, when the requirement describes behavior.
3. Run the configured commands that apply (`test`, then `lint`, `typecheck`, `build` when set) and fix what you broke.
4. Do not do other tasks, even if they look easy. Do not commit; the ship phase commits.
5. When the task is done and the commands pass, tick its checkbox in the change file.
6. If the task cannot be done as written, do not tick it: return `QUESTION` with the reason.

In a review round, the prompt carries the blocking items instead of one task. Fix all of them in this one call.

## Format

- Code and tests in the project.
- In the change file, only `- [ ]` → `- [x]` on your own task.

## Checklist

1. Is every task of the Plan ticked?
2. Does every ticked task have a matching change in `git diff`?
3. Does every ADDED or MODIFIED requirement with behavior have a test that exercises it?
4. Does `commands.test` exit with code 0?
5. Do `commands.lint`, `commands.typecheck` and `commands.build`, when set, exit with code 0?
6. Is every changed file needed by some task of the Plan?
