#requires -Version 5.1
[CmdletBinding(DefaultParameterSetName='Review')]
param(
    [Parameter(ParameterSetName='Review')] [switch] $Review,
    [Parameter(Mandatory, ParameterSetName='Tenant')] [string] $TenantUrl,
    [Parameter(ParameterSetName='Tenant')] [string] $WebsiteUrl,
    [Parameter(ParameterSetName='Tenant')] [string] $PrivacyUrl,
    [Parameter(ParameterSetName='Tenant')] [string] $TermsOfUseUrl,
    [string] $OutputPath
)

$ErrorActionPreference = 'Stop'
$files = 'manifest.json', 'declarativeAgent.json', 'ai-plugin.json', 'color.png', 'outline.png'
$utf8 = [Text.UTF8Encoding]::new($false)
$bytes = @{}
$json = @{}
foreach ($file in $files) {
    $bytes[$file] = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $file))
    if ($file.EndsWith('.json')) {
        $text = $utf8.GetString($bytes[$file]).TrimStart([char]0xFEFF)
        if ($text -match '\$\[|\{\{') { throw "Unresolved template in $file. Use literal values." }
        $json[$file] = ConvertFrom-Json -InputObject $text
    }
}
$app = $json['manifest.json']
$agent = $json['declarativeAgent.json']
$action = $json['ai-plugin.json']
$remote = $app.agentConnectors[0].toolSource.remoteMcpServer
$runtime = $action.runtimes[0]
$route = '/_api/mcp/spfx?solutionId=b847948b-8a9b-4483-b335-a6343eeb1760'
$reviewOrigin = 'https://spfx-review.invalid'
if ($app.id -ne 'ce6ec992-07ef-42c1-8c3d-c158ac69461e' -or $app.developer.name -cne 'Contoso' -or
    !$app.description.short -or $app.description.short.Length -gt 80 -or
    $app.copilotAgents.declarativeAgents.Count -ne 1 -or $app.copilotAgents.declarativeAgents[0].file -cne 'declarativeAgent.json' -or
    $agent.actions.Count -ne 1 -or $agent.actions[0].file -cne 'ai-plugin.json' -or [string]::IsNullOrWhiteSpace($agent.instructions) -or
    $app.icons.color -cne 'color.png' -or $app.icons.outline -cne 'outline.png') {
    throw 'Check the Employee Hub plug-in identity, short description (1-80 characters), icons, literal instructions and agent-to-action references.'
}
if ($app.agentConnectors.Count -ne 1 -or $action.runtimes.Count -ne 1 -or $runtime.type -cne 'RemoteMCPServer' -or
    $action.schema_version -cne 'v2.4' -or $action.'$schema' -cne 'https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json' -or
    $action.functions -isnot [array] -or $action.functions.Count -ne 0 -or $runtime.run_for_functions.Count -ne 1 -or $runtime.run_for_functions[0] -cne '*' -or
    $remote.PSObject.Properties.Name -contains 'mcpToolDescription' -or $runtime.spec.PSObject.Properties.Name -contains 'mcp_tool_description' -or
    $remote.mcpServerUrl -cne $runtime.spec.url -or ([uri]$remote.mcpServerUrl).PathAndQuery -cne $route) {
    throw 'Both entry points must dynamically discover the same Employee Hub SPFx solution. Do not include static tools.'
}

$isPilot = $PSCmdlet.ParameterSetName -eq 'Tenant'
if ($isPilot) {
    if ($TenantUrl -notmatch '\Ahttps://[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.sharepoint\.com/?\z' -or $TenantUrl -match '-(?:admin|my)\.sharepoint\.com') {
        throw 'Use the commercial SharePoint tenant root, not an admin, personal or site URL.'
    }
    foreach ($key in 'websiteUrl', 'privacyUrl', 'termsOfUseUrl') {
        if ($PSBoundParameters.ContainsKey($key)) { $app.developer.$key = $PSBoundParameters[$key] }
        $url = [uri] $app.developer.$key
        if (!$url.IsAbsoluteUri -or $url.Scheme -ne 'https' -or $url.HostNameType -ne 'Dns' -or !$url.IsDefaultPort -or $url.UserInfo -or $url.Query -or $url.Fragment -or
            $url.Host -notmatch '\.[a-z]{2,}\z' -or $url.Host -match '(?:^|\.)(?:invalid|localhost|local|internal|home\.arpa|test|example|example\.(?:org|net|com))\z') {
            throw "Supply an approved public HTTPS $key; review publisher URLs cannot be installed."
        }
    }
    $endpoint = ([uri] $TenantUrl).GetLeftPart([UriPartial]::Authority) + $route
    $remote.mcpServerUrl = $endpoint
    $runtime.spec.url = $endpoint
    foreach ($file in 'manifest.json', 'ai-plugin.json') {
        $bytes[$file] = $utf8.GetBytes((ConvertTo-Json -InputObject $json[$file] -Depth 100) + "`n")
    }
} elseif ($remote.mcpServerUrl -cne ($reviewOrigin + $route)) {
    throw 'Review packages must use the non-routable review endpoint. For a tenant package pass -TenantUrl.'
}

if (!$OutputPath) {
    $name = if ($isPilot) { 'employee-hub-plugin.zip' } else { 'employee-hub-local-review.zip' }
    $OutputPath = Join-Path $PSScriptRoot $name
}
$destination = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
if ([IO.Path]::GetExtension($destination) -ine '.zip') { throw 'OutputPath must be a ZIP file.' }
Add-Type -AssemblyName System.IO.Compression
$buffer = [IO.MemoryStream]::new()
try {
    $archive = [IO.Compression.ZipArchive]::new($buffer, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($file in $files) {
            $entry = $archive.CreateEntry($file)
            $entry.LastWriteTime = [datetimeoffset] '2000-01-01T00:00:00Z'
            $stream = $entry.Open()
            try { $stream.Write($bytes[$file], 0, $bytes[$file].Length) } finally { $stream.Dispose() }
        }
    } finally { $archive.Dispose() }
    [IO.File]::WriteAllBytes($destination, $buffer.ToArray())
} finally { $buffer.Dispose() }
Write-Output "Created $destination for $($remote.mcpServerUrl). Nothing was deployed."
