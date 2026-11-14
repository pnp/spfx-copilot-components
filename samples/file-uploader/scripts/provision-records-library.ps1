<#
.SYNOPSIS
    Provisions the records library the live IDocumentStoreService reads from.

.DESCRIPTION
    Creates, in this order:
      1. Seven site columns in the "Document Intake" group, with ReportOwner
         restricted to one individual person
      2. The Invoice and Expense report content types (parent: Document),
         with per-kind Required flags and the per-content-type display-name
         override on DocumentDate ("Invoice date" / "Period end")
      3. The Records document library, with both content types attached and
         Document removed as the default
      4. Indexes on Created and Author
      5. Only with -SetTenantSetting: the tenant settings
         DocumentIntake.SharePoint.SiteUrl (this site) and DocumentIntake.Store
         (sharepoint), and removal of the pre-Decision 17 key
         DocumentIntake.RecordsSiteUrl if the tenant still has it. That switches
         every Document Intake agent in the tenant from sample data to this
         library, so it is never done by default.

    Every value comes from tenant.local.json at the component root when it is
    not passed on the command line (todo.md 8.9 N1; see TenantConfig.ps1). With
    that file filled in, no parameter is needed.

    Idempotent: every step checks before it creates, so re-running is safe and
    is the intended way to bring a second tenant up to the same shape.

    Internal names matter — they become string constants in the live service.
    Two of them dodge collisions with columns SharePoint already ships:
      FilingDepartment  because "Department" exists (Core Contact and Calendar
                        Columns, single line of text)
      FilingStatus      because "Status" exists (Core Document Columns, choice)
    Both carry friendly display names, so the form still reads "Department"
    and "Status".

.PARAMETER SiteUrl
    The site to provision, e.g. https://<tenant>.sharepoint.com/sites/<site>.
    Defaults to sharepoint.siteUrl in tenant.local.json; one or the other is
    required, because no tenant is committed to this repo (AGENTS.md §8).

.PARAMETER LibraryName
    Defaults to sharepoint.libraryName in tenant.local.json, then 'Records'.

.PARAMETER ClientId
    Entra ID app registration used for interactive sign-in. PnP.PowerShell 2.x
    no longer ships a multi-tenant app, so this is required. To create one:

        Register-PnPEntraIDAppForInteractiveLogin `
            -ApplicationName "PnP PowerShell" `
            -Tenant <tenant>.onmicrosoft.com `
            -SharePointDelegatePermissions AllSites.FullControl

    Interactive browser sign-in is that cmdlet's default -- there is no
    -Interactive switch on it (only -DeviceLogin as the alternative).

    That prints the client id; put it in tenant.local.json as clientId (or
    pass it here, or set PNP_CLIENT_ID).

.PARAMETER SetTenantSetting
    Also set DocumentIntake.SharePoint.SiteUrl to -SiteUrl and
    DocumentIntake.Store to sharepoint (docs/TENANT-SETUP.md §7), and remove the
    pre-Decision 17 key DocumentIntake.RecordsSiteUrl. Needs an owner of the
    tenant app catalog site. Remove DocumentIntake.Store
    (Remove-PnPStorageEntity) to return the tenant to sample data.

.PARAMETER ConfigPath
    A tenant configuration other than ../tenant.local.json.

.EXAMPLE
    ./provision-records-library.ps1
    # every value from tenant.local.json

.EXAMPLE
    ./provision-records-library.ps1 -SetTenantSetting

.EXAMPLE
    ./provision-records-library.ps1 -SiteUrl "https://<tenant>.sharepoint.com/sites/<site>" -ClientId "00000000-1111-2222-3333-444444444444"
    # no tenant.local.json, or overriding it

.NOTES
    Requires PowerShell 7+ and PnP.PowerShell:
        Install-Module PnP.PowerShell -Scope CurrentUser
#>

[CmdletBinding()]
param(
    [string] $SiteUrl,
    [string] $ClientId,
    [string] $LibraryName,
    [string] $ColumnGroup = 'Document Intake',
    [switch] $SetTenantSetting,
    [string] $ConfigPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'TenantConfig.ps1')
$tenant = if ($PSBoundParameters.ContainsKey('ConfigPath')) { Read-TenantConfig -Path $ConfigPath } else { Read-TenantConfig }
if (-not $PSBoundParameters.ContainsKey('SiteUrl'))     { $SiteUrl     = $tenant.SiteUrl }
if (-not $PSBoundParameters.ContainsKey('ClientId'))    { $ClientId    = $tenant.ClientId }
if (-not $PSBoundParameters.ContainsKey('LibraryName')) { $LibraryName = $tenant.LibraryName }
if ([string]::IsNullOrWhiteSpace($SiteUrl)) { throw (Get-TenantConfigMissing -Parameter 'SiteUrl' -Field 'sharepoint.siteUrl' -Config $tenant) }
if ($null -ne $tenant.Path) { Write-Host "Tenant configuration: $($tenant.Path)" -ForegroundColor DarkGray }

if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw "PnP.PowerShell 2.x requires PowerShell 7+. You are on $($PSVersionTable.PSVersion). Run this from pwsh, not Windows PowerShell 5.1."
}
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
}
if ([string]::IsNullOrWhiteSpace($ClientId)) {
    throw ((Get-TenantConfigMissing -Parameter 'ClientId' -Field 'clientId' -Config $tenant) + " See the .PARAMETER ClientId block: register an Entra ID app once, then put its client id in tenant.local.json (or pass -ClientId, or set PNP_CLIENT_ID).")
}

function Write-Step { param([string] $Message) Write-Host "`n=== $Message" -ForegroundColor Cyan }
function Write-Made { param([string] $Message) Write-Host "  + $Message" -ForegroundColor Green }
function Write-Kept { param([string] $Message) Write-Host "  = $Message (already there)" -ForegroundColor DarkGray }

