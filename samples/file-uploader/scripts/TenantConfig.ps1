<#
.SYNOPSIS
    Reads tenant.local.json -- the one place a tenant is named (todo.md 8.9 N1).

.DESCRIPTION
    Dot-sourced by the tenant scripts:

        . (Join-Path $PSScriptRoot 'TenantConfig.ps1')

    tenant.local.json sits at the component root, is git-ignored, and is a copy
    of the committed tenant.example.json with real values. check:tenant-config
    fails the build if it is ever tracked.

    Precedence for every value, highest first:
      1. the script's own parameter, when passed on the command line
      2. tenant.local.json
      3. PNP_CLIENT_ID (clientId only), then the built-in default
    A value still holding the example's placeholder counts as unset, so a copied
    but unfilled file fails with a message naming the field, not with a sign-in
    to "<tenant>".

    The tenant setting keys (Decision 17) are defined here too, so the two
    scripts and the component cannot disagree about them silently: the component
    side is services/storeSetting.ts, and its test pins the same strings.
#>

$script:StoreKey             = 'DocumentIntake.Store'
$script:SharePointSiteUrlKey = 'DocumentIntake.SharePoint.SiteUrl'
# Pre-Decision 17. Nothing reads it any more; the scripts only look for it so a
# tenant still carrying it is told to remove it.
$script:LegacySiteUrlKey     = 'DocumentIntake.RecordsSiteUrl'

function Get-DefaultTenantConfigPath {
    Join-Path (Split-Path -Parent $PSScriptRoot) 'tenant.local.json'
}

function Test-TenantPlaceholder {
    param([string] $Value)
    [string]::IsNullOrWhiteSpace($Value) -or
        $Value.Contains('<') -or
        $Value -eq '00000000-0000-0000-0000-000000000000'
}

<#
    Returns the file's values, flattened, with placeholders read as $null:
      Path, TenantId, ClientId, Auth, CertificatePath, CertificateThumbprint,
      Store, SiteUrl, LibraryName, FilingUsers
    Path is $null when there is no file; every other field is then $null too,
    apart from ClientId (PNP_CLIENT_ID) and LibraryName ('Records').
#>
function Read-TenantConfig {
    param([string] $Path = (Get-DefaultTenantConfigPath))

    $json = $null
    $found = $false
    if (-not [string]::IsNullOrWhiteSpace($Path) -and (Test-Path -LiteralPath $Path -PathType Leaf)) {
        $found = $true
        try {
            $json = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
        }
        catch {
            throw "$Path is not valid JSON ($($_.Exception.Message)). Start again from tenant.example.json."
        }
    }

    function Pick { param($Value) if (Test-TenantPlaceholder ([string] $Value)) { $null } else { ([string] $Value).Trim() } }

    $sharepoint = if ($null -ne $json) { $json.sharepoint } else { $null }
    $clientId = Pick $json.clientId
    if ($null -eq $clientId) { $clientId = Pick $env:PNP_CLIENT_ID }
    $library = Pick $sharepoint.libraryName
    if ($null -eq $library) { $library = 'Records' }
    $auth = Pick $json.auth
    if ($null -eq $auth) { $auth = 'user' }

    [pscustomobject] @{
        Path            = if ($found) { (Resolve-Path -LiteralPath $Path).Path } else { $null }
        TenantId        = Pick $json.tenantId
        ClientId        = $clientId
        Auth            = $auth
        CertificatePath = Pick $json.certificatePath
        CertificateThumbprint = Pick $json.certificateThumbprint
        Store           = Pick $json.store
        SiteUrl         = if ($null -ne (Pick $sharepoint.siteUrl)) { (Pick $sharepoint.siteUrl).TrimEnd('/') } else { $null }
        LibraryName     = $library
        FilingUsers     = @($json.filingUsers | Where-Object { -not (Test-TenantPlaceholder ([string] $_)) })
    }
}

<#
    The error for a value found nowhere. Names the flag and the file field, so
    whoever reads it knows both ways to supply it.
