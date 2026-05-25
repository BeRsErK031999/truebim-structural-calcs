# SSH Key Deploy

Use SSH keys for regular deploys. Password deploy through `TRUEBIM_DEPLOY_PASSWORD` is only a temporary fallback and should not be part of the daily workflow.

## Create An ed25519 Key On Windows

Run in PowerShell:

```powershell
ssh-keygen -t ed25519 -C "truebim-structural-calcs deploy" -f $env:USERPROFILE\.ssh\truebim_structural_calcs_ed25519
```

Use a passphrase if your workstation policy requires one. The command creates:

```text
%USERPROFILE%\.ssh\truebim_structural_calcs_ed25519
%USERPROFILE%\.ssh\truebim_structural_calcs_ed25519.pub
```

Keep the private key private. Do not commit it.

## Add The Public Key On The Server

Copy the public key:

```powershell
Get-Content $env:USERPROFILE\.ssh\truebim_structural_calcs_ed25519.pub
```

Then add it to the deploy user's `authorized_keys` on the server:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
printf '%s\n' 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

This modifies only the `admin_devops` user's SSH access.

## Configure Windows SSH

Create or update:

```text
%USERPROFILE%\.ssh\config
```

Example:

```sshconfig
Host truebim-office
  HostName 192.168.22.37
  User admin_devops
  IdentityFile ~/.ssh/truebim_structural_calcs_ed25519
  IdentitiesOnly yes
```

The deploy scripts default to `admin_devops@192.168.22.37`, so this config is optional. It is useful for manual checks.

## Verify Passwordless SSH

Run:

```powershell
ssh -i $env:USERPROFILE\.ssh\truebim_structural_calcs_ed25519 admin_devops@192.168.22.37 "hostname && whoami"
```

Expected result:

```text
<server-hostname>
admin_devops
```

No password prompt should appear. A key passphrase prompt is normal if the key has a passphrase and is not loaded into `ssh-agent`.

## Deploy Without Password Mode

Make sure `TRUEBIM_DEPLOY_PASSWORD` is not set:

```powershell
Remove-Item Env:\TRUEBIM_DEPLOY_PASSWORD -ErrorAction SilentlyContinue
```

Then run:

```powershell
.\scripts\full-deploy.ps1
```

The scripts will use normal `ssh` and `scp`. If your key is not the default identity, use an SSH config entry or `ssh-agent`.

## Remove Password Workflow From Daily Use

- Do not store the SSH password in PowerShell profiles, `.env` files, CI variables or repository files.
- Do not run deploys by setting `TRUEBIM_DEPLOY_PASSWORD` unless this is a one-time recovery path.
- If password mode is used, the scripts print:

```text
Password deploy mode is temporary. Use SSH key deploy for regular workflow.
```

- Prefer key-based deploy for every regular build -> export -> upload -> deploy cycle.
