$ErrorActionPreference = 'Continue'
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$DeployHost = $env:TRUEBIM_DEPLOY_HOST
if (-not $DeployHost) {
  $DeployHost = '192.168.22.37'
}

$DeployUser = $env:TRUEBIM_DEPLOY_USER
if (-not $DeployUser) {
  $DeployUser = 'admin_devops'
}

$OfficeBaseUrl = $env:TRUEBIM_OFFICE_BASE_URL
if (-not $OfficeBaseUrl) {
  $OfficeBaseUrl = "http://$DeployHost"
}

$Checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][bool]$Passed,
    [Parameter(Mandatory = $true)][string]$Details,
    [Parameter(Mandatory = $true)][string]$Hint,
    [bool]$Critical = $true
  )

  $Checks.Add([pscustomobject]@{
    Name = $Name
    Passed = $Passed
    Details = $Details
    Hint = $Hint
    Critical = $Critical
  }) | Out-Null
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [string[]]$Arguments = @(),
    [int]$TimeoutSeconds = 20
  )

  try {
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo.FileName = $FilePath
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.CreateNoWindow = $true
    $process.StartInfo.Arguments = ($Arguments | ForEach-Object { ConvertTo-ProcessArgument $_ }) -join ' '

    [void]$process.Start()

    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try {
        $process.Kill($true)
      } catch {
        $process.Kill()
      }

      return [pscustomobject]@{
        ExitCode = 124
        Output = ''
        Error = "Command timed out after $TimeoutSeconds seconds."
      }
    }

    return [pscustomobject]@{
      ExitCode = $process.ExitCode
      Output = $process.StandardOutput.ReadToEnd()
      Error = $process.StandardError.ReadToEnd()
    }
  } catch {
    return [pscustomobject]@{
      ExitCode = 1
      Output = ''
      Error = $_.Exception.Message
    }
  }
}

function ConvertTo-ProcessArgument {
  param([Parameter(Mandatory = $true)][string]$Argument)

  if ($Argument -notmatch '[\s"]') {
    return $Argument
  }

  return '"' + ($Argument -replace '\\', '\\' -replace '"', '\"') + '"'
}

function Invoke-RemoteCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [int]$TimeoutSeconds = 20
  )

  $target = "${DeployUser}@${DeployHost}"

  return Invoke-CheckedCommand `
    -FilePath 'ssh' `
    -Arguments @(
      '-o', 'BatchMode=yes',
      '-o', 'ConnectTimeout=8',
      '-o', 'StrictHostKeyChecking=accept-new',
      $target,
      "bash -lc '$Command'"
    ) `
    -TimeoutSeconds $TimeoutSeconds
}

function Format-CommandFailure {
  param([object]$Result)

  $message = (($Result.Error, $Result.Output) -join "`n").Trim()
  if (-not $message) {
    $message = "exit code $($Result.ExitCode)"
  }

  return ($message -replace '\s+', ' ').Trim()
}

