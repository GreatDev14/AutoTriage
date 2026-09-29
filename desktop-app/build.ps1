# AutoTriage Desktop App — Build Script
# Run this to generate AutoTriageSetup.exe

Write-Host "Building AutoTriage Desktop App..." -ForegroundColor Cyan
Write-Host ""

# Check node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Run electron-builder
Write-Host "Packaging into installer..." -ForegroundColor Yellow
Set-Location $scriptDir
npm run build-installer

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Installer created in: $scriptDir\dist\" -ForegroundColor Green
    Write-Host "Look for: AutoTriage Setup X.X.X.exe" -ForegroundColor Green
    Write-Host ""
    # Open the dist folder
    explorer "$scriptDir\dist"
} else {
    Write-Host "Build failed. Check the error above." -ForegroundColor Red
}
