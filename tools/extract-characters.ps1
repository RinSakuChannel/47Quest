Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Linq;
using System.Drawing;
using System.Drawing.Imaging;
public static class CharacterExtractor {
 public static void Run(string source,string directory) {
  using(var bmp=new Bitmap(source)) {
   int w=bmp.Width,h=bmp.Height; var seen=new bool[w*h]; var parts=new List<List<int>>();
   for(int y=0;y<h;y++) for(int x=0;x<w;x++) {
    int p=y*w+x;if(seen[p])continue;seen[p]=true;if(bmp.GetPixel(x,y).A<40)continue;
    var part=new List<int>();var q=new Queue<int>();q.Enqueue(p);
    while(q.Count>0){int a=q.Dequeue();part.Add(a);int ax=a%w,ay=a/w;
     for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=ax+dx,ny=ay+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;int n=ny*w+nx;if(seen[n])continue;seen[n]=true;if(bmp.GetPixel(nx,ny).A>=40)q.Enqueue(n);}
    }
    if(part.Count>500)parts.Add(part);
   }
   var selected=parts.OrderByDescending(p=>p.Count).Take(47).OrderBy(p=>p.Average(v=>v/w)).ToList();
   var ordered=new List<List<int>>();for(int r=0;r<7;r++)ordered.AddRange(selected.Skip(r*7).Take(7).OrderBy(p=>p.Average(v=>v%w)));
   if(ordered.Count!=47)throw new Exception("Expected 47 characters");
   System.IO.Directory.CreateDirectory(directory);
   using(var contact=new Bitmap(7*180,7*200))using(var cg=Graphics.FromImage(contact)) {
    cg.Clear(Color.FromArgb(210,237,240));
    for(int i=0;i<ordered.Count;i++){
     var part=ordered[i];int minX=part.Min(v=>v%w),maxX=part.Max(v=>v%w),minY=part.Min(v=>v/w),maxY=part.Max(v=>v/w);
     int size=Math.Max(maxX-minX+1,maxY-minY+1)+24;
     using(var output=new Bitmap(size,size,PixelFormat.Format32bppArgb)){
      int ox=(size-(maxX-minX+1))/2,oy=(size-(maxY-minY+1))/2;
      foreach(int v in part)output.SetPixel(v%w-minX+ox,v/w-minY+oy,bmp.GetPixel(v%w,v/w));
      output.Save(System.IO.Path.Combine(directory,(i+1).ToString("00")+".png"),ImageFormat.Png);
      cg.DrawImage(output,new Rectangle(i%7*180,i/7*200,180,180));
      cg.DrawString((i+1).ToString("00"),SystemFonts.DefaultFont,Brushes.Black,i%7*180+8,i/7*200+180);
     }
     Console.WriteLine((i+1).ToString("00")+": "+minX+","+minY+" - "+maxX+","+maxY+" pixels="+part.Count);
    }
    contact.Save(System.IO.Path.Combine(directory,"contact-sheet.png"),ImageFormat.Png);
   }
  }
 }
}
'@ -ReferencedAssemblies System.Drawing,System.Core
[CharacterExtractor]::Run((Join-Path $PWD 'assets\images\prefecture-mascots-roster-hd.png'),(Join-Path $PWD 'assets\characters'))
