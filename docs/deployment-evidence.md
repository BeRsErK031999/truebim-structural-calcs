# First Office Deployment Evidence

## Summary

- Deploy date: 2026-05-25 16:02:27 +07:00
- Deployed source commit: `f153ed8`
- Docker image tag: `truebim-structural-calcs:latest`
- Docker image ID observed on server: `2703c51e40fd`
- Server IP: `192.168.22.37`
- SSH user: `admin_devops`
- Container name: `truebim-structural-calcs`
- Port mapping: `127.0.0.1:3000->80/tcp`
- Public URL by IP: `http://192.168.22.37`
- Hostname URL: `http://truebim-calc.local` when DNS or hosts file resolves it to `192.168.22.37`

## Deployment Flow Used

The first deployment was started from Windows with:

```powershell
.\scripts\full-deploy.ps1
```

The initial run built and uploaded the image, then stopped because the server project directory did not exist yet:

```text
Project directory not found: /opt/apps/projects/truebim-structural-calcs
```

Only this project was initialized on the server:

- created `/opt/apps/projects/truebim-structural-calcs`;
- uploaded project compose as `/opt/apps/projects/truebim-structural-calcs/docker-compose.yml`;
- uploaded project `.env`;
- installed the nginx server block as `/etc/nginx/conf.d/truebim-structural-calcs.conf`.

The invalid first copy at `/opt/apps/nginx/conf.d/truebim-structural-calcs.conf` was moved out of the active wildcard include to:

```text
/opt/apps/nginx/conf.d/truebim-structural-calcs.server.disabled
```

Reason: this server includes `/opt/apps/nginx/conf.d/*.conf` inside an existing `server {}` block, so project files in that directory must be `location` snippets. The TrueBIM deployment needs a separate `server_name`, so it was connected through `/etc/nginx/conf.d/`.

After that, `.\scripts\full-deploy.ps1` completed successfully.

## Docker Evidence

`docker ps`:

```text
NAMES                      IMAGE                             STATUS                   PORTS
truebim-structural-calcs   truebim-structural-calcs:latest   Up 2 minutes (healthy)   127.0.0.1:3000->80/tcp
```

`docker logs --tail 40 truebim-structural-calcs` showed nginx startup and successful health/access requests:

```text
/docker-entrypoint.sh: Configuration complete; ready for start up
127.0.0.1 - - [25/May/2026:09:00:09 +0000] "GET / HTTP/1.1" 200 474 "-" "Wget" "-"
172.19.0.1 - - [25/May/2026:09:01:50 +0000] "GET / HTTP/1.1" 200 474 "-" "Mozilla/5.0 ... WindowsPowerShell/5.1..." "192.168.71.81"
```

## Curl Results

Container-bound local port on the server:

```text
curl -I http://127.0.0.1:3000

HTTP/1.1 200 OK
Server: nginx/1.29.8
Content-Type: text/html
Content-Length: 474
Cache-Control: no-store
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Host nginx by server IP:

```text
curl -I http://192.168.22.37

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
Cache-Control: no-store
```

Host nginx by `truebim-calc.local` host header:

```text
curl -I -H 'Host: truebim-calc.local' http://127.0.0.1

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
Cache-Control: no-store
```

Windows check:

```text
Invoke-WebRequest http://192.168.22.37

Status: 200
Content-Type: text/html
Length: 474
```

## Nginx Evidence

`sudo nginx -t`:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

`sudo systemctl status nginx --no-pager -l`:

```text
nginx.service - A high performance web server and a reverse proxy server
Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
Active: active (running) since Sat 2026-05-16 06:53:54 UTC
ExecReload=/usr/sbin/nginx -g daemon on; master_process on; -s reload (code=exited, status=0/SUCCESS)
```

## Known Limitations

- The deployed Docker tag is `latest`; immutable version tags are not configured yet.
- There is no backend and no server-side persistence; saved calculations remain browser-local via `localStorage`.
- `truebim-calc.local` requires office DNS or a client hosts entry.
- The server has an existing apps platform default server. The TrueBIM hostname/IP server block is installed separately in `/etc/nginx/conf.d/`.
- Rollback to a previous application version requires a previously saved Docker image archive. This first deploy has no earlier TrueBIM image on the server.

## Rollback

Stop only this project:

```bash
cd /opt/apps/projects/truebim-structural-calcs
docker compose down
```

Rollback to a previous image archive, if one exists:

```bash
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs-previous.tar
./scripts/deploy-project.sh truebim-structural-calcs
```

Reload nginx only after a valid config test:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
