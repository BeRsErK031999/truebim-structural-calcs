$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $ProjectRoot

docker build -t truebim-structural-calcs:latest .
