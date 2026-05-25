$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ImageTar = Join-Path $ProjectRoot 'truebim-structural-calcs.tar'
Set-Location $ProjectRoot

docker save truebim-structural-calcs:latest -o $ImageTar
