param([switch]$PointsOnly)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$overlaySourceDir = Join-Path $projectRoot 'assets\maps\overlays'
$baseOutputPath = Join-Path $projectRoot 'assets\images\japan-map-play.png'
$overlayOutputDir = Join-Path $projectRoot 'assets\maps\play-overlays'
$portraitBaseOutputPath = Join-Path $projectRoot 'assets\images\japan-map-play-portrait.png'
$portraitOverlayDir = Join-Path $projectRoot 'assets\maps\play-overlays-portrait'
$pointsSourcePath = Join-Path $projectRoot 'assets\maps\map-points-official.json'
$pointsOutputPath = Join-Path $projectRoot 'src\map-points.js'

New-Item -ItemType Directory -Force -Path $overlayOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $portraitOverlayDir | Out-Null

# One crop and one uniform transform are used for the whole country. Okinawa,
# the Nansei islands, all other islands and the four main islands therefore
# keep their official relative positions and scale. No inset is constructed.
$sourceCrop = [System.Drawing.Rectangle]::new(180, 0, 1720, 1760)
$landscapeWidth = 3200
$landscapeHeight = 2000
$landscapeTarget = [System.Drawing.Rectangle]::new(654, 32, 1892, 1936)
$portraitWidth = 2000
$portraitHeight = 2800
$portraitTarget = [System.Drawing.Rectangle]::new(54, 332, 1892, 1936)

function Set-Quality([System.Drawing.Graphics]$graphics) {
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
}

function New-DisplayMap([int]$width, [int]$height, [System.Drawing.Rectangle]$target, [string]$outputPath) {
  $palette = @('#F6CE63','#79D2B0','#F4A38F','#8FC8EE','#D6B3E8','#B8D77A','#F1B56F','#76C9CF')
  $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      Set-Quality $graphics
      $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#DFF5F7'))
      1..47 | ForEach-Object {
        $code = $_.ToString('00')
        $mask = [System.Drawing.Bitmap]::new((Join-Path $overlaySourceDir "$code.png"))
        $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
        try {
          $tint = [System.Drawing.ColorTranslator]::FromHtml($palette[($_ - 1) % $palette.Count])
          $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
          $matrix.Matrix00 = 0; $matrix.Matrix11 = 0; $matrix.Matrix22 = 0
          $matrix.Matrix40 = $tint.R / 255.0
          $matrix.Matrix41 = $tint.G / 255.0
          $matrix.Matrix42 = $tint.B / 255.0
          $attributes.SetColorMatrix($matrix)
          $graphics.DrawImage($mask, $target, $sourceCrop.X, $sourceCrop.Y, $sourceCrop.Width, $sourceCrop.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        } finally {
          $attributes.Dispose()
          $mask.Dispose()
        }
      }
    } finally { $graphics.Dispose() }
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $bitmap.Dispose() }
}

function New-DisplayOverlay([string]$sourcePath, [int]$width, [int]$height, [System.Drawing.Rectangle]$target, [string]$outputPath) {
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  try {
    $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        Set-Quality $graphics
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($source, $target, $sourceCrop, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $bitmap.Dispose() }
  } finally { $source.Dispose() }
}

if (-not $PointsOnly) {
  New-DisplayMap $landscapeWidth $landscapeHeight $landscapeTarget $baseOutputPath
  New-DisplayMap $portraitWidth $portraitHeight $portraitTarget $portraitBaseOutputPath

  1..47 | ForEach-Object {
    $code = $_.ToString('00')
    $sourcePath = Join-Path $overlaySourceDir "$code.png"
    New-DisplayOverlay $sourcePath $landscapeWidth $landscapeHeight $landscapeTarget (Join-Path $overlayOutputDir "$code.png")
    New-DisplayOverlay $sourcePath $portraitWidth $portraitHeight $portraitTarget (Join-Path $portraitOverlayDir "$code.png")
  }
}

