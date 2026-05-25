$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$DeployCommands = @'
set -e
cd /opt/apps
./scripts/load-image.sh /opt/apps/images/truebim-structural-calcs.tar
./scripts/deploy-project.sh truebim-structural-calcs
'@

$DeployCommands | ssh admin_devops@192.168.22.37 'bash -s'
