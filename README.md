# React + TypeScript + Vite

## Local saved calculations

Punching shear calculations can be saved locally in the browser. Saved items include the form input, draft result, report, status, warnings and metadata, and are stored in `localStorage` under `truebim-structural-calcs:saved-calculations:v1`.

The app supports loading saved calculations back into the form, deleting history items, exporting a saved calculation as JSON and importing a previously exported JSON file. This is local browser storage only; there is no backend database or cross-device sync.

## Report export

Current punching shear draft calculations can be downloaded as HTML or Markdown reports for engineering review. The reports remain explicitly marked as draft / not for design use.

Reports include a `calculationId` such as `ps-center-20260526-041754-d576a71`, assumptions, unsupported draft features, verification source, units inside value cells and an inline SVG geometry preview with numeric dimensions, X/Y axes, scale label and dimension arrows.

See `docs/report-export.md` for the workflow and verified case guidance.

## Draft moment transfer

Center rectangular cases now include draft Mx/My plumbing: eccentricity values, provisional linear stress redistribution, max/min perimeter stress, SVG stress markers and Moment Transfer / Stress Distribution report sections.

This is not verified SP63 support. The implementation is architecture and verification workflow preparation only; see `docs/moment-transfer-draft.md`.

## Verified transition layer

Punching shear results now expose granular verification status: `verifiedMode`, `verificationLevel`, `verifiedFeatures`, `draftFeatures` and linked verification evidence. The current verified scope is only center rectangular force-only arithmetic. Center rectangular moment transfer is partial because it can link to verified force-only evidence but Mx/My arithmetic is still provisional.

Edge, corner, openings, shear reinforcement and round columns remain draft. See `docs/verified-transition-strategy.md`.

## Engineering review mode

Engineer Portal is available at `/engineer`. It is the start page for engineers and links the calculation, validation session, Engineering Review, Release Evidence and diagnostics workflows. It also includes copy buttons for engineer instructions, the return checklist and the current office app URLs. See `docs/engineer-portal.md`.

Engineering Review mode is available at `/review`. It provides local-only manual evidence input, side-by-side comparison against trusted/WebCAD/Excel values, mismatch highlighting, JSON/HTML review snapshot export, session import/export, and frozen snapshot drift detection.

Accepted review status does not automatically promote VERIFIED. Review evidence feeds the verification lifecycle, but capability promotion still requires verified fixtures and passing verification logic. See `docs/engineering-review-workflow.md`.

## Draft openings and boundaries

Edge, corner and opening cases now have clean-room draft geometry support for rectangular columns. The engine clips the draft control perimeter against slab boundaries, subtracts opening-affected segments using tangent geometry, and exposes removed segments/tangents in SVG previews and reports.

This is geometry and verification preparation only, not verified SP63 support. See `docs/openings-and-boundaries-draft.md`.

Edge/opening trusted validation workflow templates and snapshot comparison guidance are documented in `docs/verified-edge-opening-workflow.md`.

## Draft wall corner geometry

Wall-end and wall-corner cases now have draft geometry foundations for pilot review. Wall-corner uses a `WallCornerInput` DTO with independent X/Y lengths, independent X/Y thicknesses, and four orientation options. The SVG/report output shows the L-shaped wall corner, active control perimeter, dimensions, warnings and draft-only applicability.

This is geometry and verification preparation only, not verified SP63 support. See `docs/wall-punching-draft.md` and `docs/wall-corner-punching-draft.md`.

Multiple control perimeters now have a draft foundation behind an explicit form toggle. When enabled, the app generates draft offsets, selects a `draftCriticalContour` by maximum draft utilization, labels the contours in SVG, and adds a report table. This is not verified SP63 contour selection. See `docs/multiple-control-contours-draft.md`.

Shear reinforcement now has a draft foundation behind an explicit form toggle. When enabled, the app captures steel class, layout type, bar diameter, spacing, row count, legs per row and row distances, then reports draft area, contribution, reinforced capacity and reinforced utilization. This is not verified SP63 shear reinforcement support. See `docs/shear-reinforcement-draft.md`.