function Invoke-OfficeHttpRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSeconds = 10
  )

  $curlCommand = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curlCommand) {
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
      $curlResult = Invoke-CheckedCommand `
        -FilePath $curlCommand.Source `
        -Arguments @(
          '--silent',
          '--show-error',
          '--location',
          '--noproxy',
          '*',
          '--max-time',
          "$TimeoutSeconds",
          '--output',
          $tempFile,
          '--write-out',
          '__HTTP_STATUS__:%{http_code}',
          $Url
        ) `
        -TimeoutSeconds ($TimeoutSeconds + 5)

      $statusMatch = [regex]::Match($curlResult.Output.Trim(), '__HTTP_STATUS__:(\d{3})$')

      if ($curlResult.ExitCode -ne 0 -or -not $statusMatch.Success) {
        throw "curl.exe failed for ${Url}: $(Format-CommandFailure $curlResult)"
      }

      $statusCode = [int]$statusMatch.Groups[1].Value
      $content = Get-Content -Raw -LiteralPath $tempFile

      return [pscustomobject]@{
        StatusCode = $statusCode
        Content = $content
      }
    } finally {
      Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
    }
  }

  return Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
}

Write-Host "Deploy precheck for truebim-structural-calcs"
Write-Host "Target: ${DeployUser}@${DeployHost}"
Write-Host "Office URL: $OfficeBaseUrl"
Write-Host ''

$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
Add-Check `
  -Name 'Docker CLI available' `
  -Passed ([bool]$dockerCommand) `
  -Details ($(if ($dockerCommand) { $dockerCommand.Source } else { 'docker command not found' })) `
  -Hint 'Install Docker Desktop or make sure docker.exe is available on PATH.'

$dockerInfoPassed = $false
if ($dockerCommand) {
  $dockerInfo = Invoke-CheckedCommand -FilePath 'docker' -Arguments @('info') -TimeoutSeconds 20
  $dockerInfoPassed = $dockerInfo.ExitCode -eq 0
  Add-Check `
    -Name 'Docker Desktop engine responds' `
    -Passed $dockerInfoPassed `
    -Details ($(if ($dockerInfoPassed) { 'docker info completed successfully' } else { Format-CommandFailure $dockerInfo })) `
    -Hint 'Docker Desktop engine is not reachable. Start Docker Desktop and retry. If it stays stuck, run wsl --shutdown, restart Docker Desktop, then rerun deploy-precheck.'

  $dockerVersion = Invoke-CheckedCommand -FilePath 'docker' -Arguments @('version', '--format', '{{.Server.Version}}') -TimeoutSeconds 20
  Add-Check `
    -Name 'Docker daemon reachable' `
    -Passed ($dockerVersion.ExitCode -eq 0) `
    -Details ($(if ($dockerVersion.ExitCode -eq 0) { "server version $($dockerVersion.Output.Trim())" } else { Format-CommandFailure $dockerVersion })) `
    -Hint 'Cannot connect to Docker daemon. Start Docker Desktop and confirm docker info works before running full deploy.'
} else {
  Add-Check `
    -Name 'Docker Desktop engine responds' `
    -Passed $false `
    -Details 'skipped because Docker CLI is unavailable' `
    -Hint 'Install Docker Desktop or fix PATH, then rerun deploy-precheck.'
  Add-Check `
    -Name 'Docker daemon reachable' `
    -Passed $false `
    -Details 'skipped because Docker CLI is unavailable' `
    -Hint 'Install Docker Desktop or fix PATH, then rerun deploy-precheck.'
}

$sshCommand = Get-Command ssh -ErrorAction SilentlyContinue
if ($sshCommand) {
  $sshCheck = Invoke-RemoteCommand -Command 'true' -TimeoutSeconds 15
  Add-Check `
    -Name "SSH access to ${DeployUser}@${DeployHost}" `
    -Passed ($sshCheck.ExitCode -eq 0) `
    -Details ($(if ($sshCheck.ExitCode -eq 0) { 'ssh command completed successfully' } else { Format-CommandFailure $sshCheck })) `
    -Hint 'Check SSH key access, VPN/network reachability, username, host, and known_hosts trust.'

  $optAppsCheck = Invoke-RemoteCommand -Command 'test -d /opt/apps && test -x /opt/apps' -TimeoutSeconds 15
  Add-Check `
    -Name 'Server /opt/apps accessible' `
    -Passed ($optAppsCheck.ExitCode -eq 0) `
    -Details ($(if ($optAppsCheck.ExitCode -eq 0) { '/opt/apps exists and is accessible' } else { Format-CommandFailure $optAppsCheck })) `
    -Hint 'Create /opt/apps or fix permissions for the deploy user on the office server.'

  $remoteDockerCheck = Invoke-RemoteCommand -Command 'docker info >/dev/null' -TimeoutSeconds 20
  Add-Check `
    -Name 'Remote docker works' `
    -Passed ($remoteDockerCheck.ExitCode -eq 0) `
    -Details ($(if ($remoteDockerCheck.ExitCode -eq 0) { 'remote docker info completed successfully' } else { Format-CommandFailure $remoteDockerCheck })) `
    -Hint 'On the server, start Docker and confirm the deploy user can run docker commands.'

  $projectDirCheck = Invoke-RemoteCommand -Command 'test -d /opt/apps/projects/truebim-structural-calcs' -TimeoutSeconds 15
  Add-Check `
    -Name 'Remote project dir exists' `
    -Passed ($projectDirCheck.ExitCode -eq 0) `
    -Details ($(if ($projectDirCheck.ExitCode -eq 0) { '/opt/apps/projects/truebim-structural-calcs exists' } else { Format-CommandFailure $projectDirCheck })) `
    -Hint 'Create the project directory from docs/deployment.md first server setup.'

  $nginxCheck = Invoke-RemoteCommand -Command 'systemctl is-active --quiet nginx' -TimeoutSeconds 15
  Add-Check `
    -Name 'Nginx active on server' `
    -Passed ($nginxCheck.ExitCode -eq 0) `
    -Details ($(if ($nginxCheck.ExitCode -eq 0) { 'nginx service is active' } else { Format-CommandFailure $nginxCheck })) `
    -Hint 'On the server, run sudo nginx -t and sudo systemctl status nginx --no-pager -l.'
} else {
  Add-Check `
    -Name "SSH access to ${DeployUser}@${DeployHost}" `
    -Passed $false `
    -Details 'ssh command not found' `
    -Hint 'Install or enable OpenSSH Client on Windows.'
  Add-Check -Name 'Server /opt/apps accessible' -Passed $false -Details 'skipped because SSH is unavailable' -Hint 'Fix SSH access first.'
  Add-Check -Name 'Remote docker works' -Passed $false -Details 'skipped because SSH is unavailable' -Hint 'Fix SSH access first.'
  Add-Check -Name 'Remote project dir exists' -Passed $false -Details 'skipped because SSH is unavailable' -Hint 'Fix SSH access first.'
  Add-Check -Name 'Nginx active on server' -Passed $false -Details 'skipped because SSH is unavailable' -Hint 'Fix SSH access first.'
}

$officeRoutes = @('/', '/review', '/validation-session', '/diagnostics')
foreach ($route in $officeRoutes) {
  $url = "$OfficeBaseUrl$route"
  try {
    $response = Invoke-OfficeHttpRequest -Url $url -TimeoutSeconds 10
    Add-Check `
      -Name "Office URL $route responds" `
      -Passed ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) `
      -Details "HTTP $($response.StatusCode), $($response.Content.Length) bytes" `
      -Hint 'Check host nginx routing and the app container if this URL does not respond.'
  } catch {
    Add-Check `
      -Name "Office URL $route responds" `
      -Passed $false `
      -Details $_.Exception.Message `
      -Hint 'Check network access, host nginx routing, and the app container on the office server.'
  }
}

$currentCommit = ''
try {
  $currentCommit = (git -C $ProjectRoot rev-parse --short HEAD).Trim()
} catch {
  $currentCommit = ''
}

if ($currentCommit) {
  try {
    $index = (Invoke-OfficeHttpRequest -Url "$OfficeBaseUrl/" -TimeoutSeconds 10).Content
    $assetMatches = [regex]::Matches($index, 'src="([^"]+\.js)"')
    $commitFound = $false

    foreach ($match in $assetMatches) {
      $assetPath = $match.Groups[1].Value
      $assetUrl = if ($assetPath.StartsWith('http')) { $assetPath } else { "$OfficeBaseUrl$assetPath" }
      $assetContent = (Invoke-OfficeHttpRequest -Url $assetUrl -TimeoutSeconds 10).Content
      if ($assetContent -match [regex]::Escape($currentCommit)) {
        $commitFound = $true
        break
      }
    }

    Add-Check `
      -Name 'Remote serves current commit' `
      -Passed $commitFound `
      -Details ($(if ($commitFound) { "Remote server appears to already serve current commit $currentCommit." } else { "Current commit $currentCommit not found in served JS assets." })) `
      -Hint 'This is informational. If false after deploy, confirm build args and browser cache.' `
      -Critical $false
  } catch {
    Add-Check `
      -Name 'Remote serves current commit' `
      -Passed $false `
      -Details $_.Exception.Message `
      -Hint 'This is informational. Check office URLs manually if local Docker is broken.' `
      -Critical $false
  }
}

Write-Host 'Precheck results:'
foreach ($check in $Checks) {
  $status = if ($check.Passed) { 'PASS' } else { 'FAIL' }
  $color = if ($check.Passed) { 'Green' } else { 'Red' }
  Write-Host "[$status] $($check.Name) - $($check.Details)" -ForegroundColor $color
  if (-not $check.Passed) {
    Write-Host "       hint: $($check.Hint)" -ForegroundColor Yellow
  }
}

$failedCriticalChecks = @($Checks | Where-Object { -not $_.Passed -and $_.Critical })
$localDockerFailed = @($Checks | Where-Object {
  -not $_.Passed -and (
    $_.Name -eq 'Docker Desktop engine responds' -or
    $_.Name -eq 'Docker daemon reachable'
  )
})

Write-Host ''
if ($localDockerFailed.Count -gt 0) {
  Write-Host 'Docker Desktop engine is not reachable. Start Docker Desktop and retry.' -ForegroundColor Yellow
}

if ($failedCriticalChecks.Count -gt 0) {
  Write-Host "Precheck failed: $($failedCriticalChecks.Count) critical check(s) failed." -ForegroundColor Red
  exit 1
}

Write-Host 'Precheck passed: deploy prerequisites are available.' -ForegroundColor Green
exit 0
