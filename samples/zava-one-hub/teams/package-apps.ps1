param([switch]$Check)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

$apps = @(
    @{ Folder = 'zavaOneWorkspace'; Alias = 'ZavaOneWorkspace'; Color = '#075FCE'; Light = '#208FEF'; Dark = '#11364F'; Mark = 'workspace' },
    @{ Folder = 'zavaOneCompanyWorkspace'; Alias = 'ZavaOneCompanyWorkspace'; Color = '#107C41'; Light = '#25AD76'; Dark = '#064D3C'; Mark = 'company' },
    @{ Folder = 'zavaOnePersonalWorkspace'; Alias = 'ZavaOnePersonalWorkspace'; Color = '#6B3F91'; Light = '#A275D5'; Dark = '#392458'; Mark = 'personal' }
)

function New-RoundedPath([single]$X, [single]$Y, [single]$Width, [single]$Height, [single]$Radius) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Icon($App, [int]$Size, [bool]$Outline) {
    $bitmap = [System.Drawing.Bitmap]::new($Size * 4, $Size * 4)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform($Size * 4 / 192, $Size * 4 / 192)
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        if (-not $Outline) {
            $background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                [System.Drawing.Rectangle]::new(0, 0, 192, 192),
                [System.Drawing.ColorTranslator]::FromHtml($App.Light),
                [System.Drawing.ColorTranslator]::FromHtml($App.Dark),
                [single]60
            )
            $glow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(18, 255, 255, 255))
            $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(45, 255, 255, 255), 1)
            $tile = New-RoundedPath 12 12 168 168 34
            try {
                $graphics.FillRectangle($background, 0, 0, 192, 192)
                $graphics.FillEllipse($glow, -65, -95, 240, 240)
                $graphics.DrawPath($border, $tile)
            } finally {
                $background.Dispose()
                $glow.Dispose()
                $border.Dispose()
                $tile.Dispose()
            }
        }

        # Keep the complete mark centered within Teams' 120px safe area.
        $graphics.TranslateTransform(-6, 0)
        $z = [System.Drawing.Drawing2D.GraphicsPath]::new()
        $z.AddPolygon([System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new(44, 48), [System.Drawing.PointF]::new(137, 48),
            [System.Drawing.PointF]::new(137, 67), [System.Drawing.PointF]::new(76, 123),
            [System.Drawing.PointF]::new(117, 123), [System.Drawing.PointF]::new(117, 144),
            [System.Drawing.PointF]::new(44, 144), [System.Drawing.PointF]::new(44, 125),
            [System.Drawing.PointF]::new(105, 69), [System.Drawing.PointF]::new(44, 69)
        ))
        try { $graphics.FillPath($white, $z) } finally { $z.Dispose() }

        switch ($App.Mark) {
            'workspace' {
                foreach ($x in @(130, 148)) {
                    foreach ($y in @(111, 129)) {
                        $square = New-RoundedPath $x $y 13 13 3
                        try { $graphics.FillPath($white, $square) } finally { $square.Dispose() }
                    }
                }
            }
            'company' {
                $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 5)
                $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
                try {
                    $graphics.DrawRectangle($pen, 132, 107, 25, 35)
                    foreach ($x in @(139, 150)) {
                        foreach ($y in @(115, 125)) { $graphics.FillRectangle($white, $x, $y, 4, 4) }
                    }
                    $graphics.FillRectangle($white, 142, 135, 5, 7)
                } finally { $pen.Dispose() }
            }
            'personal' {
                $graphics.FillEllipse($white, 136, 106, 18, 18)
                $body = New-RoundedPath 129 129 32 15 7
                try { $graphics.FillPath($white, $body) } finally { $body.Dispose() }
            }
        }
    } finally {
        $white.Dispose()
        $graphics.Dispose()
    }

    $output = [System.Drawing.Bitmap]::new($Size, $Size)
    $resize = [System.Drawing.Graphics]::FromImage($output)
    $stream = [System.IO.MemoryStream]::new()
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    try {
        if ($Outline) {
            $resize.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        } else {
            $resize.Clear([System.Drawing.ColorTranslator]::FromHtml($App.Dark))
            $resize.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        }
        $resize.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $resize.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
        $resize.DrawImage($bitmap, [System.Drawing.Rectangle]::new(0, 0, $Size, $Size), 0, 0, $bitmap.Width, $bitmap.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        if ($Outline) {
            # Preserve coverage while removing GDI+ resampling's dark RGB fringes.
            for ($y = 0; $y -lt $Size; $y++) {
                for ($x = 0; $x -lt $Size; $x++) {
                    $pixel = $output.GetPixel($x, $y)
                    if ($pixel.A -gt 0) {
                        $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255))
                    }
                }
            }
        }
        $output.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        return ,$stream.ToArray()
    } finally {
        $stream.Dispose()
        $attributes.Dispose()
        $resize.Dispose()
        $output.Dispose()
        $bitmap.Dispose()
    }
}

