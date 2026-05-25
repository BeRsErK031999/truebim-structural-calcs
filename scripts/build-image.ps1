$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $ProjectRoot

$PackageJson = Get-Content -Raw -LiteralPath (Join-Path $ProjectRoot 'package.json') | ConvertFrom-Json
$GitCommit = git rev-parse --short HEAD
$BuildTime = (Get-Date).ToUniversalTime().ToString('o')

docker build `
  --build-arg "VITE_APP_VERSION=$($PackageJson.version)" `
  --build-arg "VITE_GIT_COMMIT=$GitCommit" `
  --build-arg "VITE_BUILD_TIME=$BuildTime" `
  --build-arg "VITE_APP_ENV=production" `
  -t truebim-structural-calcs:latest .
