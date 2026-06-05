# Public Access Options

This document compares two safe ways to make `truebim-structural-calcs` reachable from outside the office network. It is documentation only: do not deploy, publish DNS records or expose the office server without a separate approval.

The application is a browser-only Vite frontend. It stores saved calculations, review sessions and imported/exported evidence in the user's browser `localStorage`; there is no backend database in the current architecture.

## Summary

| Option | Best for | Public URL | Infrastructure owner | Recommended use |
| --- | --- | --- | --- | --- |
| Cloudflare Tunnel | Fast pilot with limited external engineers | Cloudflare-managed hostname or project subdomain | Office server plus Cloudflare | Short pilot, controlled feedback, no inbound office firewall rule |
| VPS deployment | Permanent MVP and broader external access | Project domain such as `calc.truebim.example` | VPS provider plus domain/DNS owner | Stable public service with TLS, monitoring and isolation from office network |

## Option 1: Cloudflare Tunnel for Fast Pilot

Cloudflare Tunnel can publish the existing office-hosted app without opening an inbound port on the office firewall. A small `cloudflared` process creates an outbound tunnel from the office server or another approved internal host to Cloudflare, and Cloudflare serves the public hostname.

Use this when the goal is to give a small group of engineers an external link quickly while keeping the office network closed to direct inbound traffic.

Expected flow:

1. Confirm the currently deployed office app is the approved pilot build.
2. Create or select a Cloudflare account and zone for the pilot hostname.
3. Create a named tunnel for this project.
4. Route the public hostname to the local office app upstream, for example `http://127.0.0.1:3000`.
5. Add Cloudflare Access or another approval layer before sharing the URL.
6. Share the public URL only after validation checks pass.

Example tunnel mapping:

```yaml
tunnel: truebim-structural-calcs-pilot
credentials-file: /etc/cloudflared/truebim-structural-calcs-pilot.json

ingress:
  - hostname: calc-pilot.example.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Pilot safeguards:

- Keep the app container bound to `127.0.0.1`; the tunnel should connect locally from the approved host.
- Require Cloudflare Access, allow-listed emails or another identity gate for non-public pilots.
- Add a visible owner for the tunnel and a date when the pilot must be reviewed or disabled.
- Do not store Cloudflare tokens or tunnel credentials in this repository.

Advantages:

- Fastest path to an external HTTPS link.
- Does not require opening office firewall inbound ports.
- Easy to disable by stopping the tunnel or removing the DNS route.

Tradeoffs:

- Still depends on office server uptime and office internet connectivity.
- Tunnel credentials become production-sensitive secrets.
- Less isolated than a separate public hosting environment.
- Operational ownership can become unclear if the pilot stays longer than planned.

## Option 2: VPS Deployment for Permanent MVP

For a permanent MVP, deploy the static Docker image to a VPS instead of routing public traffic into the office environment. The VPS becomes the public edge, with nginx/Caddy/Traefik handling TLS and reverse proxying to the same app container pattern used by the office deployment.

Use this when engineers need a durable external URL that does not depend on the office network.

Expected flow:

1. Provision a VPS with a supported Linux distribution, firewall, SSH key access and automatic security updates.
2. Create a DNS record such as `calc.example.com` pointing to the VPS public IP.
3. Install Docker and a reverse proxy with automatic TLS renewal.
4. Deploy `truebim-structural-calcs` from an approved build artifact or CI-built image.
5. Bind the app container to localhost on the VPS, for example `127.0.0.1:3000:80`.
6. Reverse proxy HTTPS traffic from the public hostname to `127.0.0.1:3000`.
7. Add backup, monitoring, patching and access review procedures.

Recommended production shape:

```text
Internet
  -> DNS: calc.example.com
  -> VPS public IP
  -> reverse proxy with TLS
  -> 127.0.0.1:3000
  -> truebim-structural-calcs nginx container