Round columns now have a draft center-only geometry foundation. The app captures diameter and position, generates a 32-segment circular control perimeter approximation, shows round SVG labels, and exports a Round Column Geometry report section. Edge/corner round positions remain not implemented. This is not verified SP63 support. See `docs/round-column-draft.md`.

Moment transfer trusted validation templates, stress comparison and snapshot review workflow are documented in `docs/verified-moment-transfer-workflow.md`.

Stress regression evidence collection is documented in `docs/stress-regression-workflow.md`. Draft templates for trusted moment stress evidence live in `examples/verification/moments/` and cover low/high Mx, low/high My and combined Mx/My cases.

## First verified case

The first real SP63 verified case should follow `docs/first-verified-case-checklist.md`. The current example template stays `status: "draft"` with `expected` values set to `null` until WebCAD, manual engineering calculation, verified Excel or a normative example has been used for comparison.

## Docker deploy

The production image is a multi-stage Docker build: Node builds the Vite app, then nginx serves the static `dist` output. Runtime uses Docker only and exposes the frontend inside the container on port `80`.

Local build:

```powershell
docker build -t truebim-structural-calcs:latest .
docker run --rm -p 127.0.0.1:3000:80 truebim-structural-calcs:latest
```

Docker Compose:

```powershell
Copy-Item .env.example .env
docker compose up -d
```

## Office server deploy

Office server deployment uses an exported Docker image archive and host nginx reverse proxy:

- image archive path: `/opt/apps/images/truebim-structural-calcs.tar`;
- project path: `/opt/apps/projects/truebim-structural-calcs`;
- nginx config path: `/opt/apps/nginx/conf.d/nginx.truebim-structural-calcs.conf`;
- reverse proxy hostname: `truebim-calc.local`;
- upstream target: `127.0.0.1:3000`.

See `docs/deployment.md` for the full first-time setup and troubleshooting flow.

First office deployment evidence is recorded in `docs/deployment-evidence.md`.

SSH key deploy setup is documented in `docs/ssh-key-deploy.md`.

Release hardening checks are documented in `docs/release-checklist.md`.

## Current deployment mode

Office deployment only.

The app is currently used inside the office network through the office server, or through local network/VPN access when needed. Public access exploration is archived in `docs/archive/public-access/` until an external rollout is approved.

Client-side runtime diagnostics are available at `/diagnostics`.

Release Evidence is available at `/release-evidence`. It exports HTML, Markdown and JSON bundles for audit and reproducibility without changing formulas, verification logic or candidate promotion rules. The local CLI writes bundle files to `release-evidence/`:

```powershell
npm run release:evidence
```

See `docs/release-evidence-workflow.md`.

Engineering review can export verification candidate JSON from `/review`. The candidate CLI checks the exported JSON without importing it:

```powershell
npm run verification:candidate -- path/to/candidate.json
```

Accepted Review != VERIFIED, and Candidate != VERIFIED. Manual dataset import and the verification runner remain required for promotion.

Validation Session mode is available at `/validation-session`. It combines the active report exports, review snapshot, candidate JSON, regression snapshot, engineer notes, checklist progress and metadata summary into a deterministic engineer package manifest. See `docs/validation-session-workflow.md`.

## Engineer handoff

Engineer handoff instructions and templates are available for external trusted evidence collection:

- `docs/engineer-handoff.md`
- `docs/engineer-portal.md`
- `docs/engineer-review-checklist.md`
- `docs/validation-session-workflow.md`
- `docs/evidence-template-pack/README.md`

Процесс подготовки verification pack для продавливания по СП63 описан в `docs/sp63-verification-pack.md`.

## Windows deploy scripts

Run from the project root:

```powershell
.\scripts\build-image.ps1
.\scripts\export-image.ps1
.\scripts\upload-image.ps1
.\scripts\deploy.ps1
```

Or run the full sequence:

```powershell
.\scripts\full-deploy.ps1
```

NPM aliases:

```powershell
npm run deploy:build
npm run deploy:export
npm run deploy:package
```

## Production notes

- The app is served by an nginx container with SPA fallback, gzip, static asset caching and basic security headers.
- Docker Compose binds the app to `127.0.0.1:3000:80`; access should go through host nginx only.
- The container uses `restart: unless-stopped` and includes an HTTP healthcheck.
- Do not store SSH passwords or server secrets in this repository.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
