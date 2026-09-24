<#
.SYNOPSIS
    One command from the built .sppkg to a deployed, tenant-wide app (todo.md 8.9 N2).

.DESCRIPTION
    Runs the tenant pre-flight checks in order and stops at the first
    pre-flight item that fails, naming it and the fix. Nothing is uploaded until
    every pre-flight item has passed.

    Pre-flight, local (before any sign-in):
      1. the .sppkg exists, is this solution, allows tenant-wide deployment,
         and was built AFTER the version bump: its solution and feature
         versions equal config/package-solution.json, where they moved
         together (R13); and was built after the last source change
         (scripts/check-package-fresh.mjs, N2a)
      2. the agent package inside it passes scripts/validate-agent-package.mjs
         (the inputSchema is type + properties only, the ZIP matches teams/)
    Pre-flight, tenant:
      3. you are a site collection admin on the tenant App Catalog
      4. custom script is enabled on the App Catalog today (it re-disables
         itself every 24 h; the upload fails with "Access denied" when it has)
      5. the package version is higher than the catalog's, or equal and
         already deployed (then nothing is uploaded -- idempotent)

    Then Add-PnPApp -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment,
    read back with Get-PnPApp. Then, only with -SetTenantSetting, the tenant
    settings DocumentIntake.Store + DocumentIntake.SharePoint.SiteUrl, set the
    same way provision-records-library.ps1 sets them.

    What it cannot do is printed as numbered manual steps at the end: Add to
    Teams is browser-only here (Sync-PnPAppToTeams rejects a custom Entra app's
    token, docs/GOTCHAS.md), and whether Copilot can call the tool is only
    provable in Copilot (the checklist's last gate).

    Every value comes from tenant.local.json when it is not passed (todo.md 8.9
    N1). The App Catalog is found from the tenant; pass -AppCatalogUrl to skip
    that lookup.

.PARAMETER SetTenantSetting
    Also point the tenant at the SharePoint store on the records site. Moves the
    whole tenant from sample data to live filing, so it is never the default.

.PARAMETER KeepCustomScriptOff
    Pre-flight 4 turns custom script on for the App Catalog by default
    (Set-PnPTenantSite -DenyAddAndCustomizePages:$false; needs a SharePoint
    administrator) and waits for it, because Microsoft re-applies the
    setting every 24 hours and the upload cannot succeed without it. Pass
    this switch to stop instead of changing the tenant setting.

.PARAMETER PreflightOnly
    Run every pre-flight check, report, and change nothing.

.PARAMETER InstructionUpdate
    The first of the two deploys that change the agent's instructions
    (todo.md L11 B). Add to Teams refuses a package that keeps
    $[file('instruction.txt')] (400), so the agent record never takes new
    instructions from one; an inlined package gets through, but unbinds the
    tool (D17). With this switch, pre-flight 2 accepts an inlined package
    (validate-agent-package --allow-inline) and stops unless the package IS
    inlined (build it with `npm run build:instruction-update`). The steps at
    the end are the record check and the second, placeholder deploy that
    rebinds the tool. Never the default (R34).

.PARAMETER PackagePath
    Defaults to sharepoint/solution/file-uploader.sppkg.

.EXAMPLE
    ./scripts/deploy.ps1 -PreflightOnly

.EXAMPLE
    ./scripts/deploy.ps1

.EXAMPLE
    ./scripts/deploy.ps1 -SetTenantSetting -KeepCustomScriptOff

.EXAMPLE
    ./scripts/deploy.ps1 -InstructionUpdate

.NOTES
    Requires PowerShell 7+ and PnP.PowerShell, and Node for pre-flight 2.
#>

[CmdletBinding()]
param(
    [string] $PackagePath,
    [string] $SiteUrl,
    [string] $ClientId,
    [string] $AppCatalogUrl,
    [switch] $SetTenantSetting,
    [switch] $KeepCustomScriptOff,
    [switch] $PreflightOnly,
    [switch] $InstructionUpdate,
    [string] $ConfigPath
)

$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw "This script needs PowerShell 7+. You are on $($PSVersionTable.PSVersion). Run it from pwsh, not Windows PowerShell 5.1."
}

