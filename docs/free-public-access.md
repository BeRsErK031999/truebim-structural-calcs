# Free Public Pilot Access

This document describes a free public access path for the pilot and the limits of combining DuckDNS with Cloudflare Tunnel.

Do not create a tunnel, publish DNS, open firewall/NAT rules or expose the office server without explicit confirmation.

## Current DuckDNS Check

Checked on 2026-06-05:

- `https://www.duckdns.org/` responds with `200 OK`.
- `duckdns.org` resolves.
- `truebim-calc.duckdns.org` did not resolve in DNS during the check.

That means the requested subdomain appears unused from DNS, but final availability can only be confirmed after logging in to DuckDNS and trying to create `truebim-calc`.

## Important Compatibility Warning

DuckDNS and named Cloudflare Tunnel do not form a complete stable-hostname setup by themselves.

A named Cloudflare Tunnel normally needs one of these DNS paths:

- a hostname in a Cloudflare-managed DNS zone, configured through `cloudflared tunnel route dns`; or
- a DNS provider that can create a `CNAME` from the public hostname to `<tunnel-id>.cfargotunnel.com`.

DuckDNS subdomains are designed for dynamic `A` / `AAAA` records. They are useful when a hostname points to a public IP address, but pointing `truebim-calc.duckdns.org` directly to the office public IP would require firewall/NAT exposure and is not allowed for this project.

Safe conclusion:

- Use DuckDNS only for a VPS or another public host you intentionally expose.
- Use Cloudflare Tunnel with a real domain managed in Cloudflare, for example `calc-pilot.<your-domain>`.
- Do not use DuckDNS to publish the office server through direct NAT/firewall.

The Cloudflare Tunnel config below is provided as a preparation template. It will only work if the hostname can be routed to the tunnel by DNS.

## What You Need To Register Manually

DuckDNS:

- Create or sign in to a DuckDNS account.
- Create the subdomain `truebim-calc`.
- Confirm the resulting hostname is `truebim-calc.duckdns.org`.
- Keep the DuckDNS token outside this repository.

Cloudflare named tunnel, if using Cloudflare for the stable tunnel:

- Cloudflare account access.
- A domain zone managed by Cloudflare, such as `<your-domain>`.
- A final hostname, for example `calc-pilot.<your-domain>`.
- Optional Cloudflare Access application and an allow-list of engineer emails.

If you only have DuckDNS and no Cloudflare-managed domain, do not proceed with named Cloudflare Tunnel creation. Use the VPS option or provide a Cloudflare-managed domain.

## DuckDNS Setup

Manual registration steps:

1. Open `https://www.duckdns.org/`.
2. Sign in with an approved account.
3. Add subdomain:

```text
truebim-calc
```

4. Confirm the hostname:

```text
truebim-calc.duckdns.org
```

5. Do not paste the DuckDNS token into repository files, documentation commits, issue comments or chat logs.

DuckDNS update command template, only for an approved VPS/public host:

```bash
curl "https://www.duckdns.org/update?domains=truebim-calc&token=<DUCKDNS_TOKEN>&ip=<PUBLIC_VPS_IP>"
```

Do not point DuckDNS to the office public IP unless a separate security review explicitly approves direct office exposure.

## Cloudflared Setup

On the server that will run the tunnel:

```bash
cloudflared --version
```

If missing on Ubuntu 24.04, install using an approved system package workflow or a user-level binary. Do not store credentials in the repo.

User-level binary example:

```bash
mkdir -p ~/.local/bin
curl -L --fail --output ~/.local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod 700 ~/.local/bin/cloudflared
~/.local/bin/cloudflared --version
```

For a named tunnel, login requires an interactive Cloudflare account session:

```bash
cloudflared tunnel login
```

This creates an origin certificate outside the repository, normally under `~/.cloudflared/`.

## Named Tunnel Commands

Run only after Cloudflare account, zone and hostname are confirmed:

```bash
cloudflared tunnel create truebim-structural-calcs-pilot
cloudflared tunnel list
```

Save the generated credentials file outside the repository, normally in `~/.cloudflared/` or `/etc/cloudflared/` with restricted permissions.

If using a Cloudflare-managed domain:

```bash
cloudflared tunnel route dns truebim-structural-calcs-pilot calc-pilot.<YOUR_DOMAIN>
```

If trying to use `truebim-calc.duckdns.org`, stop unless DuckDNS or another DNS layer can create the required CNAME to the Cloudflare tunnel endpoint. Do not replace that missing DNS route with office NAT/firewall exposure.

## Tunnel Config Template

Cloudflare-managed domain example:

