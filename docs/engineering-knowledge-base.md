# Engineering Knowledge Base

The engineering knowledge base is a local evidence memory for punching shear work.
It records what engineers learned from reviews, validation sessions, candidates,
verified cases, release evidence, SP63 clause references, and lessons learned.

It does not change formulas, verification logic, or automatic VERIFIED promotion.
Knowledge entries only support engineering review and future verification work.

## Categories

Entries use one of these categories:

- center
- moments
- edge
- corner
- wall-end
- wall-corner
- openings
- contours
- reinforcement
- round
- verification
- SP63
- review

Use the narrowest category that matches the engineering topic. Use `verification`
for cross-cutting evidence and `review` for process lessons that are not tied to
one geometry type.

## Using The Knowledge Page

Open `/knowledge`.

The page shows:

- category filters;
- text search across titles, tags, sources, findings, and warnings;
- recent entries;
- verified findings;
- open questions;
- unresolved mismatches.

Entries are stored in browser `localStorage`, like review and validation sessions.
Export or preserve the source review/candidate/evidence files separately when the
knowledge needs to survive browser cleanup.

## Creating Lessons Learned

Lessons learned entries use this template:

- issue;
- root cause;
- engineer decision;
- evidence;
- recommendation.

Use lessons learned when a review explains why the app and a trusted source
diverged, why a convention was selected, or what future reviewers must check
before creating a candidate.

The recommendation should be actionable. Examples:

- require axis convention notes before moment candidate export;
- keep wall-corner perimeter draft-only until trusted SP63 evidence is attached;
- add a regression snapshot before accepting a review with manual tolerances.

## Linking Review And Evidence

Accepted reviews can create knowledge entries from `/review` with
`Create Knowledge Entry`.

The created entry links:

- the review session id;
- the trusted source type and reference;
- review notes;
- accepted decision notes;
- mismatches and warnings from the comparison table.

Verification candidates, validation sessions, verified cases, and release evidence
have domain conversion helpers in `src/features/knowledge-base`. These helpers
capture source references and related ids, but they do not import anything into
the verified dataset.

## SP63 Notes

SP63 notes must not copy standard text into the app.

Store only:

- clause references;
- internal explanations;
- verified interpretations.

Use the `SP63` category for general notes, or a narrower category when a clause
interpretation applies to a specific geometry such as `center`, `edge`,
`wall-end`, or `reinforcement`.

## VERIFIED Support

Knowledge helps future VERIFIED work by collecting evidence and decisions in one
place:

- verified findings show what trusted evidence already supports;
- open questions show what still needs engineer input;
- unresolved mismatches show where candidate promotion must stop;
- related knowledge appears in report exports when entries match the current case
  type, verification evidence ids, or feature tags.

Knowledge entries are supporting material only. A case becomes VERIFIED only
through the existing verification dataset and verification logic.
