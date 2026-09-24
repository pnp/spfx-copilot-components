<#
.SYNOPSIS
    Reads the records library back and prints what SharePoint actually stored.

.DESCRIPTION
    Read-only. Provisioning reports what it *asked* for; this reports what is
    there, which is the only thing the live IDocumentStoreService can rely on.
    Run it after provision-records-library.ps1 and check the FAIL lines.

    Checks:
      - the seven site columns exist, are in the right group, and carry the
        right type and display name
      - FilingDepartment and FilingStatus carry exactly the choices the
        component maps, in order, with no fill-in
      - ReportOwner selects individual people only, one at a time
      - Amount shows 2 decimals and DocumentDate is date-only
      - the choice, owner, decimals and date-only settings again on the
        LIBRARY's own copies of those columns -- a site-column edit made after
        the library took the column does not reach the copy unless pushed
      - each SITE content type's field links: Required and the per-kind
        display-name override on DocumentDate ("Invoice date" / "Period end")
      - the LIBRARY's own content types -- the copies getKinds() actually reads:
        the same field links, no required link hidden, and nothing on the
        library but Invoice, Expense report and Folder (todo.md Decision 6)
      - the library manages content types, keeps versions, has no content
        approval, and indexes Created and Author
      - the tenant settings (todo.md Decisions 11, 17): DocumentIntake.Store is
        sharepoint and DocumentIntake.SharePoint.SiteUrl points at this site;
        an unset or unknown store is a warning, because the tenant is then
        simply on sample data; the pre-17 key DocumentIntake.RecordsSiteUrl
        still being set is a warning
      - with -FilingUser: each filing user can add, edit and delete items in the
        library -- rollback recycles a half-saved file (todo.md Decision 7)
      - Syntex is a MANUAL check: no documented REST call for "models applied
        to this library" was confirmed, so this script does not guess one

    Every value comes from tenant.local.json at the component root when it is
    not passed on the command line (todo.md 8.9 N1; see TenantConfig.ps1).

.PARAMETER SiteUrl
    The site holding the records library. Defaults to sharepoint.siteUrl in
    tenant.local.json; one or the other is required, because no tenant is
    committed to this repo (AGENTS.md §8).

.PARAMETER FilingUser
    Email addresses of people who will file. Their effective permissions on the
    library are checked. Defaults to filingUsers in tenant.local.json. Without
    either the permission check is skipped, not passed -- the account running
    this script is usually an owner and proves nothing.

.PARAMETER ConfigPath
    A tenant configuration other than ../tenant.local.json.

.EXAMPLE
    ./verify-records-library.ps1
    # every value from tenant.local.json

.EXAMPLE
    ./verify-records-library.ps1 -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" -ClientId "00000000-1111-2222-3333-444444444444"

.EXAMPLE
    ./verify-records-library.ps1 -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" -ClientId "<client id>" `
        -FilingUser "clerk@<tenant>.onmicrosoft.com", "finance@<tenant>.onmicrosoft.com"
#>

[CmdletBinding()]
param(
    [string] $SiteUrl,
    [string] $ClientId,
    [string] $LibraryName,
    [string] $ColumnGroup = 'Document Intake',
    [string[]] $FilingUser = @(),
    [string] $ConfigPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'TenantConfig.ps1')
