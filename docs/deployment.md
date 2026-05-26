# Deployment

This project is deployed as a static Vite frontend served by an nginx Docker container. The office server uses Docker Compose for the application container and host nginx as the reverse proxy.

## Artifacts

- Docker image: `truebim-structural-calcs:latest`
- Exported image archive: `truebim-structural-calcs.tar`
- Container port: `80`
- Host binding: `127.0.0.1:3000:80`
- Public office hostname: `truebim-calc.local`

## Local Windows Flow

Run commands from the project root.

1. Build the production image:

```powershell
.\scripts\build-image.ps1
```

Equivalent command:

```powershell
docker build -t truebim-structural-calcs:latest .
```

2. Export the image as a tar archive:

```powershell
.\scripts\export-image.ps1
```

Equivalent command:

```powershell
docker save truebim-structural-calcs:latest -o truebim-structural-calcs.tar
```

3. Upload the tar archive to the office server:

```powershell
.\scripts\upload-image.ps1
```

Equivalent command:

```powershell
scp .\truebim-structural-calcs.tar admin_devops@192.168.22.37:/opt/apps/images/
```

4. Deploy on the server through SSH:

```powershell
.\scripts\deploy.ps1
```

This runs:

```bash
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs.tar
./scripts/deploy-project.sh truebim-structural-calcs
```

5. Full one-command flow:

```powershell
.\scripts\full-deploy.ps1
```

NPM aliases are also available:

```powershell
npm run deploy:build
npm run deploy:export
npm run deploy:package
```

## First Server Setup

Do this once on the office server. Keep the steps scoped to this project.

1. Create the project directory:

```bash
mkdir -p /opt/apps/projects/truebim-structural-calcs
```

2. Copy server project files from this repository to:

```text
/opt/apps/projects/truebim-structural-calcs/docker-compose.prod.yml
/opt/apps/projects/truebim-structural-calcs/.env
```

Use `deploy/server/docker-compose.prod.yml` and `deploy/server/.env.example` as the source files. Rename `.env.example` to `.env` on the server.

3. Copy nginx reverse proxy config:

```text
deploy/server/nginx.truebim-structural-calcs.conf
```

to:

```text
/opt/apps/nginx/conf.d/nginx.truebim-structural-calcs.conf
```

4. Include or symlink that config from the active host nginx configuration used by the office server. Do not edit unrelated project configs and do not replace global `nginx.conf`.

5. Test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

6. Make sure local DNS or the office hosts file resolves:

```text
truebim-calc.local -> 192.168.22.37
```

## Server Flow

Note: on the current office server, root IP traffic for `http://192.168.22.37/` is intentionally routed to `truebim-structural-calcs` through the apps platform default block at `/etc/nginx/sites-available/apps-platform`. The `truebim-calc.local` server block remains available for hostname-based routing, but the root IP is currently assigned to this project.

Load the uploaded Docker image:

```bash
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs.tar
```

Deploy or redeploy the project:

```bash
cd /opt/apps
./scripts/deploy-project.sh truebim-structural-calcs
```

Expected behavior:

- the image `truebim-structural-calcs:latest` is loaded;
- Docker Compose starts `truebim-structural-calcs`;
- the container binds only to `127.0.0.1:3000`;
- host nginx proxies `truebim-calc.local` to `127.0.0.1:3000`.

Useful checks:

```bash
docker ps --filter name=truebim-structural-calcs
docker logs --tail 100 truebim-structural-calcs
docker inspect --format '{{json .State.Health}}' truebim-structural-calcs
curl -I http://127.0.0.1:3000
curl -I http://truebim-calc.local
```

Container health:

```bash
docker inspect --format '{{json .State.Health}}' truebim-structural-calcs
```

Host nginx health:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager -l
```

Frontend through the container binding:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3000/diagnostics
```

Frontend through host nginx:

```bash
curl -I http://192.168.22.37
curl -I -H 'Host: truebim-calc.local' http://127.0.0.1/diagnostics
```

Restart only this project:

```bash
cd /opt/apps/projects/truebim-structural-calcs
docker compose -f docker-compose.prod.yml restart truebim-structural-calcs
```

Reload nginx after config changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Troubleshooting

### Container Not Starting

Check logs:

```bash
docker logs --tail 200 truebim-structural-calcs
```

Check Compose status:

```bash
cd /opt/apps/projects/truebim-structural-calcs
docker compose -f docker-compose.prod.yml ps
```

Common causes:

- image was not loaded;
- `.env` file is missing if Compose is configured to require it;
- port `127.0.0.1:3000` is already used;
- copied Compose file has wrong indentation.

### Nginx Bad Gateway

Check that the app container is running and reachable from the server:

```bash
curl -I http://127.0.0.1:3000
docker ps --filter name=truebim-structural-calcs
```

Then validate host nginx:

```bash
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

### Port Already In Use

Find the process using port 3000:

```bash
sudo ss -ltnp 'sport = :3000'
```

Only change this project's Compose binding if another approved service owns the port. Do not stop unrelated containers.

### Image Not Loading

Check that the uploaded archive exists:

```bash
ls -lh /opt/apps/images/truebim-structural-calcs.tar
```

Load manually if needed:

```bash
docker load -i /opt/apps/images/truebim-structural-calcs.tar
docker images truebim-structural-calcs
```

### Stale Container

Redeploy only this project:

```bash
cd /opt/apps
./scripts/deploy-project.sh truebim-structural-calcs
```

If manual Compose is needed:

```bash
cd /opt/apps/projects/truebim-structural-calcs
docker compose -f docker-compose.prod.yml up -d
```

Avoid `docker system prune` and do not remove unrelated containers/images.

### Frontend 404 On Refresh

The container nginx config must include SPA fallback:

```nginx
try_files $uri $uri/ /index.html;
```

This is already configured in `docker/nginx/default.conf`. Rebuild the image if the deployed container does not have this config.

### Vite SPA Routing

Vite emits static files into `dist`. Browser routes are resolved by React, so nginx must serve `index.html` for unknown paths. Static assets under `/assets/` are cached with immutable headers.

### Healthcheck Fails

Inspect health details:

```bash
docker inspect --format '{{json .State.Health}}' truebim-structural-calcs
```

The healthcheck calls `http://127.0.0.1/` inside the container. If the app works through nginx but health fails, confirm the runtime image includes `wget` and that nginx is listening on port `80` inside the container.

## Safety Rules

- Docker only for the app runtime.
- No PM2, no direct Node process, no `yarn start`.
- Bind app ports only to `127.0.0.1`.
- Use host nginx as the reverse proxy.
- Do not run `docker system prune`.
- Do not delete unrelated containers, images or volumes.
- Do not replace global nginx configuration.
