# Phase: doc

Make the living spec and the project docs describe the system as it is after this change.

## How to

1. Read the Spec delta, the affected specs in `flow/specs/`, and the project README and CHANGELOG.
2. Apply the delta to `flow/specs/`:
   - ADDED: add the requirement section, in ID order;
   - MODIFIED: replace the section with the new text;
   - REMOVED: delete the section. The ID stays retired.
3. For specs this change created as `status: draft` (WS-008), set `status: active`.
4. Update README, CHANGELOG and `docs/` where user-facing behavior, setup or configuration changed. Add a CHANGELOG entry when the project has a CHANGELOG.
5. Do not change code: the guard allows only `flow/`, `README*`, `CHANGELOG*` and `docs/**`.

## Format

- Specs updated in `flow/specs/`.
- Docs updated in the project.
- Nothing written to the change file.

## Checklist

1. Does every ADDED or MODIFIED requirement in the delta appear in `flow/specs/` with the delta's text?
2. Is every REMOVED requirement absent from `flow/specs/`?
3. Is every spec file of this change's domains at `status: active`?
4. If the project has a CHANGELOG, does it have an entry for this change?
5. Does every README or docs statement about behavior changed by this change match the new behavior?
