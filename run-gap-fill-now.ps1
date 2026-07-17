$ErrorActionPreference = "Continue"
Set-Location "d:\travel-magazine"

$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:SEQUENTIAL_WIKI = "1"
$env:WIKI_DELAY_MS = "1200"
$env:RELAX_MICROSTATE = "1"

function Write-Log {
  param([string]$Message)
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
  Write-Host $line
  Add-Content -Path "gap-fill-log.txt" -Value $line -Encoding utf8
}

function Invoke-Step {
  param([string]$Label, [scriptblock]$Block)
  Write-Log "=== START: $Label ==="
  & $Block 2>&1 | ForEach-Object { Add-Content -Path "gap-fill-log.txt" -Value $_ -Encoding utf8; Write-Host $_ }
  Write-Log "=== END: $Label (exit $LASTEXITCODE) ==="
}

"" | Set-Content -Path "gap-fill-log.txt" -Encoding utf8
Write-Log "Gap-fill pipeline started"
Write-Log "NOTE: Skipping Luxembourg (no seed file)"

Invoke-Step "dedupe-all-countries (pass 1)" { node scripts/dedupe-all-countries.mjs }

Invoke-Step "finish-microstates" { node scripts/finish-microstates.mjs liechtenstein monaco north-macedonia san-marino }

$slugs = @("andorra", "austria", "estonia", "liechtenstein", "monaco", "north-macedonia", "san-marino")
foreach ($slug in $slugs) {
  Invoke-Step "import:country $slug" { npm run import:country -- $slug }
  Invoke-Step "fix-country-places $slug" { npx tsx scripts/fix-country-places.ts $slug }
}

Invoke-Step "dedupe-all-countries (pass 2)" { node scripts/dedupe-all-countries.mjs }

$secondFix = @("liechtenstein", "monaco", "north-macedonia", "san-marino", "andorra", "austria", "estonia")
foreach ($slug in $secondFix) {
  Invoke-Step "fix-country-places (2nd pass) $slug" { npx tsx scripts/fix-country-places.ts $slug }
}

Write-Log "=== START: count-places ==="
npx tsx scripts/count-places.ts Andorra Austria Estonia Liechtenstein Monaco "North Macedonia" "San Marino" 2>&1 | ForEach-Object {
  Add-Content -Path "gap-fill-log.txt" -Value $_ -Encoding utf8
  Write-Host $_
}
Write-Log "=== END: count-places ==="
Write-Log "PIPELINE_COMPLETE"
