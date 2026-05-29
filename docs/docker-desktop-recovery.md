# Docker Desktop Recovery

Use this workflow when local deploy cannot reach Docker Desktop before building the production image.

## Symptoms

- `Docker pipe unavailable`
- `Cannot connect to Docker daemon`
- `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`
- Docker Desktop is open but stuck on starting
- WSL integration is disabled, stale, or not responding
- `docker info` fails from the same terminal used for deploy

## Recovery Steps

1. Start or restart Docker Desktop.
2. Open a new PowerShell terminal in the project root.
3. Check Docker directly:

```powershell
docker info
```

4. If Docker Desktop is still stuck, restart WSL:

```powershell
wsl --shutdown
```

5. Start Docker Desktop again and wait until it reports that the engine is running.
6. Restart the terminal so PATH and Docker context state are fresh.
7. Run the deploy precheck:

```powershell
npm run deploy:precheck
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-precheck.ps1
```

8. Run full deploy only after the precheck passes:

```powershell
.\scripts\full-deploy.ps1
```

## If Local Docker Is Broken

Do not run full deploy while Docker Desktop is unreachable. The full deploy needs local Docker for image build and export.

You can still check whether the office server is already serving the expected app:

```powershell
Invoke-WebRequest http://192.168.22.37/ -UseBasicParsing
Invoke-WebRequest http://192.168.22.37/review -UseBasicParsing
Invoke-WebRequest http://192.168.22.37/validation-session -UseBasicParsing
Invoke-WebRequest http://192.168.22.37/diagnostics -UseBasicParsing
```

To confirm the deployed commit, run `scripts/deploy-precheck.ps1`. The informational `Remote serves current commit` line checks the current local commit against the JavaScript bundle served by the office server.

## Server Checks Without Local Docker

If SSH is available, confirm server health directly:

```powershell
ssh admin_devops@192.168.22.37 "docker info >/dev/null && systemctl is-active nginx && test -d /opt/apps/projects/truebim-structural-calcs"
```

This does not build, upload, delete, prune, or restart anything.
