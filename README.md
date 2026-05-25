# React + TypeScript + Vite

## Local saved calculations

Punching shear calculations can be saved locally in the browser. Saved items include the form input, draft result, report, status, warnings and metadata, and are stored in `localStorage` under `truebim-structural-calcs:saved-calculations:v1`.

The app supports loading saved calculations back into the form, deleting history items, exporting a saved calculation as JSON and importing a previously exported JSON file. This is local browser storage only; there is no backend database or cross-device sync.

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

Client-side runtime diagnostics are available at `/diagnostics`.

СП63 punching shear verification pack process is documented in `docs/sp63-verification-pack.md`.

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
- Docker Compose binds the app to `127.0.0.1:3000:80`; public access should go through host nginx only.
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
