$ErrorActionPreference='Stop'
$scannerRoot=Join-Path (Split-Path -Parent $PSScriptRoot) 'artifacts\scanners'
New-Item -ItemType Directory -Force -Path $scannerRoot | Out-Null
$manifest=@()
foreach($tool in @(@{Name='httpx';Version='1.12.0'},@{Name='nuclei';Version='3.11.1'})) {
  $name=$tool.Name; $version=$tool.Version
  $asset="${name}_${version}_windows_amd64.zip"
  $base="https://github.com/projectdiscovery/$name/releases/download/v$version"
  $zip=Join-Path $scannerRoot $asset
  if(-not (Test-Path -LiteralPath $zip)){Invoke-WebRequest -UseBasicParsing "$base/$asset" -OutFile $zip}
  $checksumResponse=(Invoke-WebRequest -UseBasicParsing "$base/${name}_${version}_checksums.txt").Content
  $checksums=if($checksumResponse -is [byte[]]){[Text.Encoding]::UTF8.GetString($checksumResponse)}else{[string]$checksumResponse}
  $line=($checksums -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match ([regex]::Escape($asset)+'$') } | Select-Object -First 1)
  if(-not $line){throw "Missing official checksum for $asset"}
  $expected=($line -split '\s+')[0].ToLowerInvariant()
  $actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant()
  if($actual -ne $expected){throw "Checksum mismatch for $asset"}
  $destination=Join-Path $scannerRoot $name
  Expand-Archive -LiteralPath $zip -DestinationPath $destination -Force
  $manifest+=@{tool=$name;version=$version;url="$base/$asset";sha256=$actual;verification='official SHA256 checksum'}
}
$nmapZip=Join-Path $scannerRoot 'nmap-7.92-win32.zip'
if(-not (Test-Path -LiteralPath $nmapZip)){Invoke-WebRequest -UseBasicParsing 'https://nmap.org/dist/nmap-7.92-win32.zip' -OutFile $nmapZip}
Expand-Archive -LiteralPath $nmapZip -DestinationPath (Join-Path $scannerRoot 'nmap') -Force
$manifest+=@{tool='nmap';version='7.92';url='https://nmap.org/dist/nmap-7.92-win32.zip';sha256=(Get-FileHash $nmapZip -Algorithm SHA256).Hash.ToLowerInvariant();verification='official HTTPS distribution; local hash recorded; no PGP verification'}
[IO.File]::WriteAllText((Join-Path $scannerRoot 'provenance.json'),($manifest|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