$tenant = if ($PSBoundParameters.ContainsKey('ConfigPath')) { Read-TenantConfig -Path $ConfigPath } else { Read-TenantConfig }
if (-not $PSBoundParameters.ContainsKey('SiteUrl'))     { $SiteUrl     = $tenant.SiteUrl }
if (-not $PSBoundParameters.ContainsKey('ClientId'))    { $ClientId    = $tenant.ClientId }
if (-not $PSBoundParameters.ContainsKey('LibraryName')) { $LibraryName = $tenant.LibraryName }
if (-not $PSBoundParameters.ContainsKey('FilingUser'))  { $FilingUser  = $tenant.FilingUsers }
if ([string]::IsNullOrWhiteSpace($SiteUrl)) { throw (Get-TenantConfigMissing -Parameter 'SiteUrl' -Field 'sharepoint.siteUrl' -Config $tenant) }
if ($null -ne $tenant.Path) { Write-Host "Tenant configuration: $($tenant.Path)" -ForegroundColor DarkGray }

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw "This script needs PowerShell 7+. You are on $($PSVersionTable.PSVersion). Run it from pwsh, not Windows PowerShell 5.1."
}
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
}
if ([string]::IsNullOrWhiteSpace($ClientId)) { throw ((Get-TenantConfigMissing -Parameter 'ClientId' -Field 'clientId' -Config $tenant) + ' (PNP_CLIENT_ID is not set either.)') }

$script:failures = 0
$script:warnings = 0
function Write-Step { param([string] $m) Write-Host "`n=== $m" -ForegroundColor Cyan }
function Assert-That {
    param([string] $Label, [bool] $Ok, [string] $Detail)
    if ($Ok) { Write-Host "  PASS $Label" -ForegroundColor Green }
    else {
        Write-Host "  FAIL $Label -- $Detail" -ForegroundColor Red
        $script:failures++
    }
}
function Write-Warn { param([string] $m) Write-Host "  WARN $m" -ForegroundColor Yellow; $script:warnings++ }
function Write-Note { param([string] $Tag, [string] $m) Write-Host "  $Tag $m" -ForegroundColor Yellow }

$libInUrl = $LibraryName -replace "'", "''"

# --- REST helpers ------------------------------------------------------------
# Invoke-PnPSPRestMethod answers in either the nometadata or the verbose OData
# shape depending on version; both are handled so a check never reads $null and
# passes for the wrong reason (docs/GOTCHAS.md).

function Get-RestRows {
    param([Parameter(Mandatory)] [string] $Url)
    $resp = Invoke-PnPSPRestMethod -Url $Url -Method Get
    if ($null -ne $resp.value) { return @($resp.value) }
    if ($null -ne $resp.d.results) { return @($resp.d.results) }
    return @()
}

# Site columns, or with -List that list's own copies.
function Get-FieldsUrl {
    param([string] $List)
    if ($List) { return "/_api/web/lists/getbytitle('$($List -replace "'", "''")')/fields" }
    return '/_api/web/fields'
}

function Get-FieldSchema {
    param([Parameter(Mandatory)] [string] $InternalName, [string] $List)
    $resp = Invoke-PnPSPRestMethod -Url "$(Get-FieldsUrl $List)/getbyinternalnameortitle('$InternalName')?`$select=SchemaXml" -Method Get
    $raw = if ($null -ne $resp.SchemaXml) { $resp.SchemaXml } else { $resp.d.SchemaXml }
    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "No SchemaXml returned for $(if ($List) { "$List/" })$InternalName. Refusing to continue: every check on it would read an empty schema."
    }
    return ([xml] $raw).Field
}

function Get-FieldProperties {
    param([Parameter(Mandatory)] [string] $InternalName, [Parameter(Mandatory)] [string[]] $Property, [string] $List)
    $resp = Invoke-PnPSPRestMethod -Url "$(Get-FieldsUrl $List)/getbyinternalnameortitle('$InternalName')?`$select=$($Property -join ',')" -Method Get
    $out = @{}
    foreach ($p in $Property) {
        $v = if ($null -ne $resp.$p) { $resp.$p } else { $resp.d.$p }
        if ($null -eq $v) {
            throw "No $p returned for $(if ($List) { "$List/" })$InternalName. Refusing to continue: a check on it would read `$null."
        }
        $out[$p] = "$v"
    }
    return $out
}