function Find-SafeMapPoint([string]$imagePath, [double]$initialX, [double]$initialY) {
  $bitmap = [System.Drawing.Bitmap]::new($imagePath)
  try {
    $originX = [math]::Round($initialX)
    $originY = [math]::Round($initialY)
    $offsets = @(@(0,0), @(-4,0), @(4,0), @(0,-4), @(0,4), @(-3,-3), @(3,-3), @(-3,3), @(3,3))
    function Test-Solid([int]$x, [int]$y) {
      foreach ($offset in $offsets) {
        $sampleX = $x + $offset[0]
        $sampleY = $y + $offset[1]
        if ($sampleX -lt 0 -or $sampleY -lt 0 -or $sampleX -ge $bitmap.Width -or $sampleY -ge $bitmap.Height) { return $false }
        if ($bitmap.GetPixel($sampleX, $sampleY).A -lt 240) { return $false }
      }
      return $true
    }
    for ($radius = 0; $radius -le 80; $radius++) {
      for ($dy = -$radius; $dy -le $radius; $dy++) {
        foreach ($dx in @(-$radius, $radius)) {
          if (Test-Solid ($originX + $dx) ($originY + $dy)) { return @(($originX + $dx), ($originY + $dy)) }
        }
      }
      for ($dx = -$radius + 1; $dx -lt $radius; $dx++) {
        foreach ($dy in @(-$radius, $radius)) {
          if (Test-Solid ($originX + $dx) ($originY + $dy)) { return @(($originX + $dx), ($originY + $dy)) }
        }
      }
    }
    # Very small islands may not contain a 9-pixel-wide opaque core after
    # rasterization. Keep their real geometry and choose the nearest fully
    # opaque pixel instead of inventing a larger land shape.
    for ($radius = 0; $radius -le 240; $radius++) {
      for ($dy = -$radius; $dy -le $radius; $dy++) {
        foreach ($dx in @(-$radius, $radius)) {
          $x=$originX+$dx; $y=$originY+$dy
          if ($x -ge 0 -and $y -ge 0 -and $x -lt $bitmap.Width -and $y -lt $bitmap.Height -and $bitmap.GetPixel($x,$y).A -ge 240) { return @($x,$y) }
        }
      }
      for ($dx = -$radius + 1; $dx -lt $radius; $dx++) {
        foreach ($dy in @(-$radius, $radius)) {
          $x=$originX+$dx; $y=$originY+$dy
          if ($x -ge 0 -and $y -ge 0 -and $x -lt $bitmap.Width -and $y -lt $bitmap.Height -and $bitmap.GetPixel($x,$y).A -ge 240) { return @($x,$y) }
        }
      }
    }
    throw "No solid pin point found near $imagePath"
  } finally { $bitmap.Dispose() }
}

$officialPoints = Get-Content -Raw $pointsSourcePath | ConvertFrom-Json
$displayPoints = [ordered]@{}
$portraitPoints = [ordered]@{}
foreach ($property in $officialPoints.PSObject.Properties) {
  # Official points are percentages of the 2400 x 2000 source masks.
  $sourceX = [double]$property.Value.x * 24
  $sourceY = [double]$property.Value.y * 20
  $displayX = $landscapeTarget.Left + ($sourceX - $sourceCrop.Left) * $landscapeTarget.Width / $sourceCrop.Width
  $displayY = $landscapeTarget.Top + ($sourceY - $sourceCrop.Top) * $landscapeTarget.Height / $sourceCrop.Height
  $portraitX = $portraitTarget.Left + ($sourceX - $sourceCrop.Left) * $portraitTarget.Width / $sourceCrop.Width
  $portraitY = $portraitTarget.Top + ($sourceY - $sourceCrop.Top) * $portraitTarget.Height / $sourceCrop.Height
  $displaySafe = Find-SafeMapPoint (Join-Path $overlayOutputDir "$($property.Name).png") $displayX $displayY
  $portraitSafe = Find-SafeMapPoint (Join-Path $portraitOverlayDir "$($property.Name).png") $portraitX $portraitY
  $displayPoints[$property.Name] = [ordered]@{
    x = [math]::Round($displaySafe[0] / $landscapeWidth * 100, 3)
    y = [math]::Round($displaySafe[1] / $landscapeHeight * 100, 3)
  }
  $portraitPoints[$property.Name] = [ordered]@{
    x = [math]::Round($portraitSafe[0] / $portraitWidth * 100, 3)
    y = [math]::Round($portraitSafe[1] / $portraitHeight * 100, 3)
  }
}

$pointsJson = $displayPoints | ConvertTo-Json -Depth 4
$portraitPointsJson = $portraitPoints | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($pointsOutputPath, "window.PREFECTURE_MAP_POINTS = $pointsJson;`nwindow.PREFECTURE_MAP_POINTS_PORTRAIT = $portraitPointsJson;`n", [System.Text.UTF8Encoding]::new($false))

Write-Output 'Created one-transform display maps and 47 aligned overlays without an Okinawa inset.'
