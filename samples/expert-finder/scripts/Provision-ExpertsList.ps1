#Requires -Version 7.4

<#
.SYNOPSIS
    Creates the Experts list and fields required by Expert Finder.
.DESCRIPTION
    Uses interactive PnP.PowerShell authentication against the tenant root site.
    Creates missing schema, preserves existing items and rejects incompatible
    columns instead of converting them. No sample users, items or permissions
    are created. WhatIf reports the target without connecting to SharePoint.
.PARAMETER SiteUrl
    HTTPS URL of the tenant root site, without a site path, query or fragment.
.PARAMETER ClientId
    Client ID of your Entra application configured for PnP interactive login.
.EXAMPLE
    ./Provision-ExpertsList.ps1 -SiteUrl https://contoso.sharepoint.com -ClientId <YOUR_CLIENT_ID>
.EXAMPLE
    ./Provision-ExpertsList.ps1 -SiteUrl https://contoso.sharepoint.com -ClientId <YOUR_CLIENT_ID> -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [uri]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [guid]$ClientId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $SiteUrl.IsAbsoluteUri -or $SiteUrl.Scheme -ne 'https' -or
    $SiteUrl.AbsolutePath -ne '/' -or $SiteUrl.Query -or $SiteUrl.Fragment -or $SiteUrl.UserInfo) {
    throw 'SiteUrl must be the HTTPS tenant root URL, for example https://contoso.sharepoint.com.'
}
if ($ClientId -eq [guid]::Empty) {
    throw 'ClientId must be the client ID of your PnP interactive-login application.'
}

$rootUrl = $SiteUrl.GetLeftPart([System.UriPartial]::Authority)
if (-not $PSCmdlet.ShouldProcess("$rootUrl / Experts", 'Create the list and missing fields; require Title')) {
    return
}

Import-Module PnP.PowerShell -ErrorAction Stop
$connection = Connect-PnPOnline -Url $rootUrl -ClientId $ClientId.ToString() -Interactive -ReturnConnection

$list = Get-PnPList -Identity 'Experts' -Includes BaseTemplate -Connection $connection
if (-not $list) {
    New-PnPList -Title 'Experts' -Url 'Lists/Experts' -Template GenericList -Connection $connection | Out-Null
    $list = Get-PnPList -Identity 'Experts' -Includes BaseTemplate -ThrowExceptionIfListNotFound -Connection $connection
}
if ($list.BaseTemplate -ne 100) {
    throw 'An Experts list already exists but is not a generic list. Review it before provisioning.'
}

$fieldDefinitions = @(
    '<Field Type="User" Name="Expert" DisplayName="Expert" Required="TRUE" Mult="FALSE" UserSelectionMode="PeopleOnly" />'
    '<Field Type="Choice" Name="Skill" DisplayName="Skill" Required="TRUE" FillInChoice="FALSE"><CHOICES><CHOICE>SPFx</CHOICE><CHOICE>Copilot</CHOICE><CHOICE>DB</CHOICE><CHOICE>Spanish</CHOICE></CHOICES></Field>'
    '<Field Type="Note" Name="ShortCV" DisplayName="ShortCV" Required="FALSE" RichText="FALSE" AppendOnly="FALSE" />'
    '<Field Type="Text" Name="Department" DisplayName="Department" Required="FALSE" />'
)

$existingFields = @{}
foreach ($field in (Get-PnPField -List $list -Includes SchemaXml -Connection $connection)) {
    $existingFields[$field.InternalName] = $field
}
if (-not $existingFields.ContainsKey('Title') -or $existingFields['Title'].TypeAsString -ne 'Text') {
    throw 'Experts must contain the built-in Title text column for job titles.'
}

# Validate all existing custom columns before making any column changes.
foreach ($definition in $fieldDefinitions) {
    $expected = ([xml]$definition).DocumentElement
    $name = $expected.GetAttribute('Name')
    if (-not $existingFields.ContainsKey($name)) { continue }

    $field = $existingFields[$name]
    if ($field.InternalName -cne $name) {
        throw "Column '$name' has a different internal-name casing. Use the exact documented names."
    }
    $actual = ([xml]$field.SchemaXml).DocumentElement
    foreach ($attribute in $expected.Attributes) {
        if ($attribute.Name -in @('Name', 'DisplayName')) { continue }
        $value = $actual.GetAttribute($attribute.Name)
        # SharePoint may omit attributes whose default is FALSE.
        if (-not $value -and $attribute.Value -eq 'FALSE') { $value = 'FALSE' }
        # Older field schemas can serialize PeopleOnly as its numeric value.
        if ($attribute.Name -eq 'UserSelectionMode' -and $value -eq '0') { $value = 'PeopleOnly' }
        if ($value -ne $attribute.Value) {
            throw "Column '$name' has incompatible '$($attribute.Name)'. Expected '$($attribute.Value)', found '$value'. Review the list schema; no existing columns will be converted."
        }
    }
    if ($name -eq 'Skill') {
        $expectedChoices = @($expected.SelectNodes('CHOICES/CHOICE') | ForEach-Object { $_.InnerText })
        $actualChoices = @($actual.SelectNodes('CHOICES/CHOICE') | ForEach-Object { $_.InnerText })
        if ($actualChoices.Count -ne $expectedChoices.Count -or
            (Compare-Object -ReferenceObject $expectedChoices -DifferenceObject $actualChoices -CaseSensitive)) {
            throw 'Skill must have exactly these choices: SPFx, Copilot, DB, Spanish. Existing choices will not be overwritten.'
        }
    }
}

if (([xml]$existingFields['Title'].SchemaXml).DocumentElement.GetAttribute('Required') -ne 'TRUE') {
    Set-PnPField -List $list -Identity 'Title' -Values @{ Required = $true } -Connection $connection | Out-Null
}
foreach ($definition in $fieldDefinitions) {
    $name = ([xml]$definition).DocumentElement.GetAttribute('Name')
    if (-not $existingFields.ContainsKey($name)) {
        Add-PnPFieldFromXml -List $list -FieldXml $definition -Connection $connection | Out-Null
        Write-Host "Created column '$name'."
    }
}

Write-Host "Experts is ready at $rootUrl. Add authorized tenant users to the list, then reload Expert Finder."
