<#
.SYNOPSIS
  One-time, idempotent setup for the Weekly Pulse Quiz lists (PnP PowerShell).

.DESCRIPTION
  Run as a site owner. Safe to run again: it adds what is missing and brings lists made by
  an earlier setup up to date (QuizYear and WeekNumber shown after Title in the default view
  and in "Upcoming weeks", no thousands separator, QuizYear defaults to this year, the
  calculated week column is called "Week label"). It never changes or deletes list items.
  Use -WhatIf for a dry run (it connects and reads, but changes nothing).

  On -SiteUrl (the Questions site, usually the intranet root):
    * "Weekly Pulse Questions": the quiz master's list, with an "Upcoming weeks" view.
    * "Weekly Pulse Config": one settings row that the Copilot component reads.
  On -ResponsesSiteUrl (defaults to -SiteUrl):
    * "Weekly Pulse Responses": item-level security (people read and edit only their own
      answers), unique permissions (site owners: Full Control; everyone except external
      users: Contribute), no versioning, no attachments, excluded from search.

  The web part and Copilot component never create lists or change permissions; this script does.
  Site owners, SharePoint admins and the audit log can still see who answered (Created By).

.EXAMPLE
  ./Provision-WeeklyPulse.ps1 -SiteUrl "https://contoso.sharepoint.com" -ClientId "<your PnP app id>" -WhatIf

.EXAMPLE
  ./Provision-WeeklyPulse.ps1 -SiteUrl "https://contoso.sharepoint.com" -ResponsesSiteUrl "https://contoso.sharepoint.com/sites/pulse" -ClientId "<your PnP app id>"
#>
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingWriteHost', '', Justification = 'Interactive setup script; coloured progress output.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPositionalParameters', '', Justification = 'Local helpers.')]
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://[^/]+\.sharepoint\.(com|us|de|cn)(/.*)?$')]
  [string] $SiteUrl,

  [ValidatePattern('^https://[^/]+\.sharepoint\.(com|us|de|cn)(/.*)?$')]
  [string] $ResponsesSiteUrl,

  # Entra app registration used by PnP PowerShell for interactive sign-in (Register-PnPEntraIDAppForInteractiveLogin).
  [string] $ClientId = $env:PNP_CLIENT_ID,

  # Optional: skip the tenant id lookup.
  [string] $TenantId,

  [string] $QuestionsListTitle = 'Weekly Pulse Questions',
  [string] $ResponsesListTitle = 'Weekly Pulse Responses',
  # Keep the default: the Copilot component always reads a list with this title.
  [string] $ConfigListTitle = 'Weekly Pulse Config',

  [ValidateSet('Anonymous', 'Named')]
  [string] $AnonymityMode = 'Anonymous',

  # IANA time zone the quiz week rolls over in. Keep it equal to QUIZ_TIME_ZONE in src/common/models.ts.
  # Only used to warn when the site's regional time zone differs (the "Upcoming weeks" view uses the site's [Today]).
  [string] $QuizTimeZone = 'UTC'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$SiteUrl = $SiteUrl.TrimEnd('/')
if (-not $ResponsesSiteUrl) { $ResponsesSiteUrl = $SiteUrl }
$ResponsesSiteUrl = $ResponsesSiteUrl.TrimEnd('/')
$sameSite = $ResponsesSiteUrl -eq $SiteUrl
$dry = [bool]$WhatIfPreference

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  throw 'PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser'
}
if (-not $ClientId) {
  throw 'Pass -ClientId (or set PNP_CLIENT_ID). PnP PowerShell needs your own Entra app for interactive sign-in.'
}

function Write-Step([string] $Message) { Write-Host "  - $Message" }

function Connect-Site([string] $Url) {
  Write-Host "`nConnecting to $Url" -ForegroundColor Cyan
  return Connect-PnPOnline -Url $Url -ClientId $ClientId -Interactive -ReturnConnection
}

function Get-ListOrNull([string] $Title, $Connection) {
  return Get-PnPList -Identity $Title -Connection $Connection -ErrorAction SilentlyContinue
}

