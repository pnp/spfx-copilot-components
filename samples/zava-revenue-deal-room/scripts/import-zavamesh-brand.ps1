param([Parameter(Mandatory = $true)][string]$Source)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot
$output = Join-Path $root 'src\shared\assets\brand'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$assets = @(
    @{ source = 'Logos\png\ZavaMesh logotype_clr.png'; file = 'zavamesh-color.png'; width = 500 },
    @{ source = 'Logos\png\ZavaMesh logotype_wht.png'; file = 'zavamesh-white.png'; width = 500 },
    @{ source = 'Backgrounds\Secition\ZavaMesh Background 12.png'; file = 'mesh-wave.png'; width = 1000 },
    @{ source = 'Backgrounds\Card\ZavaMesh Card 1.png'; file = 'mesh-textile.jpg'; width = 440 }
)
$records = foreach ($asset in $assets) {
    $inputPath = Join-Path $Source $asset.source
    $image = [System.Drawing.Image]::FromFile($inputPath)
    try {
        $height = [int][Math]::Round($image.Height * $asset.width / $image.Width)
        $bitmap = [System.Drawing.Bitmap]::new($asset.width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($image, 0, 0, $asset.width, $height)
            $destination = Join-Path $output $asset.file
            $format = if ($asset.file.EndsWith('.jpg')) { [System.Drawing.Imaging.ImageFormat]::Jpeg } else { [System.Drawing.Imaging.ImageFormat]::Png }
            $bitmap.Save($destination, $format)
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
        @{
            source = $asset.source
            runtime = "src/shared/assets/brand/$($asset.file)"
            sourceSha256 = (Get-FileHash -LiteralPath $inputPath -Algorithm SHA256).Hash.ToLowerInvariant()
            sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
            width = $asset.width
            height = $height
            rights = 'User-supplied ZavaMesh assets; public redistribution review pending'
        }
    } finally { $image.Dispose() }
}
foreach ($icon in @(@{ name = 'color.png'; size = 192; inset = 32 }, @{ name = 'outline.png'; size = 32; inset = 4 })) {
    $image = [System.Drawing.Image]::FromFile((Join-Path $Source 'Logos\png\ZavaMesh mark_wht.png'))
    $bitmap = [System.Drawing.Bitmap]::new($icon.size, $icon.size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        if ($icon.name -eq 'color.png') { $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#23701A')) }
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, $icon.inset, $icon.inset, $icon.size - 2 * $icon.inset, $icon.size - 2 * $icon.inset)
        $bitmap.Save((Join-Path $root "copilot\$($icon.name)"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose(); $image.Dispose() }
}
@{ schemaVersion = 1; assets = @($records) } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $root 'assets\brand-provenance.json') -Encoding utf8
Write-Output "Imported $($records.Count) optimized brand assets and two agent icons."