foreach ($app in $apps) {
    $folder = Join-Path $PSScriptRoot $app.Folder
    $manifestPath = Join-Path $folder 'manifest.json'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $webPartPath = Join-Path $PSScriptRoot "..\src\webparts\$($app.Folder)\$($app.Alias)WebPart.manifest.json"
    $componentId = [regex]::Match((Get-Content -LiteralPath $webPartPath -Raw), '"id"\s*:\s*"([^"]+)"').Groups[1].Value
    $expectedUrl = "https://{teamSiteDomain}/_layouts/15/TeamsLogon.aspx?SPFX=true&dest=/_layouts/15/teamshostedapp.aspx%3Fteams%26personal%26componentId=$componentId%26forceLocale={locale}"
    $webPartHosts = [regex]::Match((Get-Content -LiteralPath $webPartPath -Raw), '"supportedHosts"\s*:\s*\[([^\]]+)\]').Groups[1].Value
    if ($webPartHosts -cnotmatch '"TeamsPersonalApp"') {
        throw "The web part must support TeamsPersonalApp: $webPartPath"
    }
    if ($null -ne $manifest.PSObject.Properties['configurableTabs'] -or
        $null -ne $manifest.PSObject.Properties['supportsChannelFeatures']) {
        throw "Personal-only apps must not declare configurableTabs or supportsChannelFeatures: $manifestPath"
    }
    if (-not $componentId -or $manifest.id -ne $componentId -or
        $manifest.defaultInstallScope -cne 'personal' -or
        $manifest.staticTabs.Count -ne 1 -or
        $manifest.staticTabs[0].entityId -ne $componentId -or
        $manifest.staticTabs[0].name -cne $manifest.name.short -or
        $manifest.staticTabs[0].contentUrl -cne $expectedUrl -or
        ($manifest.staticTabs[0].scopes -join ',') -cne 'personal' -or
        ($manifest.staticTabs[0].context -join ',') -cne 'personalTab' -or
        $manifest.webApplicationInfo.id -ne '00000003-0000-0ff1-ce00-000000000000' -or
        $manifest.webApplicationInfo.resource -cne 'https://{teamSiteDomain}' -or
        $manifest.accentColor -cne $app.Color -or
        $manifest.icons.color -cne 'color.png' -or $manifest.icons.outline -cne 'outline.png') {
        throw "Incorrect SPFx routing, personal tab scope/context, authentication, or branding in $manifestPath"
    }

    foreach ($icon in @(@{ Name = 'color.png'; Size = 192; Outline = $false }, @{ Name = 'outline.png'; Size = 32; Outline = $true })) {
        $path = Join-Path $folder $icon.Name
        $expected = New-Icon $app $icon.Size $icon.Outline
        if ($Check) {
            if (-not (Test-Path -LiteralPath $path) -or
                [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path)) -cne [Convert]::ToBase64String($expected)) {
                throw "Missing or stale icon: $path"
            }
        } else {
            [System.IO.File]::WriteAllBytes($path, $expected)
        }
    }

    $packagePath = Join-Path $folder 'TeamsSPFxApp.zip'
    $files = @('manifest.json', 'color.png', 'outline.png')
    if (-not $Check) {
        Compress-Archive -LiteralPath @($files | ForEach-Object { Join-Path $folder $_ }) -DestinationPath $packagePath -Force
    }
    $archive = [System.IO.Compression.ZipFile]::OpenRead($packagePath)
    try {
        if ($archive.Entries.Count -ne 3) { throw "Expected exactly three root-level files in $packagePath" }
        foreach ($name in $files) {
            $entry = $archive.GetEntry($name)
            if ($null -eq $entry) { throw "Missing root-level $name in $packagePath" }
            $stream = $entry.Open()
            $content = [System.IO.MemoryStream]::new()
            try {
                $stream.CopyTo($content)
                if ([Convert]::ToBase64String($content.ToArray()) -cne
                    [Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $folder $name)))) {
                    throw "Stale $name in $packagePath"
                }
            } finally {
                $stream.Dispose()
                $content.Dispose()
            }
        }
    } finally { $archive.Dispose() }
    Write-Host "Validated $($app.Folder): component $componentId, personal tab, icons, and ZIP contents."
}
