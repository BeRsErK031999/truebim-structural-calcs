# Release Checklist

## Pre-Build Checks

- Confirm `git status --short` contains only intended changes.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run test`.
- Run `npm run build`.
- Confirm no SSH password, private key or `.env` secret is staged.

## Local Docker Checks

- Build the image:

```powershell
docker build -t truebim-structural-calcs:latest .
```

- Run a temporary local container:

```powershell
docker run --rm -p 127.0.0.1:3080:80 truebim-structural-calcs:latest
```

- Check the page:

```powershell
Invoke-WebRequest http://127.0.0.1:3080 -UseBasicParsing
```

- Check diagnostics:

```powershell
Invoke-WebRequest http://127.0.0.1:3080/diagnostics -UseBasicParsing
```

## Server Deploy Checks

- Use SSH key deploy for regular workflow.
- Run:

```powershell
.\scripts\full-deploy.ps1
```

- Check container status:

```bash
docker ps --filter name=truebim-structural-calcs
docker logs --tail 100 truebim-structural-calcs
docker inspect --format '{{json .State.Health}}' truebim-structural-calcs
```

## Nginx Checks

- Validate nginx:

```bash
sudo nginx -t
```

- Reload only after a valid config:

```bash
sudo systemctl reload nginx
```

- Confirm service status:

```bash
sudo systemctl status nginx --no-pager -l
```

## UI Smoke Checks

- Open `http://192.168.22.37`.
- Open `http://truebim-calc.local` if DNS or hosts is configured.
- Open `/diagnostics`.
- Run a default draft calculation.
- Save a calculation locally.
- Reload the page and confirm local history still appears.

## Rollback

- Stop only this project:

```bash
cd /opt/apps/projects/truebim-structural-calcs
docker compose down
```

- Restore a previous image archive if available:

```bash
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs-previous.tar
./scripts/deploy-project.sh truebim-structural-calcs
```

## Evidence Update

- Update `docs/deployment-evidence.md`.
- Record date, commit hash, image tag, container status, curl results and nginx status.
- Commit documentation changes separately when the deploy has already succeeded.