Write-Step "Connecting to $SiteUrl"
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
$ctx = Get-PnPContext

# ---------------------------------------------------------------------------
# 1. Site columns
# ---------------------------------------------------------------------------

function Ensure-SiteField {
    param(
        [Parameter(Mandatory)] [string]   $InternalName,
        [Parameter(Mandatory)] [string]   $DisplayName,
        [Parameter(Mandatory)] [string]   $Type,
        [string[]] $Choices,
        [hashtable] $Values
    )

    $existing = Get-PnPField -Identity $InternalName -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        # Not $args: that is PowerShell's automatic variable for unbound arguments.
        $fieldArgs = @{
            InternalName = $InternalName
            DisplayName  = $DisplayName
            Type         = $Type
            Group        = $script:ColumnGroup
        }
        if ($Choices) { $fieldArgs['Choices'] = $Choices }
        Add-PnPField @fieldArgs | Out-Null
        Write-Made "$InternalName ($DisplayName, $Type)"
    }
    else {
        # A column created by hand may be in the wrong group or mistitled.
        $fix = @{}
        if ($existing.Group -ne $script:ColumnGroup) { $fix['Group'] = $script:ColumnGroup }
        if ($existing.Title -ne $DisplayName)        { $fix['Title'] = $DisplayName }
        if ($fix.Count -gt 0) {
            Set-PnPField -Identity $InternalName -Values $fix | Out-Null
            Write-Made "$InternalName corrected ($($fix.Keys -join ', '))"
        }
        else { Write-Kept $InternalName }
    }

    if (-not $Values) { return }

    # Compare before writing. This write is pushed to every list with
    # -UpdateExistingLists, and on the dev tenant (2026-09-11) that push, run
    # unconditionally on every provisioning run, reset the DocumentDate
    # display-name override on the Records/Invoice content type each time
    # (docs/GOTCHAS.md). Typed properties such as DisplayFormat come back as
    # enums; -ne converts the wanted number to the enum, so 0 equals DateOnly.
    $field = Get-PnPField -Identity $InternalName
    $script:ctx.Load($field)
    $script:ctx.ExecuteQuery()
    $differs = @()
    foreach ($key in $Values.Keys) {
        if ($null -eq $field.PSObject.Properties[$key] -or $null -eq $field.$key) {
            throw "Cannot read $key on site column $InternalName to compare it. Refusing to write it blind: the write is pushed to every list."
        }
        if ($field.$key -ne $Values[$key]) { $differs += $key }
    }
    if ($differs.Count -eq 0) { Write-Kept "$InternalName settings"; return }

    Set-PnPField -Identity $InternalName -Values $Values -UpdateExistingLists | Out-Null
    Write-Made "$InternalName settings ($($differs -join ', ')) pushed to existing lists"
}

