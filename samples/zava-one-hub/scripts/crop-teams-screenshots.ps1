param(
    [Parameter(Mandatory = $true)][string]$Combined,
    [Parameter(Mandatory = $true)][string]$Company,
    [Parameter(Mandatory = $true)][string]$Personal
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$records = @()

function Get-PixelHash($Bitmap, $Rectangle) {
    $data = $Bitmap.LockBits($Rectangle, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $rowBytes = $Rectangle.Width * 4
        $pixels = [byte[]]::new($rowBytes * $Rectangle.Height)
        for ($y = 0; $y -lt $Rectangle.Height; $y++) {
            [System.Runtime.InteropServices.Marshal]::Copy(
                [IntPtr]::Add($data.Scan0, $y * $data.Stride), $pixels, $y * $rowBytes, $rowBytes)
        }
        $sha = [System.Security.Cryptography.SHA256]::Create()
        try { return [Convert]::ToBase64String($sha.ComputeHash($pixels)) }
        finally { $sha.Dispose() }
    } finally { $Bitmap.UnlockBits($data) }
}

foreach ($capture in @(
    @{ Source = $Combined; Name = 'screenshot-teams-combined.png'; Mode = 'combined' },
    @{ Source = $Company; Name = 'screenshot-teams-company.png'; Mode = 'company' },
    @{ Source = $Personal; Name = 'screenshot-teams-personal.png'; Mode = 'personal' }
)) {
    $source = (Resolve-Path -LiteralPath $capture.Source).Path
    $image = [System.Drawing.Bitmap]::new($source)
    try {
        if ($image.Width -lt 1400 -or $image.Height -lt 750) {
            throw "Teams source must be a full, readable desktop app capture: $source"
        }
        # Remove only the four-pixel window border; retain authentic Teams app chrome.
        $rectangle = [System.Drawing.Rectangle]::new(4, 4, $image.Width - 8, $image.Height - 8)
        $cropped = $image.Clone($rectangle, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $output = Join-Path $root "assets\$($capture.Name)"
        try {
            $cropped.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
            $saved = [System.Drawing.Bitmap]::new($output)
            try {
                $savedRectangle = [System.Drawing.Rectangle]::new(0, 0, $saved.Width, $saved.Height)
                if ((Get-PixelHash $image $rectangle) -cne (Get-PixelHash $saved $savedRectangle)) {
                    throw "Teams crop changed retained pixels: $output"
                }
            } finally { $saved.Dispose() }
            $records += @{
                path = "assets/$($capture.Name)"
                source = 'user-provided-authenticated-teams'
                mode = $capture.Mode
                sourceWidth = $image.Width
                sourceHeight = $image.Height
                sourceSha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
                crop = @{ x = 4; y = 4; width = $rectangle.Width; height = $rectangle.Height }
                width = $cropped.Width
                height = $cropped.Height
                bytes = (Get-Item -LiteralPath $output).Length
                sha256 = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
                captureMode = 'viewport'
                pixelsMatchSource = $true
            }
        } finally { $cropped.Dispose() }
        Write-Host "$($capture.Name): $($rectangle.Width)x$($rectangle.Height), Teams chrome retained, no resizing."
    } finally { $image.Dispose() }
}

@{ capturedAt = [DateTime]::UtcNow.ToString('o'); captures = $records } |
    ConvertTo-Json -Depth 6 |
    Set-Content -LiteralPath (Join-Path $root 'ux-review\evidence\teams-capture-matrix.json') -Encoding utf8
