$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$DeployCommands = @'
set -e
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs.tar
./scripts/deploy-project.sh truebim-structural-calcs
'@

$DeployHost = $env:TRUEBIM_DEPLOY_HOST
if (-not $DeployHost) {
  $DeployHost = '192.168.22.37'
}

$DeployUser = $env:TRUEBIM_DEPLOY_USER
if (-not $DeployUser) {
  $DeployUser = 'admin_devops'
}

if ($env:TRUEBIM_DEPLOY_PASSWORD) {
  Write-Warning 'Password deploy mode is temporary. Use SSH key deploy for regular workflow.'

  $env:TRUEBIM_DEPLOY_HOST = $DeployHost
  $env:TRUEBIM_DEPLOY_USER = $DeployUser
  $env:TRUEBIM_DEPLOY_COMMANDS = $DeployCommands

  @'
import os
import sys
import paramiko

host = os.environ["TRUEBIM_DEPLOY_HOST"]
user = os.environ["TRUEBIM_DEPLOY_USER"]
password = os.environ["TRUEBIM_DEPLOY_PASSWORD"]
commands = os.environ["TRUEBIM_DEPLOY_COMMANDS"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, timeout=20)
try:
    stdin, stdout, stderr = client.exec_command("bash -s")
    stdin.write(commands)
    stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out:
        print(out, end="")
    if err:
        print(err, end="", file=sys.stderr)
    exit_code = stdout.channel.recv_exit_status()
    sys.exit(exit_code)
finally:
    client.close()
'@ | python -
} else {
  $DeployCommands | ssh "${DeployUser}@${DeployHost}" 'bash -s'
}
