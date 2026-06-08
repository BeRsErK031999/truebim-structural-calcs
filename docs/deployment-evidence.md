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
- Office URL by IP: `http://192.168.22.37`
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

## Root path nginx fix

Problem: `http://192.168.22.37/` returned the default text page:

```text
apps platform is ready
```

Cause: the active default nginx server block was `/etc/nginx/sites-enabled/apps-platform`, which points to `/etc/nginx/sites-available/apps-platform`. Its `location /` returned the apps platform landing page, while `truebim-structural-calcs` was only routed through the `truebim-calc.local` server name.

Before changing nginx, the application container was checked:

```text
docker ps --filter name=truebim-structural-calcs

NAMES                      PORTS                    STATUS
truebim-structural-calcs   127.0.0.1:3000->80/tcp   Up ... (healthy)
```

The container-bound application endpoint also returned the app:

```text
curl http://127.0.0.1:3000

<!doctype html>
...
<title>truebim-structural-calcs</title>
```

Changed file:

```text
/etc/nginx/sites-available/apps-platform
```

Backup created before the edit:

```text
/etc/nginx/sites-available/apps-platform.bak-20260525095046
```

Change made: `location /` now proxies the root IP traffic to the app container:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    ...
}
```

Validation and reload:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

After a successful config test, nginx reload was executed.

Post-fix checks:

```text
curl -I http://192.168.22.37/

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
```

The root body now returns the `truebim-structural-calcs` HTML:

```text
<!doctype html>
...
<title>truebim-structural-calcs</title>
```

The platform health endpoint was preserved:

```text
curl http://127.0.0.1/health

ok
```

Safety notes:

- global `/etc/nginx/nginx.conf` was not changed;
- `docker prune` was not executed;
- the edit was scoped to the default apps-platform server block root route.

## Known Limitations

- The deployed Docker tag is `latest`; immutable version tags are not configured yet.
- There is no backend and no server-side persistence; saved calculations remain browser-local via `localStorage`.
- `truebim-calc.local` requires office DNS or a client hosts entry.
- The server has an existing apps platform default server. The TrueBIM hostname/IP server block is installed separately in `/etc/nginx/conf.d/`.
- Rollback to a previous application version requires a previously saved Docker image archive. This first deploy has no earlier TrueBIM image on the server.

## Report export deploy recovery

- Recovery date: 2026-05-26
- Deployed source commit: `d576a71`
- Server IP: `192.168.22.37`
- SSH user: `admin_devops`
- Container name: `truebim-structural-calcs`

### Root cause

The first report export deploy did not complete because SSH/SCP authentication failed:

```text
Permission denied (publickey,password)
```

After SSH was restored, `deploy.ps1` still failed at the remote deploy stage with:

```text
Project directory not found: /opt/apps/projects/truebim-structural-calcs
```

The project directory existed. The actual cause was Windows CRLF/stdin handling in the PowerShell-to-SSH deploy command: the project argument reached bash with a carriage return, so the server script looked for a path with an invalid trailing character.

### Initial symptoms

Before recovery, Windows checks reported:

```text
http://192.168.22.37/            connection closed while receiving
http://192.168.22.37/diagnostics 502 Bad Gateway
```

### Diagnostics run

Server diagnostics were run with SSH key authentication:

```bash
docker ps -a | grep truebim-structural-calcs
docker logs --tail 100 truebim-structural-calcs || true
curl -I http://127.0.0.1:3000 || true
curl http://127.0.0.1:3000 | head -20 || true
systemctl status nginx --no-pager || true
tail -100 /opt/apps/shared/logs/nginx-error.log || true
```

`sudo nginx -t`, `sudo systemctl status nginx --no-pager`, and `sudo tail -100 /var/log/nginx/error.log` were attempted, but the deploy user required a sudo password and no TTY was available.

### Findings

The application container was already running and healthy:

```text
truebim-structural-calcs   truebim-structural-calcs:latest   Up ... (healthy)   127.0.0.1:3000->80/tcp
```

The container-bound endpoint responded successfully:

```text
curl -I http://127.0.0.1:3000

HTTP/1.1 200 OK
Server: nginx/1.29.8
Content-Type: text/html
Content-Length: 474
```

Host nginx was active:

```text
nginx.service - A high performance web server and a reverse proxy server
Active: active (running)
```

After direct `curl.exe` checks from Windows, both office routes returned 200:

```text
curl.exe -I http://192.168.22.37/
curl.exe -I http://192.168.22.37/diagnostics

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
```

### Recovery actions

SSH access was restored locally by configuring Windows OpenSSH to use the existing key:

```text
%USERPROFILE%\.ssh\chat-service-staging
```

The local SSH config was restricted to the current Windows user and verified with:

```bash
ssh admin_devops@192.168.22.37 "hostname && whoami"

vm-messenger-test
admin_devops
```

`scripts/deploy.ps1` was hardened so the key-based SSH path sends one quoted remote `bash -lc` command instead of piping a CRLF PowerShell here-string into `ssh`.

Then the full deploy was rerun:

```powershell
.\scripts\full-deploy.ps1
```

It completed successfully and recreated only the `truebim-structural-calcs` container.

### Post-recovery checks

Server:

```text
docker ps | grep truebim-structural-calcs

truebim-structural-calcs   truebim-structural-calcs:latest   Up ... (healthy)   127.0.0.1:3000->80/tcp
```

```text
curl -I http://127.0.0.1:3000

