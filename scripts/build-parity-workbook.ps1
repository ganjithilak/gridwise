# Writes the seed cases into test/fixtures/excel-parity.xlsx using real desktop Excel,
# so Excel itself computes every expected result.
#
# Safe to re-run: rows already in the workbook are left alone, and only seed cases
# that aren't there yet are appended. Rows you add by hand in Excel are never touched.
#
# Layout of each sheet:  A1:F8 data block | H note | I seed text | J formula (Excel's result)
param(
  [string]$Seed = (Join-Path $PSScriptRoot '..\test\fixtures\parity-seed.json'),
  [string]$Out = (Join-Path $PSScriptRoot '..\test\fixtures\excel-parity.xlsx')
)

$ErrorActionPreference = 'Stop'
$seedData = Get-Content -Raw -Encoding UTF8 $Seed | ConvertFrom-Json
$outPath = [System.IO.Path]::GetFullPath($Out)
$isNew = -not (Test-Path $outPath)
$missing = [Type]::Missing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$version = $excel.Version
$added = 0
$rejected = @()

try {
  if ($isNew) { $wb = $excel.Workbooks.Add() } else { $wb = $excel.Workbooks.Open($outPath) }

  foreach ($s in $seedData.sheets) {
    $ws = $null
    foreach ($w in $wb.Worksheets) { if ($w.Name -eq $s.name) { $ws = $w } }

    if (-not $ws) {
      $ws = $wb.Worksheets.Add($missing, $wb.Worksheets.Item($wb.Worksheets.Count))
      $ws.Name = $s.name
      for ($r = 0; $r -lt $s.data.Count; $r++) {
        $row = $s.data[$r]
        for ($c = 0; $c -lt $row.Count; $c++) {
          $v = $row[$c]
          if ($null -eq $v) { continue }
          $cell = $ws.Cells.Item($r + 1, $c + 1)
          if ($v -is [string] -and $v.StartsWith('=')) { $cell.Formula = $v }
          elseif ($v -is [string] -and $v.StartsWith("'")) { $cell.NumberFormat = '@'; $cell.Value2 = $v.Substring(1) }
          elseif ($v -is [string]) { $cell.Value2 = $v }
          elseif ($v -is [bool]) { $cell.Value2 = $v.ToString().ToUpper() }
          else { $cell.Value2 = [double]$v }
        }
      }
      $ws.Cells.Item(1, 8).Value2 = 'note'
      $ws.Cells.Item(1, 9).Value2 = 'seed'
      $ws.Cells.Item(1, 10).Value2 = 'formula'
      $ws.Columns.Item(9).NumberFormat = '@'
    }

    # Find what is already there.
    $existing = @{}
    $last = 1
    for ($r = 2; $r -le 2000; $r++) {
      $seedText = [string]$ws.Cells.Item($r, 9).Value2
      $hasFormula = [bool]$ws.Cells.Item($r, 10).HasFormula
      if ($seedText) { $existing[$seedText] = $true }
      if ($seedText -or $hasFormula) { $last = $r }
      elseif ($r -gt $last + 20) { break }
    }

    foreach ($case in $s.cases) {
      if ($existing.ContainsKey($case.f)) { continue }
      $r = $last + 1
      try {
        $ws.Cells.Item($r, 10).Formula = $case.f
      } catch {
        $rejected += "$($s.name): $($case.f)"
        continue
      }
      $ws.Cells.Item($r, 8).Value2 = [string]$case.note
      $ws.Cells.Item($r, 9).Value2 = [string]$case.f
      $last = $r
      $added++
    }
    $ws.Columns.Item(8).AutoFit() | Out-Null
    $ws.Columns.Item(9).AutoFit() | Out-Null
    $ws.Columns.Item(10).AutoFit() | Out-Null
  }

  if ($isNew) {
    $names = @($seedData.sheets | ForEach-Object { $_.name })
    $extra = @()
    foreach ($w in $wb.Worksheets) { if ($names -notcontains $w.Name) { $extra += $w } }
    foreach ($w in $extra) { $w.Delete() }
    $dir = Split-Path $outPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    $wb.SaveAs($outPath, 51)
  } else {
    $wb.Save()
  }
  $wb.Close($false)
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

"Excel ${version}: added $added case(s) to $outPath"
if ($rejected.Count -gt 0) {
  'Excel refused these formulas:'
  $rejected | ForEach-Object { "  $_" }
}
