# Phase: discovery

Turn the change description into a clear problem statement and verifiable success criteria. No solution design yet.

## How to

1. Read `flow/project.md`, the change description in the prompt and the list of files in `flow/specs/` (names and frontmatter only).
2. Look at the code only to understand the current state, never to design the solution.
3. Write what the problem is, for whom, the goal, constraints, what is out of scope and the success criteria.
4. Every success criterion must be checkable at the end with a command, a test or an observable behavior.
5. List the affected domains: existing ones from `flow/specs/`, plus new ones you propose.
6. Anything you cannot decide from the description and the project goes to open questions. Do not guess on scope, user-visible behavior or external dependencies.

## Format

Replace the body of `## Discovery` in the change file with these subsections, headings in the artifact language:

- **Problem**
- **For whom**
- **Goal**
- **Constraints**
- **Out of scope**
- **Success criteria**: numbered list
- **Affected domains**: domain names, new ones marked `(new)`
- **Open questions**: numbered list, or "None."

## Checklist

1. Does every Discovery subsection listed in Format exist and have content?
2. Is every success criterion checkable by a named command, test or observable behavior?
3. Is every affected domain either a file in `flow/specs/` or marked `(new)`?
4. Is the Discovery free of implementation decisions (file names, libraries, APIs to create) not stated as constraints?
5. Is every ambiguity about scope or user-visible behavior either resolved in the text or listed in open questions?
