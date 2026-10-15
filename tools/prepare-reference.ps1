$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$referenceRoot = Join-Path $repoRoot 'artifacts\reference'
New-Item -ItemType Directory -Force -Path $referenceRoot | Out-Null
$archive = Join-Path $referenceRoot 'source.tar.gz'
$commit = '77e703c69b07a236c2f0962bd195e03aae1b8da0'
$url = "https://github.com/openclaw/openclaw/archive/$commit.tar.gz"
if (-not (Test-Path -LiteralPath $archive)) { Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $archive }
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
$source = Join-Path $referenceRoot "openclaw-$commit"
if (-not (Test-Path -LiteralPath (Join-Path $source '.hanipot-extracted'))) {
  & tar.exe -xf $archive -C $referenceRoot --exclude '*/CLAUDE.md'
  if ($LASTEXITCODE -ne 0) { throw 'Reference archive extraction failed' }
  Set-Content -LiteralPath (Join-Path $source '.hanipot-extracted') -Value $commit
}
$json = @{ commit=$commit; archiveUrl=$url; archiveSha256=$hash; sourceDirectory=$source; omittedWindowsSymlink='CLAUDE.md -> AGENTS.md'; preparedAt=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json
[System.IO.File]::WriteAllText((Join-Path $referenceRoot 'provenance.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Prepared pinned reference $commit (sha256 $hash)"