#>
function Get-TenantConfigMissing {
    param([string] $Parameter, [string] $Field, $Config)
    $where = if ($null -ne $Config.Path) { "$field in $($Config.Path) is empty or still the example placeholder" }
             else { "there is no tenant.local.json (copy tenant.example.json to $(Get-DefaultTenantConfigPath) and fill it in)" }
    "No -$Parameter supplied, and $where."
}

# ---------------------------------------------------------------------------
# The tenant settings (Decisions 11, 17), shared by provision, verify and deploy
# so -SetTenantSetting means one thing wherever it is passed. Needs an open
# PnP connection; storage entities are tenant-wide, so any site will do for a
# read, and a write goes to the tenant app catalog whichever site is connected.
# ---------------------------------------------------------------------------

<#
    Reads a key the way the component reads it (REST GetStorageEntity), so
    "already there" means what it says. $null for an unset key -- REST answers
    odata.null where Get-PnPStorageEntity -Key throws (docs/GOTCHAS.md). Throws
    when the read itself fails.
#>
function Get-StorageEntityValue {
    param([Parameter(Mandatory)] [string] $Key)
    $entity = Invoke-PnPSPRestMethod -Url "/_api/web/GetStorageEntity('$Key')" -Method Get
    $value = if ($null -ne $entity.Value) { $entity.Value } else { $entity.d.Value }
    if ([string]::IsNullOrWhiteSpace($value)) { $null } else { $value.Trim() }
}

function Set-StorageEntityValueOnce {
    param([Parameter(Mandatory)] [string] $Key, [Parameter(Mandatory)] [string] $Value,
          [Parameter(Mandatory)] [string] $Description, [Parameter(Mandatory)] [scriptblock] $Same)
    $current = $null
    try { $current = Get-StorageEntityValue -Key $Key }
    catch { Write-Host "  ! could not read $Key ($($_.Exception.Message)); setting it anyway" -ForegroundColor Yellow }

    if ($null -ne $current -and (& $Same $current)) {
        Write-Host "  = $Key = $Value (already there)" -ForegroundColor DarkGray
        return
    }
    try { Set-PnPStorageEntity -Key $Key -Value $Value -Description $Description }
    catch {
        throw "Could not set $Key ($($_.Exception.Message)). Writing a tenant property needs an owner of the tenant app catalog site; see docs/TENANT-SETUP.md §7."
    }
    $was = if ($null -eq $current) { 'unset' } else { "was '$current'" }
    Write-Host "  + $Key = $Value ($was)" -ForegroundColor Green
}

<#
    Points the tenant at the SharePoint store on $SiteUrl, idempotently:
    the site key first (Store=sharepoint with no site is an error in the
    component, so this order never opens a window that shows one), then the
    store key, then removes the pre-Decision 17 key if the tenant still has it.
#>
function Set-DocumentIntakeStore {
    param([Parameter(Mandatory)] [string] $SiteUrl)
    $site = $SiteUrl.Trim().TrimEnd('/')

    Set-StorageEntityValueOnce -Key $script:SharePointSiteUrlKey -Value $site `
        -Description 'Records site for the Document Intake Copilot component (read when DocumentIntake.Store is sharepoint).' `
        -Same ({ param($c) $c.TrimEnd('/') -ieq $site }.GetNewClosure())
    Set-StorageEntityValueOnce -Key $script:StoreKey -Value 'sharepoint' `
        -Description 'Store for the Document Intake Copilot component. Remove it to return the tenant to sample data.' `
        -Same { param($c) $c -ieq 'sharepoint' }

    $legacy = $null
    try { $legacy = Get-StorageEntityValue -Key $script:LegacySiteUrlKey }
    catch { Write-Host "  ! could not read $($script:LegacySiteUrlKey) ($($_.Exception.Message)); not removing it" -ForegroundColor Yellow }
    if ($null -ne $legacy) {
        Remove-PnPStorageEntity -Key $script:LegacySiteUrlKey
        Write-Host "  + removed the pre-Decision 17 key $($script:LegacySiteUrlKey) (was '$legacy')" -ForegroundColor Green
    }
}