```yaml
tunnel: truebim-structural-calcs-pilot
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: calc-pilot.<YOUR_DOMAIN>
    service: http://127.0.0.1:3000
  - service: http_status:404
```

DuckDNS hostname template, only if DNS can be routed to the tunnel:

```yaml
tunnel: truebim-structural-calcs-pilot
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: truebim-calc.duckdns.org
    service: http://127.0.0.1:3000
  - service: http_status:404
```

The ingress hostname alone is not enough. Public DNS must also route the hostname to the Cloudflare tunnel.

## Access Policy Options

Recommended:

- Cloudflare Access application on the public hostname.
- Allow only named engineer emails or a corporate email domain.
- Require one-time PIN or identity provider login.
- Keep Access policy ownership documented.

If Cloudflare Access is not available:

- Treat the link as public.
- Share it only for low-risk pilot testing.
- Do not upload confidential project data.
- Prefer a VPS with HTTP basic auth or another explicit access gate.

Warning: the app stores saved calculations and review sessions in browser `localStorage`. Public access does not add shared accounts, server-side storage or document protection.

## Verification Commands After Registration

Office app health:

```bash
docker ps --filter name=truebim-structural-calcs
curl -I http://127.0.0.1:3000
curl -I http://192.168.22.37/
```

Cloudflare tunnel:

```bash
cloudflared tunnel list
cloudflared tunnel info truebim-structural-calcs-pilot
systemctl status cloudflared-truebim.service --no-pager
```

Public route checks:

```bash
curl -I https://calc-pilot.<YOUR_DOMAIN>/
curl -I https://calc-pilot.<YOUR_DOMAIN>/pilot
curl -I https://calc-pilot.<YOUR_DOMAIN>/review
curl -I https://calc-pilot.<YOUR_DOMAIN>/validation-session
curl -I https://calc-pilot.<YOUR_DOMAIN>/release-evidence
curl -I https://calc-pilot.<YOUR_DOMAIN>/diagnostics
```

If a verified DuckDNS-to-tunnel DNS route exists:

```bash
curl -I https://truebim-calc.duckdns.org/
curl -I https://truebim-calc.duckdns.org/pilot
curl -I https://truebim-calc.duckdns.org/review
curl -I https://truebim-calc.duckdns.org/validation-session
curl -I https://truebim-calc.duckdns.org/release-evidence
curl -I https://truebim-calc.duckdns.org/diagnostics
```

Every route must return `200 OK` before sharing the link with engineers.

## Systemd Service Template

Create only after approval and after credentials/config exist outside the repo:

```ini
[Unit]
Description=Cloudflare Tunnel for truebim structural calcs pilot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=admin_devops
ExecStart=/home/admin_devops/.local/bin/cloudflared tunnel --config /etc/cloudflared/truebim-structural-calcs-pilot.yml run truebim-structural-calcs-pilot
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-truebim.service
sudo systemctl start cloudflared-truebim.service
sudo systemctl status cloudflared-truebim.service --no-pager
```

## Risks

- DuckDNS cannot safely replace Cloudflare DNS for a named tunnel unless the required tunnel DNS route is possible.
- Direct DuckDNS-to-office-IP exposure would open the office network path and is not approved.
- Without Cloudflare Access or another gate, the pilot URL is public.
- Tunnel credentials are production-sensitive secrets.
- Office uptime and office internet connectivity still affect a tunnel hosted from the office server.
- Public access can create expectations beyond the current verified calculation scope.
- External users may store sensitive data in their browser local storage.

## How To Disable

Cloudflare named tunnel:

```bash
sudo systemctl stop cloudflared-truebim.service
sudo systemctl disable cloudflared-truebim.service
cloudflared tunnel route dns delete truebim-structural-calcs-pilot calc-pilot.<YOUR_DOMAIN>
cloudflared tunnel cleanup truebim-structural-calcs-pilot
```

DuckDNS:

```bash
curl "https://www.duckdns.org/update?domains=truebim-calc&token=<DUCKDNS_TOKEN>&clear=true"
```

Manual DuckDNS alternative:

1. Sign in to DuckDNS.
2. Remove or clear the `truebim-calc` subdomain.
3. Confirm `truebim-calc.duckdns.org` no longer resolves to a public service.

Do not delete unrelated tunnels, DNS records, containers or nginx configuration.

## Recommended Path

For a stable free pilot without opening office firewall/NAT:

1. Register `truebim-calc.duckdns.org` only as a reserved fallback name.
2. Provide a Cloudflare-managed domain for the named tunnel, or use a VPS and point DuckDNS to the VPS public IP.
3. Enable an access gate before sharing the link.
4. Verify every route returns `200 OK`.
5. Record the final URL and verification results in `docs/public-pilot-access-evidence.md`.
