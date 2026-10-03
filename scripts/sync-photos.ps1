$web = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$root = Split-Path $web -Parent
$hub = Join-Path $root "geo_kids_hub\app\src\main\assets"

$pairs = @(
  @{ Src = Join-Path $hub "japan\photos"; Dst = Join-Path $web "public\assets\japan\photos" },
  @{ Src = Join-Path $hub "kana\photos"; Dst = Join-Path $web "public\assets\kana\photos" }
)

foreach ($p in $pairs) {
  New-Item -ItemType Directory -Force -Path $p.Dst | Out-Null
  robocopy $p.Src $p.Dst /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  Write-Host "Synced $($p.Src) -> $($p.Dst)"
}
