param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$baseSourcePath = Join-Path $projectRoot 'assets\images\japan-map.png'
$overlaySourceDir = Join-Path $projectRoot 'assets\maps\overlays'
$baseOutputPath = Join-Path $projectRoot 'assets\images\japan-map-play.png'
$overlayOutputDir = Join-Path $projectRoot 'assets\maps\play-overlays'
$portraitBaseOutputPath = Join-Path $projectRoot 'assets\images\japan-map-play-portrait.png'
$portraitOverlayOutputDir = Join-Path $projectRoot 'assets\maps\play-overlays-portrait'
$pointsSourcePath = Join-Path $projectRoot 'assets\maps\map-points-official.json'
$pointsOutputPath = Join-Path $projectRoot 'src\map-points.js'
New-Item -ItemType Directory -Force -Path $overlayOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $portraitOverlayOutputDir | Out-Null

$canvasWidth = 3200
$canvasHeight = 2000

# Source rectangles use the official-data-derived raster. The main archipelago
# is enlarged without changing its geometry. Okinawa and the Nansei islands are
# copied to the lower left so they remain large enough to learn and tap.
$mainSourceBase = [System.Drawing.Rectangle]::new(440, 0, 1480, 1300)
$mainSourceOverlay = [System.Drawing.Rectangle]::new(440, 0, 1480, 1300)
$mainTarget = [System.Drawing.Rectangle]::new(1220, 36, 1940, 1704)
$islandSourceBase = [System.Drawing.Rectangle]::new(140, 1360, 720, 400)
$islandSourceOverlay = [System.Drawing.Rectangle]::new(140, 1360, 720, 400)
$islandTarget = [System.Drawing.Rectangle]::new(0, 1280, 1200, 666)
$portraitWidth = 2000
$portraitHeight = 2800
$portraitMainTarget = [System.Drawing.Rectangle]::new(70, 100, 1860, 1634)
$portraitIslandTarget = [System.Drawing.Rectangle]::new(40, 1880, 1600, 888)

function Set-Quality([System.Drawing.Graphics]$graphics) {
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
}

$baseSource = [System.Drawing.Bitmap]::new($baseSourcePath)
try {
  $baseOutput = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($baseOutput)
    try {
      Set-Quality $graphics
      $graphics.Clear($baseSource.GetPixel(100, 100))
      $graphics.DrawImage($baseSource, $mainTarget, $mainSourceBase, [System.Drawing.GraphicsUnit]::Pixel)

      $graphics.DrawImage($baseSource, $islandTarget, $islandSourceBase, [System.Drawing.GraphicsUnit]::Pixel)

      $labelFont = [System.Drawing.Font]::new('Yu Gothic UI', 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $navyBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 36, 72, 93))
      try {
        $insetLabel = -join @([char]0x6C96,[char]0x7E04,[char]0x770C)
        $graphics.DrawString($insetLabel, $labelFont, $navyBrush, 48, 1276)
      } finally {
        $labelFont.Dispose()
        $navyBrush.Dispose()
      }
    } finally {
      $graphics.Dispose()
    }
    $baseOutput.Save($baseOutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $baseOutput.Dispose()
  }
} finally {
  $baseSource.Dispose()
}

$baseSource = [System.Drawing.Bitmap]::new($baseSourcePath)
try {
  $portraitOutput = [System.Drawing.Bitmap]::new($portraitWidth, $portraitHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($portraitOutput)
    try {
      Set-Quality $graphics
      $graphics.Clear($baseSource.GetPixel(100, 100))
      $graphics.DrawImage($baseSource, $portraitMainTarget, $mainSourceBase, [System.Drawing.GraphicsUnit]::Pixel)
      $graphics.DrawImage($baseSource, $portraitIslandTarget, $islandSourceBase, [System.Drawing.GraphicsUnit]::Pixel)
      $labelFont = [System.Drawing.Font]::new('Yu Gothic UI', 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $navyBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 36, 72, 93))
      try { $graphics.DrawString((-join @([char]0x6C96,[char]0x7E04,[char]0x770C)), $labelFont, $navyBrush, 56, 1980) }
      finally { $labelFont.Dispose(); $navyBrush.Dispose() }
    } finally { $graphics.Dispose() }
    $portraitOutput.Save($portraitBaseOutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $portraitOutput.Dispose() }
} finally { $baseSource.Dispose() }