<#
    Writes a field's SchemaXml on the site column, or with -List on that list's
    own copy. A library copies a site column when a content type brings it in,
    and a later site-level write only reaches that copy when it is pushed with
    -UpdateExistingLists. The dev tenant showed the cost on 2026-09-11:
    ReportOwner was people only on the site and still accepted groups on the
    library (docs/GOTCHAS.md). Copies that already exist are written directly.
#>
function Set-FieldSchemaXml {
    param([Parameter(Mandatory)] [hashtable] $Scope, [Parameter(Mandatory)] [string] $SchemaXml)

    if ($Scope.ContainsKey('List')) { Set-PnPField @Scope -Values @{ SchemaXml = $SchemaXml } | Out-Null }
    else { Set-PnPField @Scope -Values @{ SchemaXml = $SchemaXml } -UpdateExistingLists | Out-Null }
}

function Set-CurrencyDecimals {
    param([Parameter(Mandatory)] [string] $InternalName, [Parameter(Mandatory)] [int] $Decimals, [string] $List)

    $scope = @{ Identity = $InternalName }
    if ($List) { $scope['List'] = $List }
    $where = if ($List) { "$List/$InternalName" } else { $InternalName }

    $f = Get-PnPField @scope
    $script:ctx.Load($f)
    $script:ctx.ExecuteQuery()

    $xml = $f.SchemaXml
    $new = if ($xml -match 'Decimals="\d+"') { $xml -replace 'Decimals="\d+"', "Decimals=`"$Decimals`"" }
           else { $xml -replace '^<Field ', "<Field Decimals=`"$Decimals`" " }

    if ($new -ne $xml) {
        Set-FieldSchemaXml -Scope $scope -SchemaXml $new
        Write-Made "$where set to $Decimals decimals"
    }
    else { Write-Kept "$where decimals" }
}

<#
    ReportOwner holds exactly one individual. UserSelectionMode 0 = individuals
    only, 1 = individuals and groups; Mult TRUE allows several (Field schema
    reference). Written through SchemaXml for the same reason as the currency
    decimals above: typed properties on a generic Field do not always persist
    through Set-PnPField (docs/GOTCHAS.md).
#>
function Set-UserFieldPeopleOnly {
    param([Parameter(Mandatory)] [string] $InternalName, [string] $List)

    $scope = @{ Identity = $InternalName }
    if ($List) { $scope['List'] = $List }
    $where = if ($List) { "$List/$InternalName" } else { $InternalName }

    $f = Get-PnPField @scope
    $script:ctx.Load($f)
    $script:ctx.ExecuteQuery()

    # A missing attribute is not people only: a copy without it reads back as
    # SelectionMode 1, individuals and groups.
    $xml = $f.SchemaXml
    $new = $xml
    if ($new -notmatch 'UserSelectionMode="(0|PeopleOnly)"') {
        $new = if ($new -match 'UserSelectionMode="[^"]*"') { $new -replace 'UserSelectionMode="[^"]*"', 'UserSelectionMode="0"' }
               else { $new -replace '^<Field ', '<Field UserSelectionMode="0" ' }
    }
    $new = $new -replace 'Mult="TRUE"', 'Mult="FALSE"'

    if ($new -ne $xml) {
        Set-FieldSchemaXml -Scope $scope -SchemaXml $new
        Write-Made "$where restricted to one individual person"
    }
    else { Write-Kept "$where people only" }
}

Write-Step "Site columns -> group '$ColumnGroup'"

# "Department" is taken by a built-in contact column, so the internal name is
# FilingDepartment and only the display name reads "Department".
Ensure-SiteField -InternalName 'FilingDepartment' -DisplayName 'Department' -Type 'Choice' `
    -Choices @('Programs', 'Development', 'Finance', 'Operations')

Ensure-SiteField -InternalName 'Vendor' -DisplayName 'Vendor' -Type 'Text'

# The live store resolves the owner with ensureUser, which must land on a person.
Ensure-SiteField -InternalName 'ReportOwner' -DisplayName 'Report owner' -Type 'User'
Set-UserFieldPeopleOnly -InternalName 'ReportOwner'

# DisplayFormat 0 = DateOnly. The component's documentDate is a calendar date;
# a time component would break the ISO round-trip in logic/dates.ts.
Ensure-SiteField -InternalName 'DocumentDate' -DisplayName 'Document date' -Type 'DateTime' `
    -Values @{ DisplayFormat = 0 }

# Decimal places on a currency field resisted both -Values @{Decimals=2} (no
# such property) and @{DisplayFormat=2} (accepted, not persisted), so set the
# schema attribute directly. This is display-only -- the stored value is a
# double either way and the component never reads the format -- so it is a
# warning in the verifier, not a failure.
Ensure-SiteField -InternalName 'Amount' -DisplayName 'Amount' -Type 'Currency'
Set-CurrencyDecimals -InternalName 'Amount' -Decimals 2

# "Status" is taken by a built-in document column.
Ensure-SiteField -InternalName 'FilingStatus' -DisplayName 'Status' -Type 'Choice' `
    -Choices @('Received', 'Pending review', 'Approved', 'Paid', 'Returned')

Ensure-SiteField -InternalName 'ReceiptNumber' -DisplayName 'Receipt number' -Type 'Text'

# ---------------------------------------------------------------------------
# 2. Content types
# ---------------------------------------------------------------------------

function Ensure-ContentType {
    param([Parameter(Mandatory)] [string] $Name)

    $existing = Get-PnPContentType -Identity $Name -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        $parent = Get-PnPContentType -Identity 'Document'
        Add-PnPContentType -Name $Name -Group $script:ColumnGroup -ParentContentType $parent | Out-Null
        Write-Made "content type $Name"
        return Get-PnPContentType -Identity $Name
    }
    Write-Kept "content type $Name"
    return $existing
}

function Get-FieldRefs {
    param(
        [Parameter(Mandatory)] $ContentType,
        [Parameter(Mandatory)] [string] $Label
    )

    <#
        REST, after two failed CSOM routes (2026-09-10):
          - FieldLink.DisplayName reads back empty unless explicitly requested,
            which reported persisted overrides as missing;
          - ContentType.SchemaXml loads, but carries no <FieldRefs> for a site
            content type, so parsing it yielded an empty map.
        /_api/web/contenttypes('<id>')/fieldlinks serialises all three
        properties honestly. DisplayName here is the EFFECTIVE name -- the
        per-kind override when there is one, otherwise the column's own title --
        which is exactly what a caller wants to assert against.
    #>
    $id = $ContentType.Id.StringValue
    $url = "/_api/web/contenttypes('$id')/fieldlinks?`$select=Name,DisplayName,Required&`$top=200"
    $resp = Invoke-PnPSPRestMethod -Url $url -Method Get

    $rows = @()
    if ($null -ne $resp.value)      { $rows = $resp.value }
    elseif ($null -ne $resp.d.results) { $rows = $resp.d.results }

    if ($rows.Count -eq 0) {
        throw "No field links returned for content type '$Label' ($id). Refusing to continue: an empty map would answer every check for the wrong reason."
    }

    $map = @{}
    foreach ($r in $rows) {
        $map[$r.Name] = [pscustomobject]@{
            DisplayName = $r.DisplayName
            Required    = [bool] $r.Required
        }
    }
    return $map
}

<#
    Binds a column to a content type and sets the two things the live
    getKinds() reads back out: whether it is required for this kind, and what
    this kind calls it. Reads through SchemaXml, writes through FieldLinks --
    the write has no other route.
#>
function Set-FieldOnContentType {
    param(
        [Parameter(Mandatory)] [string] $ContentTypeName,
        [Parameter(Mandatory)] [string] $FieldInternalName,
        [Parameter(Mandatory)] [bool]   $Required,
        [string] $DisplayNameOverride
    )

    $ct = Get-PnPContentType -Identity $ContentTypeName
    $refs = Get-FieldRefs -ContentType $ct -Label $ContentTypeName

    if (-not $refs.ContainsKey($FieldInternalName)) {
        Add-PnPFieldToContentType -Field $FieldInternalName -ContentType $ContentTypeName | Out-Null
        Write-Made "$ContentTypeName <- $FieldInternalName"
        $ct = Get-PnPContentType -Identity $ContentTypeName
        $refs = Get-FieldRefs -ContentType $ct -Label $ContentTypeName
    }

    $current = $refs[$FieldInternalName]
    $needsRequired = $current.Required -ne $Required
    $needsDisplay  = $DisplayNameOverride -and $current.DisplayName -ne $DisplayNameOverride

    if (-not ($needsRequired -or $needsDisplay)) {
        Write-Kept "$ContentTypeName.$FieldInternalName"
        return
    }

    $script:ctx.Load($ct.FieldLinks)
    $script:ctx.ExecuteQuery()
    $link = $ct.FieldLinks | Where-Object { $_.Name -eq $FieldInternalName }

    if ($needsRequired) { $link.Required = $Required }
    if ($needsDisplay)  { $link.DisplayName = $DisplayNameOverride }

    # $true pushes the change down to list content types already in use.
    $ct.Update($true)
    $script:ctx.ExecuteQuery()

    $detail = if ($needsDisplay) { "required=$Required, shown as '$DisplayNameOverride'" } else { "required=$Required" }
    Write-Made "$ContentTypeName.$FieldInternalName $detail"
}

Write-Step "Content types"

Ensure-ContentType -Name 'Invoice'        | Out-Null
Ensure-ContentType -Name 'Expense report' | Out-Null

# One table for the site content types here and for the library's own copies
# in step 3b. Invoice requires Vendor and has no ReportOwner at all; Expense
# report requires ReportOwner and has no Vendor. This asymmetry is what
# validateDraft() enforces from requiredFields, and the DocumentDate override
# is what supplies dateFieldLabel.
$kindFields = [ordered]@{
    'Invoice' = @(
        @{ Name = 'FilingDepartment'; Required = $true }
        @{ Name = 'Vendor';           Required = $true }
        @{ Name = 'DocumentDate';     Required = $true; DisplayName = 'Invoice date' }
        @{ Name = 'Amount';           Required = $true }
        @{ Name = 'FilingStatus';     Required = $true }
        @{ Name = 'ReceiptNumber';    Required = $false }
    )
    'Expense report' = @(
        @{ Name = 'FilingDepartment'; Required = $true }
        @{ Name = 'ReportOwner';      Required = $true }
        @{ Name = 'DocumentDate';     Required = $true; DisplayName = 'Period end' }
        @{ Name = 'Amount';           Required = $true }
        @{ Name = 'FilingStatus';     Required = $true }
        @{ Name = 'ReceiptNumber';    Required = $false }
    )
}

foreach ($ctName in $kindFields.Keys) {
    foreach ($spec in $kindFields[$ctName]) {
        $ctArgs = @{ ContentTypeName = $ctName; FieldInternalName = $spec.Name; Required = $spec.Required }
        if ($spec.DisplayName) { $ctArgs['DisplayNameOverride'] = $spec.DisplayName }
        Set-FieldOnContentType @ctArgs
    }
}

# ---------------------------------------------------------------------------
# 3. The library
# ---------------------------------------------------------------------------

Write-Step "Library '$LibraryName'"

$list = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
if ($null -eq $list) {
    $list = New-PnPList -Title $LibraryName -Template DocumentLibrary -EnableContentTypes -OnQuickLaunch
    Write-Made "library $LibraryName"
}
else {
    Write-Kept "library $LibraryName"
    Set-PnPList -Identity $LibraryName -EnableContentTypes $true | Out-Null
}

# Status is modelled by FilingStatus, not by SharePoint's approval workflow.
Set-PnPList -Identity $LibraryName -EnableVersioning $true -EnableMinorVersions $false -EnableModeration $false | Out-Null

foreach ($ctName in @('Invoice', 'Expense report')) {
    $onList = Get-PnPContentType -List $LibraryName -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -eq $ctName }
    if ($null -eq $onList) {
        Add-PnPContentTypeToList -List $LibraryName -ContentType $ctName
        Write-Made "$LibraryName <- $ctName"
    }
    else { Write-Kept "$LibraryName <- $ctName" }
}

# Remove Document so nothing can be filed untyped. Do this last — a library
# must always have at least one content type.
$documentCt = Get-PnPContentType -List $LibraryName -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -eq 'Document' }
if ($null -ne $documentCt) {
    Remove-PnPContentTypeFromList -List $LibraryName -ContentType 'Document'
    Write-Made "$LibraryName removed the Document content type"
}
else { Write-Kept "$LibraryName has no Document content type" }

# The library's own copies of the columns. A setting written to a site column
# after the library already had it stays on the site (docs/GOTCHAS.md), so the
# settings the component depends on are written to the copies as well.
Write-Step "Library columns"

Set-UserFieldPeopleOnly -InternalName 'ReportOwner' -List $LibraryName
Set-CurrencyDecimals -InternalName 'Amount' -Decimals 2 -List $LibraryName

$dateCopy = Get-PnPField -List $LibraryName -Identity 'DocumentDate'
$ctx.Load($dateCopy)
$ctx.ExecuteQuery()
if ($dateCopy.DisplayFormat -eq 0) { Write-Kept "$LibraryName/DocumentDate date-only" }
else {
    Set-PnPField -List $LibraryName -Identity 'DocumentDate' -Values @{ DisplayFormat = 0 } | Out-Null
    Write-Made "$LibraryName/DocumentDate set to date-only"
}

# ---------------------------------------------------------------------------
# 3b. The library's content types -- the field links getKinds() reads
# ---------------------------------------------------------------------------

<#
    A library holds its own copy of each content type as well, and that copy's
    field links can drift from the site's. Dev tenant, 2026-09-11: step 1 used
    to push DocumentDate's settings to every list on every run, and each push
    left Records/Invoice showing DocumentDate as 'Document date' while the site
    content type still said 'Invoice date' and Records/Expense report still
    said 'Period end' (docs/GOTCHAS.md). Step 1 now pushes only a real
    change, but any legitimate push can do the same thing. Step 2
    cannot repair that: it sees the site link is right and stops. The component
    reads the LIBRARY's links, so they are reconciled here, after every
    list-level column write, from the same table -- and only when they differ.
#>
Write-Step "Library content types"

$libInUrl = $LibraryName.Replace("'", "''")
foreach ($ctName in $kindFields.Keys) {
    $row = Get-PnPContentType -List $LibraryName -Identity $ctName -ErrorAction SilentlyContinue
    if ($null -eq $row) { throw "$LibraryName has no '$ctName' content type after step 3. Re-run; if it persists, add it by hand and report it." }

    $url = "/_api/web/lists/getbytitle('$libInUrl')/contenttypes('$($row.Id.StringValue)')/fieldlinks?`$select=Name,DisplayName,Required&`$top=200"
    $resp = Invoke-PnPSPRestMethod -Url $url -Method Get
    $rows = @()
    if ($null -ne $resp.value)         { $rows = $resp.value }
    elseif ($null -ne $resp.d.results) { $rows = $resp.d.results }
    if ($rows.Count -eq 0) { throw "No field links returned for $LibraryName/$ctName. Refusing to continue: an empty map would make every link look missing." }
    $links = @{}
    foreach ($r in $rows) { $links[$r.Name] = $r }

    $fixes = @()
    foreach ($spec in $kindFields[$ctName]) {
        if (-not $links.ContainsKey($spec.Name)) {
            throw "$LibraryName/$ctName has no '$($spec.Name)' link although the site content type does. Re-run; if it persists, remove and re-add the content type on the library."
        }
        $have = $links[$spec.Name]
        $needsRequired = ([bool] $have.Required) -ne $spec.Required
        $needsDisplay  = $spec.DisplayName -and $have.DisplayName -ne $spec.DisplayName
        if ($needsRequired -or $needsDisplay) {
            $fixes += [pscustomobject]@{ Name = $spec.Name; Required = $needsRequired; Display = $needsDisplay; Spec = $spec }
        }
    }

    if ($fixes.Count -eq 0) { Write-Kept "$LibraryName/$ctName links"; continue }

    $ctx.Load($row.FieldLinks)
    $ctx.ExecuteQuery()
    foreach ($fix in $fixes) {
        $link = $row.FieldLinks | Where-Object { $_.Name -eq $fix.Name }
        if ($null -eq $link) { throw "$LibraryName/${ctName}: REST listed a '$($fix.Name)' link that CSOM cannot load. Stopping rather than guessing." }
        if ($fix.Required) { $link.Required = $fix.Spec.Required }
        if ($fix.Display)  { $link.DisplayName = $fix.Spec.DisplayName }
    }
    # $false: a list content type has no children to push to.
    $row.Update($false)
    $ctx.ExecuteQuery()
    foreach ($fix in $fixes) {
        $detail = @()
        if ($fix.Required) { $detail += "required=$($fix.Spec.Required)" }
        if ($fix.Display)  { $detail += "shown as '$($fix.Spec.DisplayName)'" }
        Write-Made "$LibraryName/$ctName.$($fix.Name) $($detail -join ', ')"
    }
}

# ---------------------------------------------------------------------------
# 4. Indexes
# ---------------------------------------------------------------------------

# getRecent() filters to the current user over a rolling window, newest first.
# Without these two the query trips the 5,000-item threshold and starts
# throwing in a way that reads like a bug in the component.
Write-Step "Indexes"
foreach ($indexed in @('Created', 'Author')) {
    $lf = Get-PnPField -List $LibraryName -Identity $indexed
    $ctx.Load($lf)
    $ctx.ExecuteQuery()
    if ($lf.Indexed) { Write-Kept "$indexed indexed" }
    else {
        Set-PnPField -List $LibraryName -Identity $indexed -Values @{ Indexed = $true } | Out-Null
        Write-Made "indexed $indexed"
    }
}

# ---------------------------------------------------------------------------
# 5. Tenant setting (opt-in)
# ---------------------------------------------------------------------------

$wantedSite = $SiteUrl.Trim().TrimEnd('/')

if ($SetTenantSetting) {
    Write-Step "Tenant settings $StoreKey + $SharePointSiteUrlKey (Decisions 11, 17)"
    # Shared with deploy.ps1 -SetTenantSetting (TenantConfig.ps1).
    Set-DocumentIntakeStore -SiteUrl $wantedSite
    Write-Host "  Document Intake now files into this library in every site of the tenant." -ForegroundColor Green
}
else {
    Write-Host "`nTenant settings $StoreKey / $SharePointSiteUrlKey not touched. Re-run with -SetTenantSetting" -ForegroundColor DarkGray
    Write-Host "to point them at $wantedSite -- that switches the tenant from sample data to live filing." -ForegroundColor DarkGray
}

Write-Host "`nDone. $SiteUrl/$LibraryName" -ForegroundColor Cyan
Write-Host "Syntex stays off until Decision 5 is settled; when it is switched on, set" -ForegroundColor DarkGray
Write-Host "Automatic classification and extraction to 'New files only'." -ForegroundColor DarkGray
$next = if ($null -ne $tenant.Path) { './verify-records-library.ps1' } else { "./verify-records-library.ps1 -SiteUrl `"$SiteUrl`" -ClientId <client id> -FilingUser <email>" }
Write-Host "Next: $next" -ForegroundColor DarkGray
