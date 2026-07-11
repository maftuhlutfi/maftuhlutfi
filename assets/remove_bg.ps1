Add-Type -AssemblyName System.Drawing

function Remove-MagentaBackground {
    param([string]$inFile, [string]$outFile)
    
    $bmp = [System.Drawing.Bitmap]::FromFile($inFile)
    $newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
    
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $p = $bmp.GetPixel($x, $y)
            $dist = [math]::Sqrt([math]::Pow(255 - $p.R, 2) + [math]::Pow(0 - $p.G, 2) + [math]::Pow(255 - $p.B, 2))
            
            # 110 is a good threshold to remove magenta artifacts while keeping purples
            if ($dist -lt 110) {
                $newBmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            } else {
                $newBmp.SetPixel($x, $y, $p)
            }
        }
    }
    
    $newBmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $newBmp.Dispose()
}

Remove-MagentaBackground "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\fishes.png" "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\fishes_t.png"
Remove-MagentaBackground "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\plants.png" "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\plants_t.png"
Remove-MagentaBackground "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\decos.png" "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\decos_t.png"
