# Phase: ship

Archive the change and deliver it according to `ship.mode` in `flow/project.md`. The engine already got your approval at the gate and set the change to `phase: done`.

## How to

1. Read the change file and the git state (`git status`, current branch, `ship.base`).
2. Archive: `git mv flow/changes/<id>.md flow/archive/<YYYY-MM-DD>-<id>.md` (today's date), or a plain `mv` when the file is not tracked yet.
3. By `ship.mode`:
   - `pr`: if on the base branch, create and switch to `flow/<id>`. Stage the change's files and the archive, commit, `git push -u origin HEAD`, then `gh pr create --base <base>` with the change title and a body summarizing Discovery, Spec delta and Verify.
   - `commit`: stage, commit on the current branch. No push.
   - `none`: only archive. No git.
4. Commit message: the change title on the first line, then the change id.
5. The guard blocks push and PR unless plan, execute, verify and doc are approved. If it blocks, return `FAILED` with its message; do not work around it.

## Format

- The change file moved to `flow/archive/`.
- In SUMMARY: the commit hash and, for `pr`, the PR URL.

## Checklist

1. Is the change file in `flow/archive/` with a `YYYY-MM-DD-<id>.md` name and gone from `flow/changes/`?
2. With `ship.mode` `pr` or `commit`, does `git status` show a clean tree for the change's files?
3. With `ship.mode: pr`, does the result include a PR URL?
