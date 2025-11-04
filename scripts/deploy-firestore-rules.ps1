# Deploy Firestore Rules
# This script deploys the updated Firestore security rules

Write-Host "🔒 Deploying Firestore Rules..." -ForegroundColor Cyan
Write-Host ""

# Check if firestore.rules exists
if (Test-Path "firestore.rules") {
    Write-Host "✅ Found firestore.rules file" -ForegroundColor Green
} else {
    Write-Host "❌ firestore.rules file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Deploying security rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Updated rules include:" -ForegroundColor Cyan
    Write-Host "   ✓ Cloud Functions can delete expired trial businesses" -ForegroundColor White
    Write-Host "   ✓ Cloud Functions can delete products, orders, customers" -ForegroundColor White
    Write-Host "   ✓ Cloud Functions can delete categories and user accounts" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ Your security rules are now updated!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed! Check the error messages above." -ForegroundColor Red
    exit 1
}