function Get-LinkMap {
    param([Parameter(Mandatory)] [string] $Url, [Parameter(Mandatory)] [string] $Label)
    <#
        REST, after two failed CSOM routes (2026-09-10):
          - FieldLink.DisplayName reads back empty unless explicitly requested,
            which reported persisted overrides as missing;
          - ContentType.SchemaXml loads, but carries no <FieldRefs> for a site
            content type, so parsing it yielded an empty map.
        .../fieldlinks serialises these properties honestly. DisplayName is the
        EFFECTIVE name -- the per-kind override when there is one.
    #>
    $rows = Get-RestRows -Url $Url
    if ($rows.Count -eq 0) {
        throw "No field links returned for '$Label'. Refusing to continue: an empty map would answer every check for the wrong reason."
    }
    $map = @{}
    foreach ($r in $rows) {
        $map[$r.Name] = [pscustomobject]@{
            DisplayName = $r.DisplayName
            Required    = [bool] $r.Required
            Hidden      = [bool] $r.Hidden
        }
    }
    return $map
}

# --- what the component expects ---------------------------------------------

$kinds = @{
    'Invoice' = @{
        Required  = @('FilingDepartment', 'Vendor', 'DocumentDate', 'Amount', 'FilingStatus')
        Optional  = @('ReceiptNumber')
        Absent    = @('ReportOwner')
        DateLabel = 'Invoice date'
    }
    'Expense report' = @{
        Required  = @('FilingDepartment', 'ReportOwner', 'DocumentDate', 'Amount', 'FilingStatus')
        Optional  = @('ReceiptNumber')
        Absent    = @('Vendor')
        DateLabel = 'Period end'
    }
}

# The choice labels services/sharePointConfig.ts maps, in the order the views show.
$choices = @{
    'FilingDepartment' = @('Programs', 'Development', 'Finance', 'Operations')
    'FilingStatus'     = @('Received', 'Pending review', 'Approved', 'Paid', 'Returned')
}

function Assert-KindLinks {
    param([Parameter(Mandatory)] [string] $Label, [Parameter(Mandatory)] $Links, [Parameter(Mandatory)] $Spec)

    foreach ($n in $Spec.Required) {
        if (-not $Links.ContainsKey($n)) { Assert-That "$Label.$n present" $false 'no field link'; continue }
        Assert-That "$Label.$n required" ($Links[$n].Required -eq $true) "Required=$($Links[$n].Required)"
        # The live getKinds() skips hidden links, so a hidden required link would
        # validate filings against less than the library enforces.
        Assert-That "$Label.$n not hidden" ($Links[$n].Hidden -eq $false) 'Hidden=True -- the component would ignore it'
    }
    foreach ($n in $Spec.Optional) {
        if (-not $Links.ContainsKey($n)) { Assert-That "$Label.$n present" $false 'no field link'; continue }
        Assert-That "$Label.$n optional" ($Links[$n].Required -eq $false) "Required=$($Links[$n].Required)"
    }
    foreach ($n in $Spec.Absent) {
        Assert-That "$Label has no $n" (-not $Links.ContainsKey($n)) 'field link is present but should not be'
    }
    if ($Links.ContainsKey('DocumentDate')) {
        $shown = $Links['DocumentDate'].DisplayName
        Assert-That "$Label.DocumentDate shown as '$($Spec.DateLabel)'" ($shown -eq $Spec.DateLabel) "DisplayName='$shown'"
    }
}

<#
    Run on the site columns and again, with -List, on the library's own copies.
    The copy is what the library uses; a site column edited after the library
    took it keeps the old setting on the copy unless the edit was pushed. The
    dev tenant, 2026-09-11: ReportOwner people only on the site, people and
    groups on Records -- and a site-only check passed it.