HTTP/1.1 200 OK
Server: nginx/1.29.8
Content-Type: text/html
Content-Length: 474
```

```text
curl -I http://192.168.22.37/
curl -I http://192.168.22.37/diagnostics

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
```

Windows:

```text
curl.exe -I http://192.168.22.37/
curl.exe -I http://192.168.22.37/diagnostics

HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
Content-Length: 474
```

### Report export smoke

Smoke was run against `http://192.168.22.37/` in a fresh Edge profile with direct proxy settings. Steps:

1. Open the app.
2. Click `Рассчитать draft`.
3. Click `Выгрузить HTML`.
4. Click `Выгрузить Markdown`.

Downloaded files:

```text
truebim-punching-shear-report-2026-05-26.html
truebim-punching-shear-report-2026-05-26.md
```

Both files contained:

```text
DRAFT CALCULATION - NOT FOR DESIGN USE
v = N / (u * h0)
```

The downloaded reports also contained the expected calculation values, including the default input force value `420`.

## SP63 benchmark deploy recovery

- Recovery date: 2026-06-08
- Deployed source commit: `5453a1b`
- Docker image tag: `truebim-structural-calcs:latest`
- Docker image ID observed on server after load: `a31a53fac546`
- Server IP: `192.168.22.37`
- SSH user: `admin_devops`
- Container name: `truebim-structural-calcs`

### Root cause

The initial `.\scripts\full-deploy.ps1` stopped before build because `deploy-precheck.ps1`
reported office URL failures:

```text
Office URL / responds: 502 Bad Gateway or receive error
Office URL /review responds: 502 Bad Gateway
Office URL /validation-session responds: 502 Bad Gateway or receive error
Office URL /diagnostics responds: 502 Bad Gateway
```

Server diagnostics showed the application runtime itself was healthy:

```text
truebim-structural-calcs   truebim-structural-calcs:latest   Up 2 days (healthy)   127.0.0.1:3000->80/tcp
curl -I http://127.0.0.1:3000
HTTP/1.1 200 OK
```

Host nginx also served the app correctly from the server and with `curl.exe` from Windows:

```text
curl -I http://192.168.22.37/
HTTP/1.1 200 OK

curl.exe -I http://192.168.22.37/review
HTTP/1.1 200 OK
```

The remaining failure was isolated to the Windows PowerShell precheck HTTP client. `Invoke-WebRequest`
intermittently returned 502/receive errors for the private office URL while `curl.exe --noproxy '*'`
returned 200. During commit detection, large JS asset reads also exposed a redirected-stdout timeout
path in the precheck helper.

`sudo nginx -t`, `sudo systemctl status nginx --no-pager`, and `sudo tail /var/log/nginx/error.log`
were attempted, but the deploy user required an interactive sudo password. No nginx config was changed.

### Recovery actions

No calculation formulas, verification logic, Docker prune, unrelated containers, or unrelated images were changed.

The deploy was completed with the project-scoped fallback sequence:

```powershell
.\scripts\build-image.ps1
.\scripts\export-image.ps1
.\scripts\upload-image.ps1
.\scripts\deploy.ps1
```

The remote deploy loaded the uploaded image and recreated only the `truebim-structural-calcs` container:

```text
Loaded image: truebim-structural-calcs:latest
truebim-structural-calcs   truebim-structural-calcs:latest   Up ...   127.0.0.1:3000->80/tcp
```

`scripts/deploy-precheck.ps1` was hardened after deployment:

- office URL checks use `curl.exe --noproxy '*'` when available;
- large office HTTP responses are written to a temp file before parsing;
- the timeout kill path supports older Windows PowerShell where `Kill($true)` is unavailable.

After this fix, `npm run deploy:precheck` passed and detected the deployed commit:

```text
[PASS] Office URL / responds - HTTP 200, 474 bytes
[PASS] Office URL /review responds - HTTP 200, 474 bytes
[PASS] Office URL /validation-session responds - HTTP 200, 474 bytes
[PASS] Office URL /diagnostics responds - HTTP 200, 474 bytes
[PASS] Remote serves current commit - Remote server appears to already serve current commit 5453a1b.
```

### Post-deploy route checks

Server-side checks:

```text
curl -I http://127.0.0.1:3000
HTTP/1.1 200 OK

curl -I http://192.168.22.37/
HTTP/1.1 200 OK

curl -I http://192.168.22.37/pilot
HTTP/1.1 200 OK

curl -I http://192.168.22.37/review
HTTP/1.1 200 OK

curl -I http://192.168.22.37/validation-session
HTTP/1.1 200 OK

curl -I http://192.168.22.37/release-evidence
HTTP/1.1 200 OK

curl -I http://192.168.22.37/diagnostics
HTTP/1.1 200 OK
```

The deployed bundle contains commit `5453a1b`.

### SP63 benchmark smoke

The deployed JS asset was checked for the SP63 benchmark report/UI strings and benchmark values:

```text
FOUND_SP63_SECTION
FOUND_SP63_UI
FOUND_1366
FOUND_0861
FOUND_0626
FOUND_DRAFT_STRESS
FOUND_NO_AUTO_VERIFIED
```

This confirms the deployed app contains:

- `SP63 Interaction Benchmark` report section;
- compact `SP63 benchmark candidate` UI block;
- concrete-only utilization value around `1.366`;
- with-reinforcement utilization value around `0.861`;
- outer-contour utilization value around `0.626`;
- existing draft stress formula `v = N / (u * h0)`;
- text confirming VERIFIED promotion is not automatic.

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
