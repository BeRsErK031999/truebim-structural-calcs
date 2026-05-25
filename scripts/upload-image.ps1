$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ImageTar = Join-Path $ProjectRoot 'truebim-structural-calcs.tar'

if (-not (Test-Path -LiteralPath $ImageTar)) {
  throw "Image archive not found: $ImageTar. Run scripts/export-image.ps1 first."
}

scp $ImageTar admin_devops@192.168.22.37:/opt/apps/images/
