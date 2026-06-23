# AGENTS.md

Operational guide for AI coding agents working in this repository.

## Project Overview

`truebim-structural-calcs` is a private React + TypeScript + Vite frontend for TrueBIM structural calculation workflows. The current production surface is a browser-only punching shear calculation and engineering review tool. There is no backend database; saved calculations and review sessions use browser `localStorage`.

The app is deployed to the office server as a static Vite build served by an nginx Docker container. The office host nginx reverse-proxies the app.

## Repository Map

- `src/app` - React router and top-level app shell.
- `src/pages` - route-level pages: home, engineer portal, review, validation session, diagnostics, release evidence, pilot flows.
- `src/widgets` - larger layout and display widgets.
- `src/features` - workflow features such as calculation form, report export, review mode, validation sessions, release evidence, pilot feedback.
- `src/entities` - domain entities and local persistence models.
- `src/calculations/punching-shear` - punching shear calculation engine, geometry, verification, report, sketch and moment-transfer logic.
- `src/shared` - shared UI components, config and utilities.
- `examples/verification` - verification fixtures and templates.
- `docs` - engineering, verification, deployment and handoff documentation.
- `scripts` - local verification, release evidence and deployment scripts.
- `deploy/server` - server-side Docker Compose and nginx config templates.
- `docker/nginx` - runtime nginx config used inside the app container.

## Tech Stack

- React 19, React Router, TypeScript, Vite.
- Tailwind CSS v4 through `@tailwindcss/vite`.
- Radix UI primitives, lucide icons, framer-motion, recharts.
- zod for input schemas and validation.
- zustand for state where used.
- Vitest for tests.
- ESLint flat config.
- Yarn 4 is declared as the package manager, but `package-lock.json` also exists. Prefer the command family already used by the task or repository state; validation scripts are available through `npm run ...`.

## Required Commands

Run these before every commit when they are available:

```powershell
npm run lint
npm run typecheck
npm run test
```

For production-impacting changes, release changes, deploy changes or anything that changes build output assumptions, also run:

```powershell
npm run build
```

Useful project commands:

```powershell
npm run dev
npm run preview
npm run verification:validate
npm run verification:candidate -- path/to/candidate.json
npm run verification:stress
npm run release:evidence
npm run deploy:precheck
```

## Engineering Rules

- Read the relevant files before editing. Match existing architecture and naming.
- Keep edits scoped to the requested task. Do not rewrite unrelated docs, formatting, generated evidence or app structure.
- Do not revert or overwrite user changes. If the worktree is dirty, identify your own files and stage only those.
- Prefer structured parsing and existing helpers over ad hoc string manipulation.
- Use `@/` imports for app source aliases when that matches nearby code.
- Keep new files UTF-8 and avoid introducing mojibake. Some existing text has broken Cyrillic encoding; do not spread it.
- Do not commit secrets, private SSH keys, passwords, `.env` values or server credentials.
- Do not add debug logging, temporary comments or throwaway scripts to commits.
- Use succinct comments only for non-obvious engineering logic.

## Calculation And Verification Rules

- Treat punching shear logic as engineering-sensitive. Do not promote draft behavior to verified without trusted evidence and tests.
- Current verified scope is narrow: center rectangular force-only behavior has verified evidence. Moment transfer, openings, boundary clipping, edge/corner behavior and shear reinforcement are draft or partial unless code and docs explicitly say otherwise.
- Preserve `verifiedMode`, `verificationLevel`, `verifiedFeatures`, `draftFeatures`, warnings and evidence IDs when changing calculation outputs.
- Changes in `src/calculations/punching-shear` usually need focused tests in the local `__tests__` folders and may need fixture updates in `examples/verification`.
- Review acceptance, validation sessions and candidate exports are evidence workflows; they do not automatically make a case `VERIFIED`.
- Reports must keep draft/verification status visible. Do not hide warnings to make output look cleaner.

## Frontend Rules

- Build the actual application/workflow screen, not a marketing landing page.
- Keep UI consistent with existing `src/shared/ui` components and the current layout.
- Use lucide icons for icon buttons where available.
- Keep operational tools dense, scannable and predictable. Avoid decorative UI that makes engineering workflows harder to scan.
- Ensure text does not overflow controls on desktop or mobile.
- After significant frontend changes, run the app locally and inspect the affected routes in a browser when feasible.

## Git And Commit Rules

After any task that modifies files, create a git commit automatically.

Before committing:

```powershell
git status --short --branch
npm run lint
npm run typecheck
npm run test
git diff
```

Then stage only files belonging to the task:

```powershell
git add path/to/changed-file
git commit -m "type(scope): concise technical summary"
```

Commit messages must use Conventional Commits. Allowed types:

- `feat`
- `fix`
- `refactor`
- `docs`
- `test`
- `chore`

Good examples:

- `feat(review): add candidate export validation`
- `fix(calculation): preserve verified warnings for edge cases`
- `docs(deploy): document ssh key release flow`

Bad examples:

- `update`
- `fix`
- `changes`
- messages mentioning AI or using emoji

If unrelated user changes exist, do not stage or commit them. Report them separately.

## Deployment Rules

Primary deployment docs:

- `docs/deployment.md`
- `docs/ssh-key-deploy.md`
- `docs/release-checklist.md`
- `docs/deployment-evidence.md`
- `docs/docker-desktop-recovery.md`

Office server defaults:

- deploy host: `192.168.22.37`
- deploy user: `admin_devops`
- project: `truebim-structural-calcs`
- office URL: `http://192.168.22.37`
- public hostname: `structural-calcs.truebim-6d.ru`
- server project path: `/opt/apps/projects/truebim-structural-calcs`
- image archive path: `/opt/apps/images/truebim-structural-calcs.tar`
- container host binding: `0.0.0.0:8080:80`

Use SSH key deploy for regular workflow. Password deploy through `TRUEBIM_DEPLOY_PASSWORD` is temporary recovery only and must not be stored in repo files.

Before deploy:

```powershell
npm run deploy:precheck
npm run lint
npm run typecheck
npm run test
npm run build
```

Full deploy from Windows:

```powershell
.\scripts\full-deploy.ps1
```

`full-deploy.ps1` runs precheck, builds the Docker image, exports it, uploads it with `scp`, and redeploys the project over SSH.

Never run destructive server-wide commands such as `docker system prune`, unrelated container removal, global nginx replacement or recursive deletes outside this project.

## Push To Main Rule

If the user explicitly asks to push changes to `main`, do the normal validation and commit flow, push the committed changes to `origin main`, and then immediately deploy the pushed version to the office server so the office sees the update.

Required sequence:

```powershell
git status --short --branch
npm run lint
npm run typecheck
npm run test
npm run build
git diff
git push origin main
.\scripts\full-deploy.ps1
```

After deployment, verify the office server serves the pushed commit:

```powershell
.\scripts\deploy-precheck.ps1
```

If Docker Desktop, SSH or office network access fails, stop and report the blocker with the failed command. Do not fake a deployment.

## Final Response Requirements

After completing a modifying task and commit, report:

- root cause or reason for the change;
- implemented solution;
- changed files summary;
- verification steps and results;
- commit hash.

Mention any unrelated dirty worktree files that were intentionally excluded.
