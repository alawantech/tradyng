# Deploy Trial Expiration Cloud Function
# This script deploys only the checkTrialExpirations scheduled function

Write-Host "🚀 Deploying Trial Expiration Function..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the functions directory
if (Test-Path "src/index.ts") {
    Write-Host "✅ Found functions source directory" -ForegroundColor Green
} else {
    Write-Host "❌ Not in functions directory. Navigating..." -ForegroundColor Yellow
    Set-Location functions
}

# Build the TypeScript code
Write-Host ""
Write-Host "📦 Building TypeScript..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix the TypeScript errors first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Deploy only the trial expiration function
Write-Host "🚀 Deploying checkTrialExpirations function..." -ForegroundColor Cyan
firebase deploy --only functions:checkTrialExpirations

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Trial expiration function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Function Details:" -ForegroundColor Cyan
    Write-Host "   Name: checkTrialExpirations" -ForegroundColor White
    Write-Host "   Schedule: Every 3 hours (0 */3 * * *)" -ForegroundColor White
    Write-Host "   Timezone: UTC" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 What it does:" -ForegroundColor Cyan
    Write-Host "   ✓ Checks all free trial businesses" -ForegroundColor White
    Write-Host "   ✓ Sends reminder emails on Day 2 (3 emails)" -ForegroundColor White
    Write-Host "   ✓ Sends final warnings on Day 3 (2 emails)" -ForegroundColor White
    Write-Host "   ✓ Deletes expired businesses after trial ends" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ Your trial expiration system is now active!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed! Check the error messages above." -ForegroundColor Red
    exit 1
}
