param(
  [string]$Source = "assets/images/frame-illust-map-10006.png",
  [string]$OutputImage = "tmp/frame-components.png",
  [string]$OutputCsv = "tmp/frame-components.csv"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;

public static class FrameMapAnalyzer {
  private sealed class Region {
    public int Id, Area, MinX, MinY, MaxX, MaxY;
    public long SumX, SumY;
  }

  public static void Run(string sourcePath, string outputImage, string outputCsv) {
    using (var source = new Bitmap(sourcePath)) {
    int width = source.Width, height = source.Height, total = width * height;
    var open = new bool[total];
    var labels = new int[total];
    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        Color c = source.GetPixel(x, y);
        bool green = c.A > 40 && c.G > c.R + 12 && c.G > c.B + 25;
        bool border = c.A > 40 && c.R < 145 && c.G < 190 && c.B < 120;
        open[y * width + x] = green && !border;
      }
    }

    var regions = new List<Region>();
    var queue = new int[total];
    int nextId = 1;
    for (int start = 0; start < total; start++) {
      if (!open[start] || labels[start] != 0) continue;
      var region = new Region { Id = nextId, MinX = width, MinY = height, MaxX = 0, MaxY = 0 };
      int head = 0, tail = 0; queue[tail++] = start; labels[start] = nextId;
      while (head < tail) {
        int index = queue[head++], x = index % width, y = index / width;
        region.Area++; region.SumX += x; region.SumY += y;
        if (x < region.MinX) region.MinX = x; if (x > region.MaxX) region.MaxX = x;
        if (y < region.MinY) region.MinY = y; if (y > region.MaxY) region.MaxY = y;
        int candidate;
        if (x > 0) { candidate = index - 1; if (open[candidate] && labels[candidate] == 0) { labels[candidate] = region.Id; queue[tail++] = candidate; } }
        if (x + 1 < width) { candidate = index + 1; if (open[candidate] && labels[candidate] == 0) { labels[candidate] = region.Id; queue[tail++] = candidate; } }
        if (y > 0) { candidate = index - width; if (open[candidate] && labels[candidate] == 0) { labels[candidate] = region.Id; queue[tail++] = candidate; } }
        if (y + 1 < height) { candidate = index + width; if (open[candidate] && labels[candidate] == 0) { labels[candidate] = region.Id; queue[tail++] = candidate; } }
      }
      regions.Add(region); nextId++;
    }

    var useful = regions.Where(r => r.Area >= 12).OrderByDescending(r => r.Area).ToList();
    Directory.CreateDirectory(Path.GetDirectoryName(outputImage));
    using (var diagnostic = new Bitmap(source)) {
    using (var graphics = Graphics.FromImage(diagnostic)) {
      using (var font = new Font("Arial", 11, FontStyle.Bold)) {
      foreach (var region in useful) {
        int cx = (int)(region.SumX / Math.Max(1, region.Area));
        int cy = (int)(region.SumY / Math.Max(1, region.Area));
        var box = new RectangleF(cx - 15, cy - 9, 30, 18);
        graphics.FillRectangle(Brushes.White, box);
        graphics.DrawRectangle(Pens.Red, box.X, box.Y, box.Width, box.Height);
        graphics.DrawString(region.Id.ToString(), font, Brushes.Black, box.X + 1, box.Y + 1);
      }
      }
    }
    diagnostic.Save(outputImage, ImageFormat.Png);
    }

    using (var writer = new StreamWriter(outputCsv, false, System.Text.Encoding.UTF8)) {
    writer.WriteLine("id,area,cx,cy,minX,minY,maxX,maxY");
    foreach (var region in useful) {
      writer.WriteLine(string.Format("{0},{1},{2},{3},{4},{5},{6},{7}", region.Id, region.Area, region.SumX / Math.Max(1, region.Area), region.SumY / Math.Max(1, region.Area), region.MinX, region.MinY, region.MaxX, region.MaxY));
    }
    }
    Console.WriteLine(string.Format("source={0}x{1} components={2} useful={3} large={4}", width, height, regions.Count, useful.Count, useful.Count(r => r.Area >= 300)));
    }
  }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
$sourcePath = (Resolve-Path $Source).Path
$outputImagePath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputImage))
$outputCsvPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputCsv))
[FrameMapAnalyzer]::Run($sourcePath, $outputImagePath, $outputCsvPath)
