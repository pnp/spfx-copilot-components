#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidateSet('hub', 'company', 'hr', 'tech', 'business')] [string] $App,
    [switch] $Check
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ids = [ordered]@{
    hub = '7a2e07b7-bdfc-4442-aa61-005171754688'
    company = '77aff969-01f4-45b9-bf8a-c6fcd29fc7e1'
    hr = 'c9d7030a-ca94-4a61-aafc-c340cd98fbd3'
    tech = '06908557-127f-435c-b4b6-b73306ec8ce3'
    business = '2aa8bc99-9b5d-453b-b943-c82c4318c81b'
}
$members = 'manifest.json', 'color.png', 'outline.png'
$keys = if ($App) { $App.ToLowerInvariant() } else { $ids.Keys }
foreach ($key in $keys) {
    $folder = Join-Path $PSScriptRoot $key
    $zip = Join-Path $folder "employee-hub-$key.zip"
    $source = @{}
    foreach ($name in $members) { $source[$name] = [IO.File]::ReadAllBytes((Join-Path $folder $name)) }
    $manifest = [Text.Encoding]::UTF8.GetString($source['manifest.json']).TrimStart([char]0xFEFF) | ConvertFrom-Json
    $id = $ids[$key]
    $tab = $manifest.staticTabs[0]
    $url = "https://{teamSiteDomain}/_layouts/15/TeamsLogon.aspx?SPFX=true&dest=/_layouts/15/teamshostedapp.aspx%3Fteams%26personal%26componentId=$id%26forceLocale={locale}"
    if ($manifest.id -ne $id -or $manifest.staticTabs.Count -ne 1 -or $tab.entityId -ne $id -or
        $tab.contentUrl -cne $url -or ($tab.scopes -join ',') -cne 'personal' -or ($tab.context -join ',') -cne 'personalTab' -or
        $manifest.defaultInstallScope -cne 'personal' -or $manifest.PSObject.Properties['configurableTabs'] -or
        $manifest.icons.color -cne 'color.png' -or $manifest.icons.outline -cne 'outline.png') {
        throw "$key/manifest.json must reference its own Employee Hub component, one personal tab and both local icons."
    }
    foreach ($name in 'color.png', 'outline.png') {
        $b = $source[$name]
        $size = if ($name -eq 'color.png') { 192 } else { 32 }
        if ($b.Length -lt 24 -or [BitConverter]::ToString($b, 0, 8) -ne '89-50-4E-47-0D-0A-1A-0A' -or
            [Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt32($b, 16)) -ne $size -or
            [Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt32($b, 20)) -ne $size) {
            throw "$key/$name must be a $size x $size PNG."
        }
    }
    if (!$Check) {
        $buffer = [IO.MemoryStream]::new()
        try {
            $archive = [IO.Compression.ZipArchive]::new($buffer, [IO.Compression.ZipArchiveMode]::Create, $true)
            try {
                foreach ($name in $members) {
                    $entry = $archive.CreateEntry($name)
                    $entry.LastWriteTime = [datetimeoffset] '2000-01-01T00:00:00Z'
                    $stream = $entry.Open()
                    try { $stream.Write($source[$name], 0, $source[$name].Length) } finally { $stream.Dispose() }
                }
            } finally { $archive.Dispose() }
            [IO.File]::WriteAllBytes($zip, $buffer.ToArray())
        } finally { $buffer.Dispose() }
    }
    $archive = [IO.Compression.ZipFile]::OpenRead($zip)
    try {
        if ($archive.Entries.Count -ne $members.Count) { throw "$zip must contain exactly three root files." }
        foreach ($name in $members) {
            $entry = $archive.GetEntry($name)
            if (!$entry) { throw "$zip is missing $name." }
            $stream = $entry.Open()
            $buffer = [IO.MemoryStream]::new()
            try {
                $stream.CopyTo($buffer)
                if ([Convert]::ToBase64String($buffer.ToArray()) -cne [Convert]::ToBase64String($source[$name])) {
                    throw "$zip contains a stale $name. Repackage $key."
                }
            } finally { $buffer.Dispose(); $stream.Dispose() }
        }
    } finally { $archive.Dispose() }
    Write-Output "Verified $zip"
}
