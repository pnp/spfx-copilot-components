#requires -Version 5.1
param([switch] $Check)
& (Join-Path (Split-Path $PSScriptRoot) 'Package-TeamsApps.ps1') -App company -Check:$Check
