# Update-CharacterText.ps1
# Copies each character's backstory and recruitment-assessment .txt files from
# D:\Outgunned\Characters\<Name>\ into this website folder (as UTF-8).
# Run it again any time you edit a text file.
#
#   powershell -ExecutionPolicy Bypass -File .\Update-CharacterText.ps1

$source = 'D:\Outgunned\Characters'
$site   = Join-Path $PSScriptRoot 'assets\characters'

$map = @{
  'Arthur Blackwood'                   = 'arthur-blackwood'
  'Captain Jacques Moreau'             = 'jacques-moreau'
  'Edward Pembroke'                    = 'edward-pembroke'
  'Evelyn Evie Sullivan'               = 'evie-sullivan'
  'Josephine Jo Mercer'                = 'jo-mercer'
  'Major Charles Edmund Hargreaves'    = 'charles-hargreaves'
  'Margaret Ashford'                   = 'margaret-ashford'
  "Shenanigans O'Lier"                 = 'shenanigans-olier'
  'Sophie Whitfield'                   = 'sophie-whitfield'
  'Walter Pritchard'                   = 'walter-pritchard'
}

function Read-Text($path) {
  $b = [IO.File]::ReadAllBytes($path)
  try { return (New-Object Text.UTF8Encoding($false, $true)).GetString($b) }      # valid UTF-8
  catch { return [Text.Encoding]::GetEncoding(1252).GetString($b) }               # Notepad "ANSI"
}

$utf8 = New-Object Text.UTF8Encoding($false)
$copied = 0

foreach ($name in $map.Keys) {
  $slug = $map[$name]
  $dest = Join-Path $site $slug
  foreach ($job in @(@('Backstory', 'backstory.txt'), @('Recruitment Assessment', 'recruitment.txt'))) {
    $dir = Join-Path (Join-Path $source $name) $job[0]
    if (-not (Test-Path -LiteralPath $dir)) { continue }
    $file = Get-ChildItem -LiteralPath $dir -Filter *.txt -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($file) {
      [IO.File]::WriteAllText((Join-Path $dest $job[1]), (Read-Text $file.FullName), $utf8)
      Write-Host ("  {0}: {1} -> {2}" -f $name, $job[0], $job[1])
      $copied++
    } else {
      Write-Host ("  {0}: no .txt found in {1}" -f $name, $job[0]) -ForegroundColor DarkYellow
    }
  }
}
Write-Host ""
Write-Host "Copied $copied text file(s)." -ForegroundColor Green
