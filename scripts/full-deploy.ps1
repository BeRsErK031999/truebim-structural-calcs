$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

& (Join-Path $PSScriptRoot 'build-image.ps1')
& (Join-Path $PSScriptRoot 'export-image.ps1')
& (Join-Path $PSScriptRoot 'upload-image.ps1')
& (Join-Path $PSScriptRoot 'deploy.ps1')
