param(
  [string]$Source = "assets/images/frame-illust-map-10006.png",
  [string]$BaseOutput = "assets/images/japan-map-play.png",
  [string]$OverlayDirectory = "assets/maps/frame-overlays",
  [string]$PointsOutput = "src/map-points.js"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;

public static class FrameMapBuilder {
  private sealed class Region {
    public int Id, Area;
    public long SumX, SumY;
  }

  private static readonly Dictionary<string, int[]> Components = new Dictionary<string, int[]> {
    {"01", new[]{1,2,3,4,5,6,7}}, {"02", new[]{8}}, {"03", new[]{10}}, {"04", new[]{12}},
    {"05", new[]{9}}, {"06", new[]{11}}, {"07", new[]{15}}, {"08", new[]{21}},
    {"09", new[]{17}}, {"10", new[]{19}}, {"11", new[]{25}}, {"12", new[]{26}},
    {"13", new[]{28}}, {"14", new[]{36}}, {"15", new[]{13,14}}, {"16", new[]{20}},
    {"17", new[]{16}}, {"18", new[]{24}}, {"19", new[]{27}}, {"20", new[]{18}},
    {"21", new[]{22}}, {"22", new[]{38}}, {"23", new[]{39}}, {"24", new[]{41}},
    {"25", new[]{35}}, {"26", new[]{31}}, {"27", new[]{43}}, {"28", new[]{32,47}},
    {"29", new[]{46}}, {"30", new[]{51}}, {"31", new[]{37}}, {"32", new[]{23,33}},
    {"33", new[]{40,52}}, {"34", new[]{42,53,58}}, {"35", new[]{45}}, {"36", new[]{54}},
    {"37", new[]{49,50}}, {"38", new[]{55}}, {"39", new[]{59}}, {"40", new[]{56}},
    {"41", new[]{61}}, {"42", new[]{44,48,57,62,63,65,66}}, {"43", new[]{64,69}}, {"44", new[]{60}},
    {"45", new[]{67}}, {"46", new[]{73,74,80,81}}, {"47", new[]{68,71,72,75,77,78,79}}
  };

  private static readonly Dictionary<string, int> Primary = new Dictionary<string, int> {
    {"01",2},{"02",8},{"03",10},{"04",12},{"05",9},{"06",11},{"07",15},{"08",21},{"09",17},{"10",19},
    {"11",25},{"12",26},{"13",28},{"14",36},{"15",13},{"16",20},{"17",16},{"18",24},{"19",27},{"20",18},
    {"21",22},{"22",38},{"23",39},{"24",41},{"25",35},{"26",31},{"27",43},{"28",32},{"29",46},{"30",51},
    {"31",37},{"32",33},{"33",40},{"34",42},{"35",45},{"36",54},{"37",50},{"38",55},{"39",59},{"40",56},
    {"41",61},{"42",62},{"43",64},{"44",60},{"45",67},{"46",74},{"47",72}
  };

  public static void Run(string sourcePath, string baseOutput, string overlayDirectory, string pointsOutput) {
    using (var source = new Bitmap(sourcePath)) {
      int width = source.Width, height = source.Height, total = width * height;
      var open = new bool[total]; var labels = new int[total]; var queue = new int[total];
      for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
        Color c = source.GetPixel(x, y);
        bool green = c.A > 40 && c.G > c.R + 12 && c.G > c.B + 25;
        bool border = c.A > 40 && c.R < 145 && c.G < 190 && c.B < 120;
        open[y * width + x] = green && !border;
      }

      var regions = new Dictionary<int, Region>(); int nextId = 1;
      for (int start = 0; start < total; start++) {
        if (!open[start] || labels[start] != 0) continue;
        var region = new Region { Id = nextId }; int head = 0, tail = 0; queue[tail++] = start; labels[start] = nextId;
        while (head < tail) {
          int index = queue[head++], x = index % width, y = index / width; region.Area++; region.SumX += x; region.SumY += y;
          int candidate;
          if (x > 0) { candidate=index-1; if(open[candidate]&&labels[candidate]==0){labels[candidate]=nextId;queue[tail++]=candidate;} }
          if (x+1 < width) { candidate=index+1; if(open[candidate]&&labels[candidate]==0){labels[candidate]=nextId;queue[tail++]=candidate;} }
          if (y > 0) { candidate=index-width; if(open[candidate]&&labels[candidate]==0){labels[candidate]=nextId;queue[tail++]=candidate;} }
          if (y+1 < height) { candidate=index+width; if(open[candidate]&&labels[candidate]==0){labels[candidate]=nextId;queue[tail++]=candidate;} }
        }
        regions[nextId]=region; nextId++;
      }

      foreach (var pair in Components) foreach (int id in pair.Value) if (!regions.ContainsKey(id)) throw new InvalidOperationException("Missing component " + id + " for " + pair.Key);
      Directory.CreateDirectory(Path.GetDirectoryName(baseOutput)); Directory.CreateDirectory(overlayDirectory); Directory.CreateDirectory(Path.GetDirectoryName(pointsOutput));
      SaveScaled(source, baseOutput);

      var indexesByLabel = new Dictionary<int, List<int>>();
      for (int index=0; index<labels.Length; index++) if (labels[index] != 0) {
        List<int> indexes; if(!indexesByLabel.TryGetValue(labels[index], out indexes)){indexes=new List<int>();indexesByLabel[labels[index]]=indexes;} indexes.Add(index);
      }

      foreach (var pair in Components) {
        using (var mask = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
          int pixelCount=0;
          foreach (int id in pair.Value) {
            List<int> indexes; if(!indexesByLabel.TryGetValue(id,out indexes)) continue;
            foreach(int index in indexes){int x=index%width,y=index/width;Color original=source.GetPixel(x,y);int texture=Math.Max(0,Math.Min(18,(original.G-190)/2));mask.SetPixel(x,y,Color.FromArgb(238,255,82+texture,64+texture));pixelCount++;}
          }
          if(pixelCount<100) throw new InvalidOperationException("Overlay too small for " + pair.Key);
          SaveScaled(mask, Path.Combine(overlayDirectory, pair.Key + ".png"));
        }
      }

      using (var writer = new StreamWriter(pointsOutput, false, new UTF8Encoding(false))) {
        writer.WriteLine("// Frame illust map interior points in the shared 1600 x 1000 display space.");
        writer.WriteLine("window.PREFECTURE_MAP_POINTS = {");
        foreach (string code in Primary.Keys.OrderBy(k=>k)) {
          Region region=regions[Primary[code]]; Point interior=FindInteriorPoint(Primary[code],indexesByLabel[Primary[code]],labels,width,height,region);double sourceX=interior.X,sourceY=interior.Y;
          double xPercent=(300.0+sourceX*1000.0/width)/1600.0*100.0,yPercent=sourceY*1000.0/height/1000.0*100.0;
          writer.WriteLine(string.Format(CultureInfo.InvariantCulture,"  \"{0}\": {{ \"x\": {1:0.000}, \"y\": {2:0.000} }},",code,xPercent,yPercent));
        }
        writer.WriteLine("};");
      }
      Console.WriteLine("Built Frame illust base map, 47 overlays, and 47 points from " + width + "x" + height + " source.");
    }
  }

  private static Point FindInteriorPoint(int id, List<int> indexes, int[] labels, int width, int height, Region region) {
    double targetX=(double)region.SumX/region.Area,targetY=(double)region.SumY/region.Area;
    for(int radius=6;radius>=1;radius--){double best=double.MaxValue;Point choice=Point.Empty;
      foreach(int index in indexes){int x=index%width,y=index/width;if(x<radius||y<radius||x+radius>=width||y+radius>=height)continue;
        if(labels[y*width+x]!=id||labels[y*width+x-radius]!=id||labels[y*width+x+radius]!=id||labels[(y-radius)*width+x]!=id||labels[(y+radius)*width+x]!=id||labels[(y-radius)*width+x-radius]!=id||labels[(y-radius)*width+x+radius]!=id||labels[(y+radius)*width+x-radius]!=id||labels[(y+radius)*width+x+radius]!=id)continue;
        double distance=(x-targetX)*(x-targetX)+(y-targetY)*(y-targetY);if(distance<best){best=distance;choice=new Point(x,y);}
      }
      if(!choice.IsEmpty)return choice;
    }
    int fallback=indexes[indexes.Count/2];return new Point(fallback%width,fallback/width);
  }

  private static void SaveScaled(Bitmap source, string outputPath) {
    using (var output = new Bitmap(1600,1000,PixelFormat.Format32bppArgb))
    using (var graphics = Graphics.FromImage(output)) {
      graphics.Clear(Color.Transparent); graphics.CompositingMode=CompositingMode.SourceOver; graphics.CompositingQuality=CompositingQuality.HighQuality;
      graphics.InterpolationMode=InterpolationMode.HighQualityBicubic; graphics.PixelOffsetMode=PixelOffsetMode.HighQuality; graphics.SmoothingMode=SmoothingMode.HighQuality;
      graphics.DrawImage(source,new Rectangle(300,0,1000,1000),new Rectangle(0,0,source.Width,source.Height),GraphicsUnit.Pixel);
      output.Save(outputPath,ImageFormat.Png);
    }
  }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
$sourcePath = (Resolve-Path $Source).Path
$baseOutputPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $BaseOutput))
$overlayDirectoryPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OverlayDirectory))
$pointsOutputPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $PointsOutput))
[FrameMapBuilder]::Run($sourcePath, $baseOutputPath, $overlayDirectoryPath, $pointsOutputPath)
