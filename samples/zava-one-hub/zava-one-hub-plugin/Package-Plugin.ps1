#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://[a-z0-9][a-z0-9-]*\.sharepoint\.com/?$')]
    [string] $TenantUrl
)

$ErrorActionPreference = 'Stop'

function Write-JsonFile {
    param([string] $Name, [object] $Value)
    $json = ConvertTo-Json -InputObject $Value -Depth 100
    [System.IO.File]::WriteAllText(
        (Join-Path $PSScriptRoot $Name),
        $json + [Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )
}

$origin = ([uri] $TenantUrl).GetLeftPart([System.UriPartial]::Authority).ToLowerInvariant()
if (([uri] $origin).DnsSafeHost -match '-(?:admin|my)\.sharepoint\.com$') {
    throw 'Use the tenant SharePoint root host, not the admin center or personal OneDrive host.'
}
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$plugin = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ai-plugin.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$agent = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'declarativeAgent.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$remote = $manifest.agentConnectors[0].toolSource.remoteMcpServer
$runtime = $plugin.runtimes[0]

if ($plugin.schema_version -ne 'v2.4' -or
    $plugin.'$schema' -ne 'https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json') {
    throw 'The agent action manifest must use schema_version v2.4 and the matching v2.4 schema URL.'
}
if (@($plugin.runtimes).Count -ne 1 -or $runtime.type -ne 'RemoteMCPServer' -or
    @($plugin.functions).Count -ne 0 -or
    @($runtime.run_for_functions).Count -ne 1 -or $runtime.run_for_functions[0] -ne '*') {
    throw 'Use dynamic discovery: functions must be empty and the RemoteMCPServer runtime must use run_for_functions: ["*"].'
}
if ($null -ne $remote.mcpToolDescription -or $null -ne $runtime.spec.mcp_tool_description) {
    throw 'Remove static tool-description references. Both entry points must discover tools dynamically.'
}

$expectedEndpoint = [uri] $remote.mcpServerUrl
if ($expectedEndpoint.Query -notmatch '^\?solutionId=([0-9a-f-]{36})$') {
    throw 'The manifest must identify the deployed SPFx solution with a solutionId query parameter.'
}
$solutionId = [guid] $Matches[1]
if ([string]::IsNullOrWhiteSpace($agent.instructions) -or $agent.instructions -match '\$\[') {
    throw 'Provide literal agent instructions and resolve placeholders before creating a manual package.'
}
if ($manifest.id -eq '986dd51d-45fe-4c8f-bcdc-ccbc0c9b22ad' -or
    $manifest.id -eq $solutionId.ToString()) {
    throw 'The plug-in app ID must differ from the original Zava One app and the SPFx solution ID.'
}

$packageFiles = @('manifest.json', 'declarativeAgent.json', 'ai-plugin.json', 'color.png', 'outline.png')
foreach ($name in $packageFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $name) -PathType Leaf)) {
        throw "Missing package file: $name."
    }
}

$endpoint = "$origin/_api/mcp/spfx?solutionId=$solutionId"
$remote.mcpServerUrl = $endpoint
$runtime.spec.url = $endpoint
Write-JsonFile 'manifest.json' $manifest
Write-JsonFile 'ai-plugin.json' $plugin

$destination = Join-Path $PSScriptRoot 'zava-one-hub-plugin.zip'
$paths = @($packageFiles | ForEach-Object { Join-Path $PSScriptRoot $_ })
Compress-Archive -LiteralPath $paths -DestinationPath $destination -Force
Write-Output "Packaged dynamic SPFx tool discovery for $origin."
Write-Output "App ID: $($manifest.id); version: $($manifest.version)."
Write-Output "SPFx solution ID: $solutionId."
Write-Output "Package: $destination"
