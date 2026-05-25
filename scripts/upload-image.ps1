$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ImageTar = Join-Path $ProjectRoot 'truebim-structural-calcs.tar'

if (-not (Test-Path -LiteralPath $ImageTar)) {
  throw "Image archive not found: $ImageTar. Run scripts/export-image.ps1 first."
}

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
  $env:TRUEBIM_DEPLOY_LOCAL_FILE = $ImageTar
  $env:TRUEBIM_DEPLOY_REMOTE_FILE = '/opt/apps/images/truebim-structural-calcs.tar'

  @'
import os
import paramiko

host = os.environ["TRUEBIM_DEPLOY_HOST"]
user = os.environ["TRUEBIM_DEPLOY_USER"]
password = os.environ["TRUEBIM_DEPLOY_PASSWORD"]
local_file = os.environ["TRUEBIM_DEPLOY_LOCAL_FILE"]
remote_file = os.environ["TRUEBIM_DEPLOY_REMOTE_FILE"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, timeout=20)
try:
    sftp = client.open_sftp()
    try:
        sftp.put(local_file, remote_file)
    finally:
        sftp.close()
finally:
    client.close()
'@ | python -
} else {
  scp $ImageTar "${DeployUser}@${DeployHost}:/opt/apps/images/"
}
