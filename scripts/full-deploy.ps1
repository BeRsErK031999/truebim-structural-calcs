$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Precheck = Join-Path $PSScriptRoot 'deploy-precheck.ps1'
& $Precheck
$PrecheckExitCode = $LASTEXITCODE
if ($PrecheckExitCode -ne 0) {
  Write-Host ''
  Write-Host 'Full deploy stopped before build because deploy precheck failed.' -ForegroundColor Yellow
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker Desktop engine is not reachable. Start Docker Desktop and retry.' -ForegroundColor Yellow
  }
  exit $PrecheckExitCode
}

& (Join-Path $PSScriptRoot 'build-image.ps1')
& (Join-Path $PSScriptRoot 'export-image.ps1')
& (Join-Path $PSScriptRoot 'upload-image.ps1')
& (Join-Path $PSScriptRoot 'deploy.ps1')
