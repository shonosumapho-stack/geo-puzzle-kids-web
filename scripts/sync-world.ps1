$ErrorActionPreference = "Stop"
$webRoot = Split-Path $PSScriptRoot -Parent
$diyRoot = Split-Path $webRoot -Parent
$src = Join-Path $diyRoot "geo_kids_hub\app\src\main\assets\world"
$dst = Join-Path $webRoot "public\assets\world"

if (-not (Test-Path $src)) {
    Write-Error "World assets not found: $src"
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

$json = @(
    "countries.json", "encyclopedia.json", "photo_credits.json",
    "world_ranks.json", "country_geo.json", "silhouettes.json"
)
foreach ($f in $json) {
    Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
}

foreach ($dir in @("photos", "flags", "maps")) {
    $from = Join-Path $src $dir
    $to = Join-Path $dst $dir
    if (Test-Path $from) {
        robocopy $from $to /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
}

Write-Host "Synced world assets to public/assets/world"