. (Join-Path $PSScriptRoot 'TenantConfig.ps1')
$componentRoot = Split-Path -Parent $PSScriptRoot
$tenant = if ($PSBoundParameters.ContainsKey('ConfigPath')) { Read-TenantConfig -Path $ConfigPath } else { Read-TenantConfig }
if (-not $PSBoundParameters.ContainsKey('SiteUrl'))  { $SiteUrl  = $tenant.SiteUrl }
if (-not $PSBoundParameters.ContainsKey('ClientId')) { $ClientId = $tenant.ClientId }
if ([string]::IsNullOrWhiteSpace($PackagePath)) { $PackagePath = Join-Path $componentRoot 'sharepoint/solution/file-uploader.sppkg' }
if ($null -ne $tenant.Path) { Write-Host "Tenant configuration: $($tenant.Path)" -ForegroundColor DarkGray }

$done   = [System.Collections.Generic.List[string]]::new()
$manual = [System.Collections.Generic.List[string]]::new()

function Write-Step { param([string] $m) Write-Host "`n=== $m" -ForegroundColor Cyan }
function Write-Pass { param([string] $m) Write-Host "  PASS $m" -ForegroundColor Green }
function Stop-Preflight {
    param([string] $Item, [string] $Detail, [string] $Fix)
    Write-Host "  FAIL $Item" -ForegroundColor Red
    if ($Detail) { Write-Host "       $Detail" -ForegroundColor Red }
    if ($Fix)    { Write-Host "       Fix: $Fix" -ForegroundColor Yellow }
    Write-Host "`nStopped at pre-flight: $Item. Nothing was uploaded or changed." -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 1. The package, locally
# ---------------------------------------------------------------------------
Write-Step "Pre-flight 1 -- the package"

if (-not (Test-Path -LiteralPath $PackagePath -PathType Leaf)) {
    Stop-Preflight 'package present' "No package at $PackagePath." 'npm run build'
}
$PackagePath = (Resolve-Path -LiteralPath $PackagePath).Path

$config = Get-Content -LiteralPath (Join-Path $componentRoot 'config/package-solution.json') -Raw | ConvertFrom-Json
$solution = $config.solution

Add-Type -AssemblyName System.IO.Compression.FileSystem
function Read-ZipXml {
    param($Zip, [string] $Name)
    $entry = $Zip.GetEntry($Name)
    if ($null -eq $entry) { return $null }
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { [xml] $reader.ReadToEnd() } finally { $reader.Dispose() }
}
$zip = [System.IO.Compression.ZipFile]::OpenRead($PackagePath)
try {
    $app = (Read-ZipXml $zip 'AppManifest.xml').App
    $packageFeatures = @{}
    foreach ($entry in $zip.Entries | Where-Object { $_.FullName -match '^feature_([0-9a-f-]{36})\.xml$' }) {
        $id = $Matches[1]
        $packageFeatures[$id] = (Read-ZipXml $zip $entry.FullName).Feature.Version
    }
}
finally { $zip.Dispose() }

if ($null -eq $app) { Stop-Preflight 'package readable' "$PackagePath has no AppManifest.xml." 'npm run build' }
if ($app.ProductID -ne $solution.id) {
    Stop-Preflight 'package is this solution' "The package's ProductID is $($app.ProductID); config/package-solution.json says $($solution.id)." 'Deploy the package this component builds.'
}
Write-Pass "package present: $PackagePath"

$version = [version] $app.Version
if ($app.Version -ne $solution.version) {
    Stop-Preflight 'package built after the version bump' `
        "The package is $($app.Version); config/package-solution.json is $($solution.version). The package was built before the bump." `
        'npm run build, then commit the .sppkg and agent ZIP from that one build (R13, R20).'
}
foreach ($feature in $solution.features) {
    if ($feature.version -ne $solution.version) {
        Stop-Preflight 'feature version moved with the solution version (R13)' `
            "Feature '$($feature.title)' is $($feature.version) while the solution is $($solution.version). SharePoint will update the catalog and never re-activate the feature." `
            'Bump solution.version and every features[].version together, then npm run build.'
    }
    if ($packageFeatures[$feature.id] -ne $feature.version) {
        Stop-Preflight 'package feature version matches config' `
            "The package carries feature $($feature.id) at '$($packageFeatures[$feature.id])', config says $($feature.version)." 'npm run build'
    }
}
Write-Pass "version $version -- solution and every feature, in config and in the package"

# Right versions, stale code: the 1.0.5.0 deploy shipped a package built before
# the last source change (todo.md 8.9 N2a). The rule lives in Node so it is
# tested offline.
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
    Stop-Preflight 'package built after the last source change' 'Node is not on PATH, so scripts/check-package-fresh.mjs cannot run.' 'Install Node 22 (docs/PREREQUISITES.md) and re-run.'
}
Push-Location $componentRoot
try { $freshness = & $node.Source 'scripts/check-package-fresh.mjs' $PackagePath 2>&1; $fresh = $LASTEXITCODE -eq 0 }
finally { Pop-Location }
if (-not $fresh) {
    Stop-Preflight 'package built after the last source change' (($freshness | Out-String).Trim()) 'npm run build, then commit the .sppkg and agent ZIP from that one build (R13, R20, R21).'
}
Write-Pass (($freshness | Select-Object -Last 1) -replace '^\s+', '')

if ($app.SkipFeatureDeployment -ne 'true') {
    Stop-Preflight 'package allows tenant-wide deployment' 'SkipFeatureDeployment is not true in the package, so -SkipFeatureDeployment would do nothing.' 'Set solution.skipFeatureDeployment to true in config/package-solution.json and rebuild.'
}
Write-Pass 'tenant-wide deployment allowed (SkipFeatureDeployment)'

# ---------------------------------------------------------------------------
# 2. The agent package inside it
# ---------------------------------------------------------------------------
Write-Step "Pre-flight 2 -- the agent package"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
    Stop-Preflight 'agent package validated' 'Node is not on PATH, so scripts/validate-agent-package.mjs cannot run.' 'Install Node 22 (docs/PREREQUISITES.md) and re-run.'
}
Push-Location $componentRoot
$validatorArgs = @('scripts/validate-agent-package.mjs')
if ($InstructionUpdate) { $validatorArgs += '--allow-inline' }
try { $validation = & $node.Source @validatorArgs 2>&1; $validated = $LASTEXITCODE -eq 0 }
finally { Pop-Location }
if (-not $validated) {
    Stop-Preflight 'agent package validated' (($validation | Out-String).Trim()) 'Fix what it names, npm run build, re-run.'
}
$validatedLine = (($validation | Select-Object -Last 1) -replace '^\s+', '')
$packageInlined = $validatedLine -match 'instructions INLINED'
if ($InstructionUpdate -and -not $packageInlined) {
    Stop-Preflight 'package inlines the instructions (-InstructionUpdate)' `
        "This package keeps `$[file('instruction.txt')]. Add to Teams would answer 400 and the agent record would keep its old instructions (todo.md L11)." `
        'npm run build:instruction-update, then re-run with -InstructionUpdate. Or drop the switch for a normal deploy.'
}
Write-Pass $validatedLine
if ($InstructionUpdate) {
    Write-Host '  NOTE this package unbinds the tool until the next placeholder deploy. The agent will say the form is not available (D16) until then.' -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Sign in: the App Catalog, found from the tenant unless given
# ---------------------------------------------------------------------------
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
}
if ([string]::IsNullOrWhiteSpace($ClientId)) { throw ((Get-TenantConfigMissing -Parameter 'ClientId' -Field 'clientId' -Config $tenant) + ' (PNP_CLIENT_ID is not set either.)') }
if ([string]::IsNullOrWhiteSpace($AppCatalogUrl)) {
    if ([string]::IsNullOrWhiteSpace($SiteUrl)) {
        throw ((Get-TenantConfigMissing -Parameter 'SiteUrl' -Field 'sharepoint.siteUrl' -Config $tenant) + ' It is how the App Catalog is found; or pass -AppCatalogUrl.')
    }
    Write-Step "Finding the tenant App Catalog from $SiteUrl"
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
    $AppCatalogUrl = Get-PnPTenantAppCatalogUrl
    if ([string]::IsNullOrWhiteSpace($AppCatalogUrl)) {
        Stop-Preflight 'tenant App Catalog exists' 'Get-PnPTenantAppCatalogUrl returned nothing.' 'Create the tenant App Catalog in the SharePoint admin centre.'
    }
}
$AppCatalogUrl = $AppCatalogUrl.TrimEnd('/')
Write-Step "Connecting to the App Catalog $AppCatalogUrl"
Connect-PnPOnline -Url $AppCatalogUrl -Interactive -ClientId $ClientId

# ---------------------------------------------------------------------------
# 3. Site collection admin on the App Catalog
# ---------------------------------------------------------------------------
Write-Step "Pre-flight 3 -- you are a site collection admin on the App Catalog"
$me = Invoke-PnPSPRestMethod -Url '/_api/web/currentuser?$select=IsSiteAdmin,Email,LoginName' -Method Get
$isAdmin = if ($null -ne $me.IsSiteAdmin) { $me.IsSiteAdmin } else { $me.d.IsSiteAdmin }
$who = if ($me.Email) { $me.Email } elseif ($me.d.Email) { $me.d.Email } else { 'the signed-in account' }
if ($isAdmin -ne $true) {
    Stop-Preflight 'site collection admin on the App Catalog' "$who is not (IsSiteAdmin is false on $AppCatalogUrl)." `
        "A SharePoint admin runs: Set-PnPTenantSite -Url $AppCatalogUrl -Owners $who"
}
Write-Pass "$who is a site collection admin"

# ---------------------------------------------------------------------------
# 4. Custom script on the App Catalog, today
# ---------------------------------------------------------------------------
Write-Step "Pre-flight 4 -- custom script is enabled on the App Catalog"
function Get-DenyCustomScript {
    [string] (Get-PnPTenantSite -Identity $AppCatalogUrl -Detailed).DenyAddAndCustomizePages
}
$deny = $null
try { $deny = Get-DenyCustomScript }
catch {
    Write-Host "  WARN could not read DenyAddAndCustomizePages ($($_.Exception.Message)). That read needs a SharePoint administrator." -ForegroundColor Yellow
    Write-Host "       Continuing; if the upload then fails with 'Access denied', this setting is why (docs/GOTCHAS.md)." -ForegroundColor Yellow
}
if ($deny -eq 'Enabled') {
    $fix = "Set-PnPTenantSite -Identity $AppCatalogUrl -DenyAddAndCustomizePages:`$false  (the real run does this itself unless -KeepCustomScriptOff)"
    if ($PreflightOnly) {
        Write-Host "  WARN DenyAddAndCustomizePages is Enabled (Microsoft re-applies it every 24 h). The real run turns it off before uploading." -ForegroundColor Yellow
    }
    elseif ($KeepCustomScriptOff) {
        Stop-Preflight 'custom script enabled on the App Catalog' 'DenyAddAndCustomizePages is Enabled and -KeepCustomScriptOff was passed: the upload would fail with "Access denied".' $fix
    }
    else {
    Write-Host "  Turning custom script on (DenyAddAndCustomizePages is Enabled; Microsoft re-applies it every 24 h) ..." -ForegroundColor Yellow
    Set-PnPTenantSite -Identity $AppCatalogUrl -DenyAddAndCustomizePages:$false
    $done.Add("Turned custom script on for the App Catalog (DenyAddAndCustomizePages Disabled; it re-enables itself within 24 h)")
    $deadline = (Get-Date).AddSeconds(120)
    do { Start-Sleep -Seconds 10; $deny = Get-DenyCustomScript } while ($deny -eq 'Enabled' -and (Get-Date) -lt $deadline)
    if ($deny -eq 'Enabled') {
        Stop-Preflight 'custom script enabled on the App Catalog' 'Set it to Disabled, but it still reads Enabled after two minutes.' 'Wait a few minutes and re-run.'
    }
    }
}
if ($null -ne $deny) { Write-Pass "DenyAddAndCustomizePages is $deny" }

# ---------------------------------------------------------------------------
# 5. The catalog's version
# ---------------------------------------------------------------------------
Write-Step "Pre-flight 5 -- the package is newer than the catalog's"
function Find-CatalogApp {
    Get-PnPApp -Scope Tenant | Where-Object {
        ($_.PSObject.Properties['ProductId'] -and "$($_.ProductId)" -eq $solution.id) -or $_.Title -eq $solution.name
    } | Select-Object -First 1
}
$existing = Find-CatalogApp
$action = 'upload'
if ($null -eq $existing) {
    Write-Pass "not in the catalog yet -- a first deployment of $version"
}
else {
    $catalogVersion = [version] "$($existing.AppCatalogVersion)"
    if ($catalogVersion -gt $version) {
        Stop-Preflight 'package newer than the catalog' "The catalog has $catalogVersion; this package is $version." 'Bump solution.version and every features[].version above the catalog (R13), then npm run build.'
    }
    elseif ($catalogVersion -eq $version) {
        if ($existing.Deployed) {
            $action = 'none'
            Write-Pass "the catalog already has $version, deployed -- nothing to upload"
        }
        else {
            $action = 'publish'
            Write-Pass "the catalog has $version but it is not deployed -- it will be published, not re-uploaded"
        }
    }
    else {
        Write-Pass "the catalog has $catalogVersion; this package is $version"
    }
}

if ($PreflightOnly) {
    Write-Host "`nEvery pre-flight item passed. -PreflightOnly: nothing was uploaded or changed." -ForegroundColor Cyan
    exit 0
}

# ---------------------------------------------------------------------------
# Deploy
# ---------------------------------------------------------------------------
Write-Step "Deploying $version tenant-wide"
switch ($action) {
    'upload' {
        Add-PnPApp -Path $PackagePath -Scope Tenant -Publish -Overwrite -SkipFeatureDeployment | Out-Null
        $done.Add("Uploaded and deployed $version tenant-wide (Add-PnPApp -Publish -Overwrite -SkipFeatureDeployment)")
    }
    'publish' {
        Publish-PnPApp -Identity $existing.Id -Scope Tenant -SkipFeatureDeployment
        $done.Add("Published $version tenant-wide (it was already uploaded)")
    }
    'none' {
        Write-Host "  = $version already deployed (nothing uploaded)" -ForegroundColor DarkGray
    }
}

# Read back, rather than trusting the cmdlet: Get-PnPApp is the least unreliable narrator here.
$deployed = Find-CatalogApp
if ($null -eq $deployed -or -not $deployed.Deployed -or ([version] "$($deployed.AppCatalogVersion)") -ne $version) {
    $state = if ($null -eq $deployed) { 'not found' } else { "version $($deployed.AppCatalogVersion), Deployed=$($deployed.Deployed)" }
    throw "After deploying, Get-PnPApp reads $state -- expected $version, Deployed=True. Check the App Catalog's Manage apps page."
}
Write-Pass "Get-PnPApp: $($deployed.Title) $($deployed.AppCatalogVersion), Deployed=True, catalog Id $($deployed.Id)"

# ---------------------------------------------------------------------------
# Tenant settings (opt-in)
# ---------------------------------------------------------------------------
if ($SetTenantSetting) {
    Write-Step "Tenant settings $StoreKey + $SharePointSiteUrlKey (Decisions 11, 17)"
    if ([string]::IsNullOrWhiteSpace($SiteUrl)) {
        throw (Get-TenantConfigMissing -Parameter 'SiteUrl' -Field 'sharepoint.siteUrl' -Config $tenant)
    }
    Set-DocumentIntakeStore -SiteUrl $SiteUrl
    $done.Add("Tenant settings point Document Intake at $($SiteUrl.TrimEnd('/')) -- live filing in every site of the tenant")
}
else {
    $store = $null
    try { $store = Get-StorageEntityValue -Key $StoreKey } catch { $store = "unreadable ($($_.Exception.Message))" }
    $state = if ($null -eq $store) { 'unset -- the component runs on sample data' } else { "'$store'" }
    Write-Host "`n  Tenant settings not touched. $StoreKey is $state. -SetTenantSetting switches the tenant to live filing." -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# What it did, and what it could not
# ---------------------------------------------------------------------------
$agentManifest = Get-Content -LiteralPath (Join-Path $componentRoot 'copilot/manifest.json') -Raw | ConvertFrom-Json
$manageApps = "$AppCatalogUrl/_layouts/15/tenantAppCatalog.aspx/manageApps"
if ($InstructionUpdate) {
    # todo.md L11 B, step 1 of 2. Step 2 is a normal placeholder deploy, at once.
    $manual.Add("Add to Teams, in the browser (PowerShell is refused with 10005): $manageApps -> select '$($deployed.Title)' -> Add to Teams. For this inlined package it is expected to succeed.")
    $manual.Add("Confirm the record: admin centre -> Agents (admin.cloud.microsoft/#/copilot/agents) -> Document Intake shows Version $($agentManifest.version) and the new instructions. NEVER uninstall the record (AGENTS.md R38).")
    $manual.Add("Expected now: the tool is unbound. The agent says the form is not available and nothing was filed (D16). Do not file anything.")
    $manual.Add("At once, the second deploy (placeholder, rebinds the tool): npm run gen:copilot-assets (restores `$[file('instruction.txt')]) -> bump solution.version and every features[].version to the next version (R13), keep copilot/manifest.json at $($agentManifest.version) -> npm run build -> commit -> ./scripts/deploy.ps1 (NO -InstructionUpdate) -> NO Add to Teams.")
    $manual.Add("Pass: in a NEW chat with -developer on, the form renders, Raw info names fileDocuments in functionsSelectedForInvocation, and the reply says choose. If it has not rebound within an hour, delete or reinstall nothing (R38, §9): record the debug card and stop.")
}
else {
    $manual.Add("FIRST DEPLOY only: Add to Teams, in the browser (PowerShell is refused with 10005): $manageApps -> select '$($deployed.Title)' -> Add to Teams. A new .sppkg alone does not need it. It is already on all sites. For a package that keeps `$[file('instruction.txt')], Add to Teams answers 400 and the agent record keeps its old instructions, version and description (todo.md L11); the tool still binds. To change the instructions, use -InstructionUpdate.")
    $manual.Add("Confirm the record in the Microsoft 365 admin centre -> Agents (admin.cloud.microsoft/#/copilot/agents). NEVER uninstall the record to reset it (AGENTS.md R38).")
    $manual.Add("Wait 5-10 min, then admin.cloud.microsoft/#/copilot/agents -> install to yourself to skip the store delay.")
    $manual.Add("The last gate: a NEW chat with the agent, send -developer on, one request that should file, then Agent debug info -> Raw info: functionsSelectedForInvocation must name the tool and the component must render.")
    $manual.Add("If the first call shows the host's 'Something went wrong' card with a 200 in the debug card, send the request again: that is the host's cold start, not the component. copilot/manifest.json is at $($agentManifest.version); the record's label only moves when an Add to Teams succeeds.")
}

Write-Host "`n=== Done" -ForegroundColor Cyan
if ($done.Count -eq 0) { Write-Host "  Nothing changed: $version was already deployed." -ForegroundColor DarkGray }
foreach ($line in $done) { Write-Host "  + $line" -ForegroundColor Green }
Write-Host "  App Catalog Id (for uninstall): $($deployed.Id)" -ForegroundColor Green

Write-Host "`n=== By hand, in this order" -ForegroundColor Cyan
for ($i = 0; $i -lt $manual.Count; $i++) { Write-Host "  $($i + 1). $($manual[$i])" -ForegroundColor Yellow }
