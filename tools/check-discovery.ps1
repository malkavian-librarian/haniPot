param([int]$Port=18789)
$ErrorActionPreference='Stop'
if($Port -notin @(18789,18890)){throw 'Discovery restricted to configured local fixture ports'}
$root=Split-Path -Parent $PSScriptRoot
$bin=Join-Path $root 'artifacts\scanners'
$output=Join-Path $root "artifacts\discovery\$Port"
New-Item -ItemType Directory -Force -Path $output | Out-Null
$nmap=(Get-ChildItem (Join-Path $bin 'nmap') -Recurse -File -Filter nmap.exe | Select-Object -First 1).FullName
if(-not $nmap){throw 'Run tools/prepare-scanners.ps1 first'}
$httpx=Join-Path $bin 'httpx\httpx.exe';$nuclei=Join-Path $bin 'nuclei\nuclei.exe'
& $nmap --version | Out-File (Join-Path $output 'nmap-version.txt')
& $nmap --unprivileged -sT -Pn -sV --version-all -p $Port --script '+http-title,+http-headers' -oA (Join-Path $output 'nmap') 127.0.0.1
if($LASTEXITCODE -ne 0){throw 'Nmap failed'}
& $httpx -version
& $httpx -u "http://127.0.0.1:$Port" -sc -title -server -json -duc -o (Join-Path $output 'httpx.jsonl')
if($LASTEXITCODE -ne 0){throw 'httpx failed'}
& $nuclei -version
& $nuclei -u "http://127.0.0.1:$Port" -t (Join-Path $root 'tests\fixtures\scanners\openclaw-control-detect.yaml') -duc -ni -no-stdin -jsonl -o (Join-Path $output 'nuclei.jsonl')
if($LASTEXITCODE -ne 0){throw 'Nuclei failed'}
& node (Join-Path $root 'tools\probe-gateway.mjs') --url "ws://127.0.0.1:$Port" --out (Join-Path $output 'gateway.json') --reference-report (Join-Path $root 'tests\fixtures\openclaw\reference.json')
if($LASTEXITCODE -ne 0){throw 'Independent gateway probe failed'}
& node (Join-Path $root 'tools\verify-discovery.mjs') $output
if($LASTEXITCODE -ne 0){throw 'Discovery findings verification failed'}
