# Public Pilot Access Evidence

Date: 2026-06-05

Status: attempted, not active.

## Summary

Temporary Cloudflare quick tunnel access was attempted for the office-hosted `truebim-structural-calcs` app. The office app and local upstream were healthy, but Cloudflare public edge checks returned `530` with `The origin has been unregistered from Argo Tunnel`.

The temporary tunnel was stopped after failed verification so an unauthenticated public endpoint would not remain open.

## Public URL

- Attempted temporary URL: `https://graduate-vip-kelly-vintage.trycloudflare.com`
- Current status: inactive / not verified
- Access type: account-less Cloudflare quick tunnel
- Cloudflare Access: not enabled
- Warning: public link had no identity protection while the quick tunnel process was running

Earlier failed quick tunnel URLs were also created during troubleshooting and are inactive:

- `https://thesis-holiday-let-buying.trycloudflare.com`
- `https://near-toxic-stroke-pencil.trycloudflare.com`

## Host And Upstream

- Host/server: `admin_devops@192.168.22.37`
- Office URL: `http://192.168.22.37/`
- Local upstream: `http://127.0.0.1:3000`
- App container: `truebim-structural-calcs`
- Container binding observed: `127.0.0.1:3000->80/tcp`
- `cloudflared` runtime location: `/home/admin_devops/.local/bin/cloudflared`
- `cloudflared` version observed: `2026.5.2`
- Runtime log location on server: `/home/admin_devops/truebim-cloudflared-pilot.log`

No Cloudflare tokens, tunnel credentials, private keys or secrets were written to this repository.

## Commit Context

- Local commit tested: `df1403e`
- Deployed commit hash: not confirmed
- Deploy precheck result: failed because local Docker Desktop engine was unavailable, and the office server did not appear to serve local commit `df1403e`
- Office app status: running and reachable

The Cloudflare attempt did not deploy a new app build and did not change calculation formulas or verification logic.

## Precheck Results

Local validation:

- `git status --short --branch`: clean before documentation changes, branch ahead of `origin/main`
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed, 23 files / 189 tests
- `npm run build`: passed
- `npm run deploy:precheck`: failed

Deploy precheck failures:

- Docker Desktop engine did not respond locally
- Docker daemon was not reachable locally
- Remote served JS assets did not contain current commit `df1403e`

Deploy precheck passes:

- SSH access to `admin_devops@192.168.22.37`
- Remote `/opt/apps` accessible
- Remote Docker works
- Remote project directory exists
- Nginx active on server
- Office routes respond

Office route checks:

- `http://192.168.22.37/`: `200 OK`
- `http://192.168.22.37/pilot`: `200 OK`
- `http://192.168.22.37/review`: `200 OK`
- `http://192.168.22.37/diagnostics`: `200 OK`

Server checks:

- `cloudflared --version`: initially missing
- `docker ps --filter name=truebim-structural-calcs`: container healthy
- `curl -I http://127.0.0.1:3000`: `200 OK`
- `curl -I http://127.0.0.1:3000/review`: `200 OK`

Because `sudo` required a password on the server, `cloudflared` was not installed system-wide. A user-level binary was downloaded to `/home/admin_devops/.local/bin/cloudflared`.

## Tunnel Attempts

First attempt:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate
```

- URL: `https://thesis-holiday-let-buying.trycloudflare.com`
- Result: public checks returned `502` / `530`
- Log showed QUIC timeout/reconnect behavior

Second attempt:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --protocol http2 --no-autoupdate
```

- URL: `https://near-toxic-stroke-pencil.trycloudflare.com`
- Result: public checks returned `530`
- Response body: `The origin has been unregistered from Argo Tunnel`

Third attempt:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --protocol http2 --edge-ip-version 4 --no-autoupdate
```

- URL: `https://graduate-vip-kelly-vintage.trycloudflare.com`
- Result: public checks returned `530`
- Response body: `The origin has been unregistered from Argo Tunnel`

## Public Route Checks

The following HTTPS route checks were attempted against `https://graduate-vip-kelly-vintage.trycloudflare.com`:

- `/`: `530`
- `/pilot`: `530`
- `/review`: `530`
- `/validation-session`: `530`
- `/release-evidence`: `530`
- `/diagnostics`: `530`

Because these checks failed, the public URL was not approved for engineer use.

## Current Shutdown State

The active quick tunnel process was stopped after the failed public checks.

Verification command:

```bash
pgrep -af cloudflared
```

Expected state after shutdown: no active `cloudflared` tunnel process for this project.

## How To Disable If A Tunnel Is Running

On the office server:

```bash
pgrep -af cloudflared
kill -TERM <PID>
sleep 1
kill -KILL <PID>
pgrep -af cloudflared || true
```

For a future named tunnel, also disable the Cloudflare DNS route and revoke/remove tunnel credentials according to the Cloudflare account policy.

## Risks

- Account-less quick tunnels are temporary and have no uptime guarantee.
- The attempted quick tunnel had no Cloudflare Access or identity protection.
- If the quick tunnel becomes reachable, anyone with the URL can load the app.
- Office network availability still controls app availability.
- Tunnel process ownership is manual unless converted to a named tunnel service.
- Server-side tunnel logs must not contain or be extended with credentials.
- The deployed office app was not confirmed to serve the current local commit.

## Recommended Next Step

Use a Cloudflare account/zone to create a named tunnel with an approved hostname and Cloudflare Access policy. A named tunnel is required before sharing a pilot URL with engineers.

Do not open the office server directly through firewall/NAT.