#>
function Assert-ColumnSettings {
    param([string] $List)
    $at = if ($List) { "$List/" } else { '' }

    foreach ($name in $choices.Keys) {
        $schema = Get-FieldSchema -InternalName $name -List $List
        $stored = @($schema.CHOICES.CHOICE)
        $wanted = $choices[$name]
        Assert-That "$at$name choices are $($wanted -join ', ')" (($stored -join '|') -eq ($wanted -join '|')) `
            "stored: $($stored -join ', ') -- a label the component does not map hides that filing from Recent"
        Assert-That "$at$name allows no fill-in values" ($schema.GetAttribute('FillInChoice') -ne 'TRUE') 'FillInChoice=TRUE'
    }

    # SelectionMode: 0 = individuals only, 1 = individuals and groups. Read as a
    # property, not the UserSelectionMode schema attribute: a copy whose schema
    # omits the attribute reads back as 1. The live store resolves the owner
    # with ensureUser, which must land on a person.
    $owner = Get-FieldProperties -InternalName 'ReportOwner' -Property 'SelectionMode', 'AllowMultipleValues' -List $List
    Assert-That "${at}ReportOwner selects people only" ($owner.SelectionMode -eq '0') `
        "SelectionMode=$($owner.SelectionMode) (1 allows groups) -- re-run provisioning"
    Assert-That "${at}ReportOwner holds one person" ($owner.AllowMultipleValues -ieq 'False') 'AllowMultipleValues=True'

    # Display-only: the stored value is a double either way and nothing in the
    # component reads the format, so this warns rather than fails. Provisioning
    # writes the Decimals schema attribute, so that is what is read back.
    $amount = Get-FieldSchema -InternalName 'Amount' -List $List
    if ($amount.GetAttribute('Decimals') -eq '2') { Write-Host "  PASS ${at}Amount shows 2 decimals" -ForegroundColor Green }
    else { Write-Warn "${at}Amount decimals are '$($amount.GetAttribute('Decimals'))', not 2 -- display only, not a blocker" }

    # DateTime date-only lives on DisplayFormat too (0 = DateOnly).
    $scope = @{ Identity = 'DocumentDate' }
    if ($List) { $scope['List'] = $List }
    $docDate = Get-PnPField @scope -ErrorAction SilentlyContinue
    if ($null -ne $docDate) {
        $ctx.Load($docDate)
        $ctx.ExecuteQuery()
        Assert-That "${at}DocumentDate is date-only" ($docDate.DisplayFormat -eq 0) `
            "DisplayFormat=$($docDate.DisplayFormat) (1 means DateTime)"
    }
    elseif ($List) { Assert-That "${at}DocumentDate exists" $false 'not found' }
}

Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
$ctx = Get-PnPContext

# ---------------------------------------------------------------------------
Write-Step "Site columns"

$expected = @(
    @{ Name = 'FilingDepartment'; Title = 'Department';     Type = 'Choice'   }
    @{ Name = 'Vendor';           Title = 'Vendor';         Type = 'Text'     }
    @{ Name = 'ReportOwner';      Title = 'Report owner';   Type = 'User'     }
    @{ Name = 'DocumentDate';     Title = 'Document date';  Type = 'DateTime' }
    @{ Name = 'Amount';           Title = 'Amount';         Type = 'Currency' }
    @{ Name = 'FilingStatus';     Title = 'Status';         Type = 'Choice'   }
    @{ Name = 'ReceiptNumber';    Title = 'Receipt number'; Type = 'Text'     }
)

foreach ($e in $expected) {
    $f = Get-PnPField -Identity $e.Name -ErrorAction SilentlyContinue
    if ($null -eq $f) { Assert-That "$($e.Name) exists" $false 'not found'; continue }

    Assert-That "$($e.Name) type=$($e.Type), title='$($e.Title)', group='$ColumnGroup'" `
        ($f.TypeAsString -eq $e.Type -and $f.Title -eq $e.Title -and $f.Group -eq $ColumnGroup) `
        "got type=$($f.TypeAsString), title='$($f.Title)', group='$($f.Group)'"
}

Assert-ColumnSettings

# ---------------------------------------------------------------------------
Write-Step "Site content types"

foreach ($ctName in $kinds.Keys) {
    $ct = Get-PnPContentType -Identity $ctName -ErrorAction SilentlyContinue
    if ($null -eq $ct) { Assert-That "$ctName exists" $false 'not found'; continue }

    $id = $ct.Id.StringValue
    $links = Get-LinkMap -Url "/_api/web/contenttypes('$id')/fieldlinks?`$select=Name,DisplayName,Required,Hidden&`$top=200" -Label $ctName
    Assert-KindLinks -Label $ctName -Links $links -Spec $kinds[$ctName]
}

# ---------------------------------------------------------------------------
Write-Step "Library '$LibraryName'"

$list = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
Assert-That "$LibraryName exists" ($null -ne $list) 'not found'

if ($null -ne $list) {
    Assert-That "$LibraryName manages content types" ($list.ContentTypesEnabled -eq $true) 'ContentTypesEnabled is false'
    Assert-That "$LibraryName has versioning" ($list.EnableVersioning -eq $true) 'EnableVersioning is false'
    Assert-That "$LibraryName has no content approval" ($list.EnableModeration -eq $false) 'EnableModeration is true'

    foreach ($n in @('Created', 'Author')) {
        $lf = Get-PnPField -List $LibraryName -Identity $n
        $ctx.Load($lf)
        $ctx.ExecuteQuery()
        Assert-That "$n indexed" ($lf.Indexed -eq $true) 'Indexed is false'
    }

    # -----------------------------------------------------------------------
    Write-Step "Library columns -- the copies '$LibraryName' actually uses"
    Assert-ColumnSettings -List $LibraryName

    # -----------------------------------------------------------------------
    Write-Step "Library content types -- what getKinds() reads (audit H9)"

    <#
        The site content types above are the templates; the library holds its
        own copies, and those are what the live store reads. An edit made to a
        library copy passes every site-level check while the component validates
        against different Required flags -- so the copies are checked here too.
    #>
    $onLibrary = Get-RestRows -Url "/_api/web/lists/getbytitle('$libInUrl')/contenttypes?`$select=Name,StringId"
    if ($onLibrary.Count -eq 0) {
        Assert-That "$LibraryName content types readable" $false 'no content types returned'
    }
    else {
        $unknown = @($onLibrary | Where-Object {
            -not $kinds.ContainsKey($_.Name) -and -not $_.StringId.ToUpperInvariant().StartsWith('0X0120')
        })
        Assert-That "$LibraryName carries only Invoice, Expense report and Folder" ($unknown.Count -eq 0) `
            "also carries: $(($unknown | ForEach-Object { $_.Name }) -join ', ') -- the component refuses to start on a content type it does not know"

        foreach ($ctName in $kinds.Keys) {
            $row = $onLibrary | Where-Object { $_.Name -eq $ctName } | Select-Object -First 1
            if ($null -eq $row) { Assert-That "$LibraryName has $ctName" $false 'not on the library'; continue }
            Assert-That "$LibraryName has $ctName" $true ''

            $links = Get-LinkMap -Label "$LibraryName/$ctName" `
                -Url "/_api/web/lists/getbytitle('$libInUrl')/contenttypes('$($row.StringId)')/fieldlinks?`$select=Name,DisplayName,Required,Hidden&`$top=200"
            Assert-KindLinks -Label "$LibraryName/$ctName" -Links $links -Spec $kinds[$ctName]
        }
    }

    # -----------------------------------------------------------------------
    Write-Step "Filing users' permissions on '$LibraryName' (Decision 7)"

    if ($FilingUser.Count -eq 0) {
        Write-Note 'SKIP' "no -FilingUser given. Pass the email addresses of people who file: they need add, edit AND delete on the library, because a save that fails halfway recycles the file it uploaded."
    }
    else {
        foreach ($user in $FilingUser) {
            $claim = [uri]::EscapeDataString("i:0#.f|membership|$user")
            try {
                $resp = Invoke-PnPSPRestMethod -Method Get `
                    -Url "/_api/web/lists/getbytitle('$libInUrl')/getusereffectivepermissions(@u)?@u='$claim'"
                $lowRaw = if ($null -ne $resp.Low) { $resp.Low } else { $resp.d.GetUserEffectivePermissions.Low }
                if ($null -eq $lowRaw) { throw 'the response carried no permission mask' }
                $low = [uint64] $lowRaw
                # SPBasePermissions low bits: 0x2 AddListItems, 0x4 EditListItems, 0x8 DeleteListItems.
                Assert-That "$user can add items"    (($low -band 0x2) -ne 0) 'AddListItems missing'
                Assert-That "$user can edit items"   (($low -band 0x4) -ne 0) 'EditListItems missing'
                Assert-That "$user can delete items" (($low -band 0x8) -ne 0) 'DeleteListItems missing -- rollback would leave half-saved files behind'
            }
            catch {
                Assert-That "$user permissions readable" $false "$($_.Exception.Message) -- the user may need to be added to the site first"
            }
        }
    }
}

# ---------------------------------------------------------------------------
Write-Step "Tenant settings $StoreKey + $SharePointSiteUrlKey (Decisions 11, 17)"


# Mirrors services/storeSetting.ts: unset or unknown store -> sample data (a
# warning here, since that is a legitimate state); sharepoint -> the site key
# must be an https URL pointing at the site this script verified.
try {
    $store = Get-StorageEntityValue -Key $StoreKey
    if ($null -eq $store) {
        Write-Warn "$StoreKey is not set -- the component runs on sample data in this tenant. Set it with provision-records-library.ps1 -SetTenantSetting when you are ready to file for real."
    }
    elseif ($store -ine 'sharepoint') {
        Write-Warn "$StoreKey is '$store', which the component does not know -- it runs on sample data in this tenant."
    }
    else {
        Write-Host "  PASS $StoreKey = sharepoint" -ForegroundColor Green
        $value = Get-StorageEntityValue -Key $SharePointSiteUrlKey
        Assert-That "$SharePointSiteUrlKey is set" ($null -ne $value) "unset while $StoreKey is sharepoint -- the component shows an error instead of starting"
        if ($null -ne $value) {
            $valueUri = $null
            $isHttps = [uri]::TryCreate($value, [UriKind]::Absolute, [ref] $valueUri) -and $valueUri.Scheme -eq 'https'
            Assert-That "$SharePointSiteUrlKey is an absolute https URL" $isHttps "value '$value' -- the component shows an error instead of starting"
            if ($isHttps) {
                Assert-That "$SharePointSiteUrlKey points at this site" ($value.TrimEnd('/') -ieq $SiteUrl.Trim().TrimEnd('/')) `
                    "points at '$value', not '$SiteUrl'"
            }
        }
    }
}
catch {
    Assert-That "tenant settings readable" $false "$($_.Exception.Message) -- the component shows an error instead of starting when it cannot read them"
}

try {
    $legacy = Get-StorageEntityValue -Key $LegacySiteUrlKey
    if ($null -ne $legacy) {
        Write-Warn "$LegacySiteUrlKey is still set ('$legacy'). Nothing reads it since Decision 17; remove it with Remove-PnPStorageEntity -Key `"$LegacySiteUrlKey`" (or re-run provision-records-library.ps1 -SetTenantSetting)."
    }
}
catch {
    Write-Warn "could not check for the pre-Decision 17 key $LegacySiteUrlKey ($($_.Exception.Message))"
}

# ---------------------------------------------------------------------------
Write-Step "Syntex (Decision 5)"
Write-Note 'MANUAL' "confirm in $LibraryName -> Settings that no document-processing model and no autofill column is applied. Not read by this script: no documented REST call for it was confirmed, and a guessed one could pass for the wrong reason."

# ---------------------------------------------------------------------------
if ($script:failures -eq 0) {
    $tail = if ($script:warnings -gt 0) { " ($script:warnings warning(s) above)" } else { '' }
    Write-Host "`nAll checks passed$tail. The library matches what the live service expects." -ForegroundColor Cyan
}
else {
    Write-Host "`n$script:failures check(s) failed -- see the FAIL lines above." -ForegroundColor Red
    exit 1
}