```

Advantages:

- External access no longer depends on the office network.
- Public attack surface is isolated from the office server.
- Easier to add monitoring, logs, TLS renewal and deployment automation.
- Better fit for a stable MVP and customer-facing pilot.

Tradeoffs:

- Requires VPS administration, patching and incident ownership.
- Needs a secure artifact flow from repository to VPS.
- Requires domain/DNS and TLS setup before sharing the URL.
- Costs more than a temporary tunnel.

## Why Not Open The Office Server Directly

Opening the office server directly to the internet is not recommended for this project without a separate security review and explicit approval.

Risks:

- The office server currently hosts the app as part of an internal apps platform, not as a hardened internet edge.
- A public firewall/NAT rule could expose unrelated services or misconfigured nginx routes.
- Incident response becomes harder because public traffic enters the office network directly.
- A mistake in host nginx configuration could affect other office apps.
- DDoS, scanning and credential attacks would target office infrastructure.

If direct office exposure is ever considered, treat it as a separate infrastructure change. At minimum it needs firewall scope, host hardening, TLS, access logging, rate limiting, monitoring, rollback instructions and approval from the infrastructure owner.

## Required Variables And Domains

Cloudflare Tunnel pilot:

- Cloudflare account and zone owner.
- Public hostname, for example `calc-pilot.example.com`.
- Tunnel name, for example `truebim-structural-calcs-pilot`.
- Tunnel credentials location on the approved host.
- Local upstream, normally `http://127.0.0.1:3000`.
- Access policy, allow-listed users or identity provider configuration.
- Owner and review/expiry date for the pilot.

VPS MVP:

- VPS provider, region and instance name.
- Public hostname, for example `calc.example.com`.
- DNS `A` or `AAAA` record target.
- SSH admin users and public keys.
- Container image source or deployment artifact path.
- Reverse proxy config path.
- TLS email/contact for certificate renewal.
- Firewall policy for `22`, `80` and `443`.
- Monitoring and log retention owner.

Do not commit provider tokens, Cloudflare credentials, SSH private keys, passwords or `.env` secrets to this repository.

## Verification Checklist

Before sharing an external link:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

For the office build used by a tunnel, also run:

```powershell
npm run deploy:precheck
```

External access checks:

```powershell
curl -I https://calc-pilot.example.com
curl -I https://calc-pilot.example.com/diagnostics
```

Manual browser checks:

- Home route loads over HTTPS.
- `/engineer`, `/review`, `/validation-session`, `/release-evidence` and `/diagnostics` route refreshes do not 404.
- Browser console has no failed static asset loads.
- A sample calculation can be entered and exported.
- Saved calculations remain local to the browser and do not sync across devices.
- Access policy blocks an unapproved user when the link is not intended to be public.

Do not share the link if the deployed build is not the approved commit or if access controls are not working.

## How To Disable Public Access

Cloudflare Tunnel:

1. Remove or disable the public DNS route in Cloudflare.
2. Stop and disable the `cloudflared` service on the host.
3. Revoke the tunnel credentials if the pilot is finished.
4. Confirm the public hostname no longer resolves or returns no service.

VPS:

1. Remove or disable the DNS record.
2. Stop the reverse proxy route for the app.
3. Stop the app container if the VPS is no longer serving the project.
4. Close firewall access that is no longer needed.
5. Preserve logs and deployment evidence according to the project retention policy.

Office server direct exposure, if it was separately approved:

1. Remove the public firewall/NAT rule.
2. Remove public DNS pointing to the office IP.
3. Reload nginx after removing any public server block.
4. Confirm the office IP is not reachable from an external network.

## Security Risks

- The app is client-side and uses browser storage only; users must not treat `localStorage` as secure shared storage.
- Shared workstations can leak saved calculations and review sessions between users.
- Exported JSON/HTML/Markdown evidence may contain project-sensitive engineering data.
- Public URLs invite automated scanning even when the app is static.
- Tunnel, DNS, VPS and SSH credentials are high-value secrets.
- Access-control mistakes can make pilot links reachable by unintended users.
- TLS expiry, stale containers or unpatched VPS packages can turn a working deployment into an operational risk.
- External availability may create expectations that exceed the current verified calculation scope.

Keep calculation formulas, verification logic, result warnings and draft/verified status unchanged when preparing public access. Public deployment changes are infrastructure changes, not engineering verification changes.
