# Release Evidence Workflow

Release evidence is an audit bundle for a deployed frontend release. It records what was built, what was checked, what remains draft or partial, and how to reproduce or roll back the release review later.

It does not change formulas, verification logic, candidate validation, or VERIFIED promotion rules.

## What It Contains

- Git commit hash and package version.
- Build time and evidence generation time.
- Test and deploy precheck status placeholders for release attachment.
- Office URL probe results.
- Diagnostics summary.
- Verified capability matrix.
- Verified, draft and partial counts.
- Validation session readiness.
- Review and verification candidate status.
- Known warnings and rollback notes.

## Generate Evidence

From the project root:

```powershell
npm run release:evidence
```

The CLI writes files to `release-evidence/`:

- `release-evidence-{commit}-{date}.json`
- `release-evidence-{commit}-{date}.md`
- `release-evidence-{commit}-{date}.html`

The command does not require a backend. If an office server URL is unavailable, the evidence records a warning and generation continues.

For deterministic local checks or tests:

```powershell
$env:RELEASE_EVIDENCE_DATE="2026-05-29T00:00:00.000Z"
$env:RELEASE_EVIDENCE_SKIP_URL_CHECK="1"
npm run release:evidence
```

## Attach To A Release

Before attaching evidence, run the regular validation commands:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run release:evidence
```

Attach the JSON file as machine-readable evidence and the Markdown or HTML file as human-readable release notes. Keep deploy precheck output, server smoke-check output and the generated evidence together.

## Rollback Use

Use the bundle to identify:

- the deployed commit;
- app version and build time;
- office URL health at release time;
- diagnostics and verification capability status;
- warnings that were accepted for the release.

After rollback, regenerate release evidence and compare the new bundle against the release bundle. The rollback commands remain in `docs/release-checklist.md`.

## Evidence vs Diagnostics

Diagnostics is a live client-side page at `/diagnostics`. It shows runtime state from the current browser and local storage.

Release evidence is a portable release artifact. It freezes diagnostics-like information, version metadata, URL probe results, verification matrix and rollback notes into files that can be attached to a release or audit trail.
