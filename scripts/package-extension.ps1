$ErrorActionPreference = "Stop"

$Workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ManifestPath = Join-Path $Workspace "manifest.json"
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$PackageName = "SimpleSearch-$($Manifest.version)"
$DistRoot = Join-Path $Workspace "dist"
$StagePath = Join-Path $DistRoot $PackageName
$ZipPath = Join-Path $DistRoot "$PackageName.zip"

$RuntimePaths = @(
    "manifest.json",
    "index.html",
    "styles.css",
    "favicon.svg",
    "icons",
    "_locales",
    "src"
)

function Assert-InWorkspace {
    param([string]$Path)

    $FullPath = [System.IO.Path]::GetFullPath($Path)
    $RootWithSeparator = $Workspace.TrimEnd("\") + "\"

    if ($FullPath -ne $Workspace -and -not $FullPath.StartsWith($RootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside workspace: $FullPath"
    }
}

Assert-InWorkspace $DistRoot
Assert-InWorkspace $StagePath
Assert-InWorkspace $ZipPath

New-Item -ItemType Directory -Force -Path $DistRoot | Out-Null

if (Test-Path -LiteralPath $StagePath) {
    Remove-Item -LiteralPath $StagePath -Recurse -Force
}

if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}

New-Item -ItemType Directory -Path $StagePath | Out-Null

foreach ($RelativePath in $RuntimePaths) {
    $Source = Join-Path $Workspace $RelativePath
    $Destination = Join-Path $StagePath $RelativePath
    Assert-InWorkspace $Source
    Assert-InWorkspace $Destination

    if (Test-Path -LiteralPath $Source -PathType Container) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse
    } else {
        $DestinationParent = Split-Path -Parent $Destination
        New-Item -ItemType Directory -Force -Path $DestinationParent | Out-Null
        Copy-Item -LiteralPath $Source -Destination $Destination
    }
}

Compress-Archive -Path (Join-Path $StagePath "*") -DestinationPath $ZipPath -Force

Write-Output "Created $ZipPath"
Write-Output "Created $StagePath"
