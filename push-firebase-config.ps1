# Script to push Firebase config to GitHub
# Chạy script này trong thư mục project

Write-Host "Checking current directory..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Cyan

# Check if we're in the project directory
if (-not (Test-Path "src\firebase\config.js")) {
    Write-Host "ERROR: Not in project directory. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "`nInitializing git repository (if needed)..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
}

Write-Host "`nAdding files..." -ForegroundColor Yellow
git add .gitignore
git add package.json
git add src/firebase/config.js
git add src/components/ConferenceLayout.jsx

Write-Host "`nChecking status..." -ForegroundColor Yellow
git status --short

Write-Host "`nCommitting changes..." -ForegroundColor Yellow
git commit -m "Add Firebase dependency and config, update layout (hide Area C)"

Write-Host "`nAdding remote (if needed)..." -ForegroundColor Yellow
$remoteExists = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    git remote add origin https://github.com/vanthin29112000/diemdanhchat.git
    Write-Host "Remote added." -ForegroundColor Green
} else {
    Write-Host "Remote already exists: $remoteExists" -ForegroundColor Cyan
}

Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push -u origin master

Write-Host "`nDone!" -ForegroundColor Green