function Initialize-List {
  [CmdletBinding(SupportsShouldProcess = $true)]
  param([string] $Title, [string] $Description, $Connection)
  $list = Get-ListOrNull $Title $Connection
  if ($list) { Write-Step "List '$Title' exists"; return $list }
  if ($PSCmdlet.ShouldProcess($Title, 'Create list')) {
    New-PnPList -Title $Title -Template GenericList -Connection $Connection | Out-Null
    Set-PnPList -Identity $Title -Description $Description -Connection $Connection | Out-Null
    Write-Step "Created list '$Title'"
    return Get-ListOrNull $Title $Connection
  }
  Write-Step "[dry run] would create list '$Title'"
  return $null
}

# Returns SchemaXml with the attributes and DefaultFormula set, or $null when it already matches.
function Get-UpgradedSchemaXml([string] $SchemaXml, [System.Collections.IDictionary] $Attributes, [string] $DefaultFormula) {
  $end = $SchemaXml.IndexOf('>')
  $head = $SchemaXml.Substring(0, $end)
  $rest = $SchemaXml.Substring($end + 1)
  foreach ($name in $Attributes.Keys) {
    $value = $Attributes[$name]
    $m = [regex]::Match($head, " $name=[`"']([^`"']*)[`"']")
    if ($m.Success) {
      if ($m.Groups[1].Value -cne $value) { $head = $head.Replace($m.Value, " $name=`"$value`"") }
    } else {
      $head = $head -replace '^<Field ', "<Field $name=`"$value`" "
    }
  }
  if ($DefaultFormula) {
    $tag = "<DefaultFormula>$DefaultFormula</DefaultFormula>"
    $m = [regex]::Match($rest, '<DefaultFormula>[^<]*</DefaultFormula>')
    if ($m.Success) {
      $rest = $rest.Replace($m.Value, $tag)
    } elseif ($head.EndsWith('/')) {
      $head = $head.Substring(0, $head.Length - 1).TrimEnd()
      $rest = "$tag</Field>$rest"
    } else {
      $rest = "$tag$rest"
    }
  }
  $new = "$head>$rest"
  if ($new -ceq $SchemaXml) { return $null }
  return $new
}

# Brings an existing column up to date: display name and/or schema only. Items are never touched.
function Update-Field {
  [CmdletBinding(SupportsShouldProcess = $true)]
  [OutputType([int])]
  param([string] $List, [string] $InternalName, [hashtable] $Upgrade, $Connection)
  $field = Get-PnPField -List $List -Identity $InternalName -Connection $Connection -ErrorAction SilentlyContinue
  if (-not $field) { return 0 }
  $changed = 0
  if ($Upgrade.Title -and $field.Title -cne $Upgrade.Title) {
    if ($PSCmdlet.ShouldProcess("$List/$InternalName", "Rename to '$($Upgrade.Title)'")) {
      Set-PnPField -List $List -Identity $InternalName -Values @{ Title = $Upgrade.Title } -Connection $Connection | Out-Null
      Write-Step "Renamed column $InternalName to '$($Upgrade.Title)' (internal name unchanged)"
    }
    $changed = 1
  }
  if ($Upgrade.Attributes -or $Upgrade.DefaultFormula) {
    $attributes = if ($Upgrade.Attributes) { $Upgrade.Attributes } else { @{} }
    $new = Get-UpgradedSchemaXml $field.SchemaXml $attributes $Upgrade.DefaultFormula
    if ($new) {
      if ($PSCmdlet.ShouldProcess("$List/$InternalName", 'Update column settings')) {
        $field.SchemaXml = $new
        $field.Update()
        Invoke-PnPQuery -Connection $Connection
        Write-Step "Updated column $InternalName (no thousands separator$(if ($Upgrade.DefaultFormula) { ", default $($Upgrade.DefaultFormula)" }))"
      }
      $changed = 1
    }
  }
  return $changed
}

function Initialize-Field {
  [CmdletBinding(SupportsShouldProcess = $true)]
  param([string] $List, [string] $InternalName, [string] $Xml, [bool] $Indexed, $Connection, [hashtable] $Upgrade)
  if (-not (Get-ListOrNull $List $Connection)) {
    Write-Step "[dry run] would add column $InternalName"
    return
  }
  $field = Get-PnPField -List $List -Identity $InternalName -Connection $Connection -ErrorAction SilentlyContinue
  if (-not $field) {
    if ($PSCmdlet.ShouldProcess("$List/$InternalName", 'Add column')) {
      Add-PnPFieldFromXml -List $List -FieldXml $Xml -Connection $Connection | Out-Null
      Write-Step "Added column $InternalName"
      $field = Get-PnPField -List $List -Identity $InternalName -Connection $Connection
    } else {
      Write-Step "[dry run] would add column $InternalName"
    }
  } else {
    Write-Step "Column $InternalName exists"
    if ($Upgrade) { $script:columnsUpdated += (Update-Field $List $InternalName $Upgrade $Connection) }
  }
  if ($Indexed -and $field -and -not $field.Indexed) {
    if ($PSCmdlet.ShouldProcess("$List/$InternalName", 'Index column')) {
      Set-PnPField -List $List -Identity $InternalName -Values @{ Indexed = $true } -Connection $Connection | Out-Null
      Write-Step "Indexed $InternalName"
    }
  }
}

function Text([string] $Name, [string] $Display, [bool] $Required = $false, [int] $Max = 255) {
  $req = if ($Required) { 'TRUE' } else { 'FALSE' }
  return "<Field Type='Text' Name='$Name' StaticName='$Name' DisplayName='$Display' Required='$req' MaxLength='$Max' />"
}
# Whole number with no thousands separator (2026, not 2,026); optional calculated default.
function Num([string] $Name, [string] $Display, [int] $Min, [int] $Max, [string] $DefaultFormula = '') {
  $open = "<Field Type='Number' Name='$Name' StaticName='$Name' DisplayName='$Display' Required='TRUE' Min='$Min' Max='$Max' Decimals='0' Commas='FALSE'"
  if ($DefaultFormula) { return "$open><DefaultFormula>$DefaultFormula</DefaultFormula></Field>" }
  return "$open />"
}
function YesNo([string] $Name, [string] $Display, [string] $Default) {
  $def = if ($Default -ne '') { "<Default>$Default</Default>" } else { '' }
  return "<Field Type='Boolean' Name='$Name' StaticName='$Name' DisplayName='$Display'>$def</Field>"
}
function ChoiceField([string] $Name, [string] $Display, [string[]] $Choices, [string] $Default = '') {
  $c = ($Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ''
  $def = if ($Default) { "<Default>$Default</Default>" } else { '' }
  return "<Field Type='Choice' Name='$Name' StaticName='$Name' DisplayName='$Display' Format='Dropdown' FillInChoice='FALSE'>$def<CHOICES>$c</CHOICES></Field>"
}

# ---------------------------------------------------------------- Questions + Config (SiteUrl)
$qc = Connect-Site $SiteUrl

$web = Get-PnPWeb -Includes RegionalSettings.TimeZone -Connection $qc
$tz = $web.RegionalSettings.TimeZone
# Best effort: "UTC" matches "Coordinated Universal Time"; "Europe/Paris" matches a description that lists Paris.
$tzHint = if ($QuizTimeZone -match '^(Etc/)?(UTC|GMT)$') { 'Coordinated Universal Time' } else { (($QuizTimeZone -split '/')[-1]) -replace '_', ' ' }
if ($tz -and $tz.Description -notmatch [regex]::Escape($tzHint)) {
  Write-Warning (("Site time zone is '{0}'. The quiz week changes on Monday 00:00 {1}, but the 'Upcoming weeks' view uses the site's [Today]. " +
    'Align Site settings > Regional settings > Time zone with the quiz time zone if the view looks a day off.') -f $tz.Description, $QuizTimeZone)
}

Write-Host "`n$QuestionsListTitle" -ForegroundColor Cyan
Initialize-List $QuestionsListTitle 'Weekly Pulse questions. One active item per ISO week.' $qc | Out-Null
$script:columnsUpdated = 0
$numberUpgrade = @{ Attributes = [ordered]@{ Commas = 'FALSE'; Decimals = '0' } }
Initialize-Field $QuestionsListTitle 'QuizYear' (Num 'QuizYear' 'QuizYear' 2020 2100 '=YEAR(Today)') $true $qc @{ Attributes = $numberUpgrade.Attributes; DefaultFormula = '=YEAR(Today)' }
Initialize-Field $QuestionsListTitle 'WeekNumber' (Num 'WeekNumber' 'WeekNumber' 1 53) $true $qc $numberUpgrade
Initialize-Field $QuestionsListTitle 'ChoiceA' (Text 'ChoiceA' 'ChoiceA' $true) $false $qc
Initialize-Field $QuestionsListTitle 'ChoiceB' (Text 'ChoiceB' 'ChoiceB' $true) $false $qc
Initialize-Field $QuestionsListTitle 'ChoiceC' (Text 'ChoiceC' 'ChoiceC') $false $qc
Initialize-Field $QuestionsListTitle 'ChoiceD' (Text 'ChoiceD' 'ChoiceD') $false $qc
Initialize-Field $QuestionsListTitle 'CorrectChoice' (ChoiceField 'CorrectChoice' 'CorrectChoice' @('A', 'B', 'C', 'D')) $false $qc
Initialize-Field $QuestionsListTitle 'Justification' "<Field Type='Note' Name='Justification' StaticName='Justification' DisplayName='Justification' NumLines='6' RichText='FALSE' UnlimitedLengthInDocumentLibrary='FALSE' Description='Why the right answer is right. Up to 500 characters; longer text is cut.' />" $false $qc
Initialize-Field $QuestionsListTitle 'IsActive' (YesNo 'IsActive' 'IsActive' '1') $true $qc
# Monday of the ISO week (week 1 contains 4 January). Used only by the "Upcoming weeks" view.
$weekStartXml = "<Field Type='Calculated' Name='WeekStart' StaticName='WeekStart' DisplayName='Week starts' ResultType='DateTime' Format='DateOnly' ReadOnly='TRUE'>" +
  '<Formula>=DATE(QuizYear,1,4)-MOD(WEEKDAY(DATE(QuizYear,1,4))+5,7)+(WeekNumber-1)*7</Formula>' +
  "<FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>"
Initialize-Field $QuestionsListTitle 'WeekStart' $weekStartXml $false $qc
$weekLabelXml = "<Field Type='Calculated' Name='WeekLabel' StaticName='WeekLabel' DisplayName='Week label' ResultType='Text' ReadOnly='TRUE'>" +
  '<Formula>=QuizYear&amp;"-W"&amp;TEXT(WeekNumber,"00")</Formula>' +
  "<FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>"
Initialize-Field $QuestionsListTitle 'WeekLabel' $weekLabelXml $false $qc @{ Title = 'Week label' }
if ($script:columnsUpdated -gt 0) { Write-Step "Updated $($script:columnsUpdated) column(s)" }

# "Upcoming weeks": this week and later, oldest first. [Today] follows the site's regional time zone.
# The same columns, QuizYear and WeekNumber right after Title, go in the default ("All Items") view.
$upcomingFields = @('LinkTitle', 'QuizYear', 'WeekNumber', 'ChoiceA', 'ChoiceB', 'ChoiceC', 'ChoiceD', 'CorrectChoice', 'Justification', 'IsActive', 'WeekLabel')
$upcomingQuery = "<Where><Geq><FieldRef Name='WeekStart' /><Value Type='DateTime'><Today OffsetDays='-6' /></Value></Geq></Where>" +
  "<OrderBy><FieldRef Name='QuizYear' Ascending='TRUE' /><FieldRef Name='WeekNumber' Ascending='TRUE' /></OrderBy>"
if (Get-ListOrNull $QuestionsListTitle $qc) {
  $viewsCreated = 0
  $viewsUpdated = 0
  # Default view: add the missing question columns (others stay), QuizYear and WeekNumber after Title.
  $defaultView = Get-PnPView -List $QuestionsListTitle -Connection $qc | Where-Object { $_.DefaultView -and $_.Title -ne 'Upcoming weeks' } | Select-Object -First 1
  if ($defaultView) {
    Get-PnPProperty -ClientObject $defaultView -Property ViewFields -Connection $qc | Out-Null
    $current = @($defaultView.ViewFields)
    $others = @($current | Where-Object { $_ -cne 'QuizYear' -and $_ -cne 'WeekNumber' })
    $others += @($upcomingFields | Where-Object { $_ -cne 'QuizYear' -and $_ -cne 'WeekNumber' -and $others -cnotcontains $_ })
    $at = [array]::IndexOf($others, 'LinkTitle') + 1
    $wanted = @($others[0..($at - 1)] | Where-Object { $_ }) + @('QuizYear', 'WeekNumber') + @(if ($at -lt $others.Count) { $others[$at..($others.Count - 1)] })
    if (($current -join ',') -cne ($wanted -join ',')) {
      if ($PSCmdlet.ShouldProcess("$QuestionsListTitle/$($defaultView.Title)", 'Show QuizYear and WeekNumber after Title')) {
        Set-PnPView -List $QuestionsListTitle -Identity $defaultView.Id -Fields $wanted -Connection $qc | Out-Null
        Write-Step "View '$($defaultView.Title)': $($wanted -join ', ')"
      }
      $viewsUpdated++
    }
  }
  # "Upcoming weeks": create it, or re-set its query and columns.
  $view = Get-PnPView -List $QuestionsListTitle -Identity 'Upcoming weeks' -Connection $qc -ErrorAction SilentlyContinue
  if (-not $view) {
    if ($PSCmdlet.ShouldProcess("$QuestionsListTitle/Upcoming weeks", 'Create view')) {
      Add-PnPView -List $QuestionsListTitle -Title 'Upcoming weeks' -Fields $upcomingFields -Query $upcomingQuery -RowLimit 100 -Paged -Connection $qc | Out-Null
    }
    $viewsCreated++
  } else {
    if ($PSCmdlet.ShouldProcess("$QuestionsListTitle/Upcoming weeks", 'Update view')) {
      Set-PnPView -List $QuestionsListTitle -Identity 'Upcoming weeks' -Fields $upcomingFields -Values @{ ViewQuery = $upcomingQuery } -Connection $qc | Out-Null
    }
    $viewsUpdated++
  }
  $summary = @()
  if ($viewsCreated) { $summary += "Created $viewsCreated view" }
  if ($viewsUpdated) { $summary += ('{0} {1} view{2}' -f $(if ($viewsCreated) { 'updated' } else { 'Updated' }), $viewsUpdated, $(if ($viewsUpdated -gt 1) { 's' } else { '' })) }
  Write-Step (($summary -join ', ') + $(if ($dry) { ' (dry run: nothing changed)' } else { '' }))
} else {
  Write-Step "[dry run] would create view 'Upcoming weeks' and add QuizYear, WeekNumber to the default view"
}

Write-Host "`n$ConfigListTitle" -ForegroundColor Cyan
Initialize-List $ConfigListTitle 'Weekly Pulse settings for the Copilot component. Keep exactly one item.' $qc | Out-Null
Initialize-Field $ConfigListTitle 'AnonymityMode' (ChoiceField 'AnonymityMode' 'AnonymityMode' @('Anonymous', 'Named') 'Anonymous') $false $qc
Initialize-Field $ConfigListTitle 'ShowCorrectAnswer' (YesNo 'ShowCorrectAnswer' 'ShowCorrectAnswer' '1') $false $qc
Initialize-Field $ConfigListTitle 'ShowJustification' (YesNo 'ShowJustification' 'ShowJustification' '1') $false $qc
Initialize-Field $ConfigListTitle 'Animations' (YesNo 'Animations' 'Animations' '1') $false $qc
Initialize-Field $ConfigListTitle 'ResponsesSiteUrl' (Text 'ResponsesSiteUrl' 'ResponsesSiteUrl') $false $qc
Initialize-Field $ConfigListTitle 'ResponsesListTitle' (Text 'ResponsesListTitle' 'ResponsesListTitle') $false $qc
Initialize-Field $ConfigListTitle 'QuestionsListTitle' (Text 'QuestionsListTitle' 'QuestionsListTitle') $false $qc
Initialize-Field $ConfigListTitle 'BannerTitle' (Text 'BannerTitle' 'BannerTitle' $false 80) $false $qc
Initialize-Field $ConfigListTitle 'IntroText' (Text 'IntroText' 'IntroText') $false $qc
Initialize-Field $ConfigListTitle 'NoQuizText' (Text 'NoQuizText' 'NoQuizText') $false $qc
if (Get-ListOrNull $ConfigListTitle $qc) {
  $rows = @(Get-PnPListItem -List $ConfigListTitle -PageSize 10 -Connection $qc)
  if ($rows.Count -eq 0) {
    if ($PSCmdlet.ShouldProcess($ConfigListTitle, 'Add the settings row')) {
      Add-PnPListItem -List $ConfigListTitle -Connection $qc -Values @{
        Title = 'Settings'; AnonymityMode = $AnonymityMode; ShowCorrectAnswer = $true; ShowJustification = $true; Animations = $true
        ResponsesSiteUrl = $ResponsesSiteUrl; ResponsesListTitle = $ResponsesListTitle; QuestionsListTitle = $QuestionsListTitle
      } | Out-Null
      Write-Step 'Added the settings row'
    }
  } else {
    if ($rows.Count -gt 1) { Write-Warning "$ConfigListTitle has $($rows.Count) items; the Copilot component uses the oldest (lowest ID)." }
    $row = $rows | Sort-Object Id | Select-Object -First 1
    if ($PSBoundParameters.ContainsKey('ResponsesSiteUrl') -and $row['ResponsesSiteUrl'] -ne $ResponsesSiteUrl) {
      if ($PSCmdlet.ShouldProcess($ConfigListTitle, "Set ResponsesSiteUrl to $ResponsesSiteUrl")) {
        Set-PnPListItem -List $ConfigListTitle -Identity $row.Id -Values @{ ResponsesSiteUrl = $ResponsesSiteUrl } -Connection $qc | Out-Null
        Write-Step "Updated ResponsesSiteUrl on the settings row"
      }
    } else {
      Write-Step 'Settings row exists (left as is)'
    }
  }
} else {
  Write-Step '[dry run] would add the settings row'
}

# ---------------------------------------------------------------- Responses (ResponsesSiteUrl)
$rc = if ($sameSite) { $qc } else { Connect-Site $ResponsesSiteUrl }
if (-not $TenantId) { $TenantId = Get-PnPTenantId -Connection $rc }
$everyone = "c:0-.f|rolemanager|spo-grid-all-users/$TenantId"

Write-Host "`n$ResponsesListTitle" -ForegroundColor Cyan
Initialize-List $ResponsesListTitle 'Weekly Pulse answers. People see and edit only their own items.' $rc | Out-Null
Initialize-Field $ResponsesListTitle 'QuestionId' "<Field Type='Number' Name='QuestionId' StaticName='QuestionId' DisplayName='QuestionId' Required='TRUE' Decimals='0' Min='1' />" $true $rc
Initialize-Field $ResponsesListTitle 'WeekKey' (Text 'WeekKey' 'WeekKey' $false 10) $true $rc
Initialize-Field $ResponsesListTitle 'Choice' (ChoiceField 'Choice' 'Choice' @('A', 'B', 'C', 'D')) $false $rc
Initialize-Field $ResponsesListTitle 'IsCorrect' (YesNo 'IsCorrect' 'IsCorrect' '') $false $rc
Initialize-Field $ResponsesListTitle 'Source' (ChoiceField 'Source' 'Source' @('WebPart', 'Copilot')) $false $rc
Initialize-Field $ResponsesListTitle 'Respondent' "<Field Type='User' Name='Respondent' StaticName='Respondent' DisplayName='Respondent' UserSelectionMode='PeopleOnly' Description='Written only in Named mode.' />" $false $rc

$responses = Get-ListOrNull $ResponsesListTitle $rc
if ($responses) {
  # The "already answered?" lookup filters on Author (Created By).
  $author = Get-PnPField -List $ResponsesListTitle -Identity 'Author' -Connection $rc
  if (-not $author.Indexed -and $PSCmdlet.ShouldProcess("$ResponsesListTitle/Author", 'Index column')) {
    Set-PnPField -List $ResponsesListTitle -Identity 'Author' -Values @{ Indexed = $true } -Connection $rc | Out-Null
    Write-Step 'Indexed Created By (Author)'
  }

  if ($PSCmdlet.ShouldProcess($ResponsesListTitle, 'Item-level security (read/edit own), no versioning, no attachments, NoCrawl')) {
    Set-PnPList -Identity $ResponsesListTitle -ReadSecurity AllUsersReadAccessOnItemsTheyCreate -WriteSecurity WriteOnlyMyItems -EnableVersioning $false -EnableAttachments $false -NoCrawl -Connection $rc | Out-Null
    Write-Step 'Item-level security: read own, edit own; versioning and attachments off; excluded from search'
  }

  $responses = Get-PnPList -Identity $ResponsesListTitle -Includes HasUniqueRoleAssignments -Connection $rc
  if (-not $responses.HasUniqueRoleAssignments) {
    # Not copied: members' Edit level includes Manage Lists, which would bypass item-level security.
    if ($PSCmdlet.ShouldProcess($ResponsesListTitle, 'Break permission inheritance (no copy)')) {
      Set-PnPList -Identity $ResponsesListTitle -BreakRoleInheritance -Connection $rc | Out-Null
      Write-Step 'Unique permissions'
    }
  } else {
    Write-Step 'Unique permissions already set'
  }
  $owners = Get-PnPGroup -AssociatedOwnerGroup -Connection $rc
  if ($PSCmdlet.ShouldProcess($ResponsesListTitle, "Grant '$($owners.Title)' Full Control")) {
    Set-PnPListPermission -Identity $ResponsesListTitle -Group $owners.Title -AddRole 'Full Control' -Connection $rc | Out-Null
    Write-Step "Site owners ('$($owners.Title)'): Full Control"
  }
  if ($PSCmdlet.ShouldProcess($ResponsesListTitle, 'Grant Everyone except external users Contribute')) {
    Set-PnPListPermission -Identity $ResponsesListTitle -User $everyone -AddRole 'Contribute' -Connection $rc | Out-Null
    Write-Step 'Everyone except external users: Contribute'
  }

  # Keep identity columns out of the default view (owners can still add them).
  $defaultView = Get-PnPView -List $ResponsesListTitle -Connection $rc | Where-Object { $_.DefaultView } | Select-Object -First 1
  if ($defaultView -and $PSCmdlet.ShouldProcess("$ResponsesListTitle/$($defaultView.Title)", 'Set view columns')) {
    Set-PnPView -List $ResponsesListTitle -Identity $defaultView.Id -Fields @('LinkTitle', 'WeekKey', 'QuestionId', 'Choice', 'IsCorrect', 'Source') -Connection $rc | Out-Null
    Write-Step 'Default view shows no identity columns'
  }
} else {
  Write-Step '[dry run] would index Author, set item-level security, break inheritance and grant permissions'
}

Write-Host ''
if ($dry) {
  Write-Host 'Dry run finished. Nothing was changed.' -ForegroundColor Yellow
} else {
  Write-Host 'Done. In' "'$QuestionsListTitle'" 'set QuizYear and WeekNumber (the ISO week) on each question.' -ForegroundColor Green
}