1..47 | ForEach-Object {
  $code = $_.ToString('00')
  $sourcePath = Join-Path $overlaySourceDir "$code.png"
  $outputPath = Join-Path $overlayOutputDir "$code.png"
  $portraitOutputPath = Join-Path $portraitOverlayOutputDir "$code.png"
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  try {
    $output = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($output)
      try {
        Set-Quality $graphics
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($source, $mainTarget, $mainSourceOverlay, [System.Drawing.GraphicsUnit]::Pixel)
        $graphics.DrawImage($source, $islandTarget, $islandSourceOverlay, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }
      $output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $output.Dispose()
    }
    $portraitOutput = [System.Drawing.Bitmap]::new($portraitWidth, $portraitHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($portraitOutput)
      try {
        Set-Quality $graphics
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($source, $portraitMainTarget, $mainSourceOverlay, [System.Drawing.GraphicsUnit]::Pixel)
        $graphics.DrawImage($source, $portraitIslandTarget, $islandSourceOverlay, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }
      $portraitOutput.Save($portraitOutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $portraitOutput.Dispose() }
  } finally {
    $source.Dispose()
  }
}

# Rebuild the visible base from the exact same 47 alpha masks used for the
# answer overlays. This guarantees pixel-for-pixel alignment after cropping,
# scaling, and the Okinawa layout change.
function New-BaseFromMasks(
  [int]$width,
  [int]$height,
  [System.Drawing.Rectangle]$mainDestination,
  [System.Drawing.Rectangle]$islandDestination,
  [string]$outputPath,
  [bool]$portrait
) {
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
          $graphics.DrawImage($mask, $mainDestination, $mainSourceOverlay.X, $mainSourceOverlay.Y, $mainSourceOverlay.Width, $mainSourceOverlay.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
          $graphics.DrawImage($mask, $islandDestination, $islandSourceOverlay.X, $islandSourceOverlay.Y, $islandSourceOverlay.Width, $islandSourceOverlay.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        } finally {
          $attributes.Dispose()
          $mask.Dispose()
        }
      }
      $labelFont = [System.Drawing.Font]::new('Yu Gothic UI', $(if ($portrait) { 44 } else { 40 }), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $navyBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 36, 72, 93))
      try {
        $labelX = if ($portrait) { 56 } else { 48 }
        $labelY = if ($portrait) { 1800 } else { 1200 }
        $graphics.DrawString((-join @([char]0x6C96,[char]0x7E04,[char]0x770C)), $labelFont, $navyBrush, $labelX, $labelY)
      } finally {
        $labelFont.Dispose()
        $navyBrush.Dispose()
      }
      $separator = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(155, 55, 99, 122), $(if ($portrait) { 8 } else { 6 }))
      try {
        if ($portrait) {
          $graphics.DrawLine($separator, 36, 1860, 1680, 1860)
          $graphics.DrawLine($separator, 1680, 1860, 1680, 2770)
        } else {
          $graphics.DrawLine($separator, 28, 1250, 1200, 1250)
          $graphics.DrawLine($separator, 1200, 1250, 1200, 1972)
        }
      } finally { $separator.Dispose() }
    } finally { $graphics.Dispose() }
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $bitmap.Dispose() }
}

New-BaseFromMasks $canvasWidth $canvasHeight $mainTarget $islandTarget $baseOutputPath $false
New-BaseFromMasks $portraitWidth $portraitHeight $portraitMainTarget $portraitIslandTarget $portraitBaseOutputPath $true

$officialPoints = Get-Content -Raw $pointsSourcePath | ConvertFrom-Json
$displayPoints = [ordered]@{}
$portraitPoints = [ordered]@{}
foreach ($property in $officialPoints.PSObject.Properties) {
  # Official points are percentages of the 2400 x 2000 high-resolution masks.
  $sourceX = [double]$property.Value.x * 24
  $sourceY = [double]$property.Value.y * 20
  if ($sourceY -ge $islandSourceOverlay.Top) {
    $displayX = $islandTarget.Left + ($sourceX - $islandSourceOverlay.Left) * $islandTarget.Width / $islandSourceOverlay.Width
    $displayY = $islandTarget.Top + ($sourceY - $islandSourceOverlay.Top) * $islandTarget.Height / $islandSourceOverlay.Height
  } else {
    $displayX = $mainTarget.Left + ($sourceX - $mainSourceOverlay.Left) * $mainTarget.Width / $mainSourceOverlay.Width
    $displayY = $mainTarget.Top + ($sourceY - $mainSourceOverlay.Top) * $mainTarget.Height / $mainSourceOverlay.Height
  }
  $displayPoints[$property.Name] = [ordered]@{
    x = [math]::Round($displayX / $canvasWidth * 100, 3)
    y = [math]::Round($displayY / $canvasHeight * 100, 3)
  }
  if ($sourceY -ge $islandSourceOverlay.Top) {
    $portraitX = $portraitIslandTarget.Left + ($sourceX - $islandSourceOverlay.Left) * $portraitIslandTarget.Width / $islandSourceOverlay.Width
    $portraitY = $portraitIslandTarget.Top + ($sourceY - $islandSourceOverlay.Top) * $portraitIslandTarget.Height / $islandSourceOverlay.Height
  } else {
    $portraitX = $portraitMainTarget.Left + ($sourceX - $mainSourceOverlay.Left) * $portraitMainTarget.Width / $mainSourceOverlay.Width
    $portraitY = $portraitMainTarget.Top + ($sourceY - $mainSourceOverlay.Top) * $portraitMainTarget.Height / $mainSourceOverlay.Height
  }
  $portraitPoints[$property.Name] = [ordered]@{
    x = [math]::Round($portraitX / $portraitWidth * 100, 3)
    y = [math]::Round($portraitY / $portraitHeight * 100, 3)
  }
}
$pointsJson = $displayPoints | ConvertTo-Json -Depth 4
$portraitPointsJson = $portraitPoints | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($pointsOutputPath, "window.PREFECTURE_MAP_POINTS = $pointsJson;`nwindow.PREFECTURE_MAP_POINTS_PORTRAIT = $portraitPointsJson;`n", [System.Text.UTF8Encoding]::new($false))

Write-Output "Created $baseOutputPath and 47 display overlays."
