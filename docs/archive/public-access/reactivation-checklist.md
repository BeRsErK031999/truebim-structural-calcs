# Public Access Reactivation Checklist

Use this checklist only after external rollout is approved.

## Required Approval

- External pilot approval from the project owner.
- Security review for public exposure.
- Infrastructure owner approval for the selected hosting path.
- Confirmation that calculation scope, warnings and verification status are acceptable for external engineers.

## Required Inputs

- Public domain name.
- DNS zone owner.
- Cloudflare account access if using Cloudflare Tunnel.
- Cloudflare-managed DNS zone or a DNS provider that can route the tunnel hostname.
- Cloudflare Access policy or another identity gate.
- Engineer email allow-list or corporate identity provider.
- Incident contact and support owner.
- Rollback and shutdown owner.

## Technical Checks

- Office app or VPS deployment is healthy.
- App container remains bound to `127.0.0.1` behind a reverse proxy or tunnel.
- No office firewall/NAT exposure is added without a separate security review.
- TLS works for the final hostname.
- `/`, `/pilot`, `/review`, `/validation-session`, `/release-evidence` and `/diagnostics` return `200 OK`.
- Static assets load without `404`.
- Access policy blocks unapproved users.
- Public URL and verification results are documented.

## Repository Safety

- Do not commit Cloudflare tokens, tunnel credentials, SSH private keys, DuckDNS tokens, passwords or `.env` secrets.
- Keep public access docs in active documentation only after approval.
- Do not change calculation formulas or verification logic as part of infrastructure rollout.
- Do not hide draft/partial warnings to make public output look cleaner.

## Shutdown Plan

- Stop and disable the tunnel or public reverse proxy route.
- Remove DNS routes for the pilot hostname.
- Revoke tunnel credentials when the pilot ends.
- Confirm the public hostname no longer serves the app.
- Preserve access evidence and logs according to project policy.
