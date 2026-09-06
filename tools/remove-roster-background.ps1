param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [ValidateRange(1, 6)][int]$Scale = 1
)

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;

public static class RosterBackground {
  public static void Remove(string inputPath, string outputPath, int scale) {
    using (var source = new Bitmap(inputPath))
    using (var image = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (var graphics = Graphics.FromImage(image)) graphics.DrawImageUnscaled(source, 0, 0);
      var seen = new bool[image.Width * image.Height];
      var queue = new Queue<Point>();
      Action<int, int> add = (x, y) => {
        if (x < 0 || y < 0 || x >= image.Width || y >= image.Height) return;
        var index = y * image.Width + x;
        if (seen[index]) return;
        var color = image.GetPixel(x, y);
        var max = Math.Max(color.R, Math.Max(color.G, color.B));
        var min = Math.Min(color.R, Math.Min(color.G, color.B));
        if (min < 218 || max - min > 13) return;
        seen[index] = true;
        queue.Enqueue(new Point(x, y));
      };
      for (var x = 0; x < image.Width; x++) { add(x, 0); add(x, image.Height - 1); }
      for (var y = 0; y < image.Height; y++) { add(0, y); add(image.Width - 1, y); }
      while (queue.Count > 0) {
        var point = queue.Dequeue();
        image.SetPixel(point.X, point.Y, Color.Transparent);
        add(point.X - 1, point.Y); add(point.X + 1, point.Y);
        add(point.X, point.Y - 1); add(point.X, point.Y + 1);
      }
      if (scale <= 1) {
        image.Save(outputPath, ImageFormat.Png);
        return;
      }
      using (var resized = new Bitmap(image.Width * scale, image.Height * scale, PixelFormat.Format32bppArgb))
      using (var graphics = Graphics.FromImage(resized)) {
        graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
        graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
        graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
        graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
        graphics.DrawImage(image, new Rectangle(0, 0, resized.Width, resized.Height), 0, 0, image.Width, image.Height, GraphicsUnit.Pixel);
        resized.Save(outputPath, ImageFormat.Png);
      }
    }
  }
}
'@ -ReferencedAssemblies ([System.Drawing.Bitmap].Assembly.Location)

[RosterBackground]::Remove((Resolve-Path -LiteralPath $InputPath).Path, $OutputPath, $Scale)
