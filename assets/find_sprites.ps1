Add-Type -AssemblyName System.Drawing

function Get-SpriteBoxes {
    param([string]$file)
    $bmp = [System.Drawing.Bitmap]::FromFile($file)
    $w = $bmp.Width
    $h = $bmp.Height

    $hasPixel = New-Object bool[] $w

    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 20) {
                $hasPixel[$x] = $true
                break
            }
        }
    }

    $boxes = @()
    $inSprite = $false
    $startX = 0

    for ($x = 0; $x -lt $w; $x++) {
        if ($hasPixel[$x] -and -not $inSprite) {
            $inSprite = $true
            $startX = $x
        } elseif ((-not $hasPixel[$x] -and $inSprite) -or ($x -eq $w - 1 -and $inSprite)) {
            $inSprite = $false
            $endX = $x - 1
            
            # Find Y bounds
            $minY = $h
            $maxY = 0
            for ($bx = $startX; $bx -le $endX; $bx++) {
                for ($by = 0; $by -lt $h; $by++) {
                    $p = $bmp.GetPixel($bx, $by)
                    if ($p.A -gt 20) {
                        if ($by -lt $minY) { $minY = $by }
                        if ($by -gt $maxY) { $maxY = $by }
                    }
                }
            }
            
            # Add padding
            $boxes += [pscustomobject]@{
                X = [math]::Max(0, $startX - 5)
                Y = [math]::Max(0, $minY - 5)
                W = [math]::Min($w - $startX, $endX - $startX + 10)
                H = [math]::Min($h - $minY, $maxY - $minY + 10)
            }
        }
    }
    
    $bmp.Dispose()
    return $boxes
}

Write-Host "FISHES:"
Get-SpriteBoxes "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\fishes_t.png" | ConvertTo-Json

Write-Host "PLANTS:"
Get-SpriteBoxes "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\plants_t.png" | ConvertTo-Json

Write-Host "DECOS:"
Get-SpriteBoxes "e:\WEB\Other\maftuhlutfi\github-profile-game\assets\decos_t.png" | ConvertTo-Json
