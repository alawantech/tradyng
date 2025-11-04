# Deploy Complete Trial Expiration System
# This script deploys both Firestore rules and the trial expiration Cloud Function

Write-Host "🎯 Deploying Complete Trial Expiration System" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Deploy Firestore Rules
Write-Host "📋 Step 1: Deploying Firestore Rules..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "firestore.rules") {
    Write-Host "✅ Found firestore.rules file" -ForegroundColor Green
    firebase deploy --only firestore:rules
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firestore rules deployed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Firestore rules deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ firestore.rules file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Build and Deploy Cloud Function
Write-Host "📋 Step 2: Building and Deploying Cloud Function..." -ForegroundColor Yellow
Write-Host ""

# Navigate to functions directory
if (Test-Path "functions/src/index.ts") {
    Set-Location functions
    Write-Host "✅ Found functions directory" -ForegroundColor Green
    
    # Build TypeScript
    Write-Host ""
    Write-Host "📦 Building TypeScript..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Navigate back to root
    Set-Location ..
    
    # Deploy function
    Write-Host ""
    Write-Host "🚀 Deploying checkTrialExpirations function..." -ForegroundColor Cyan
    firebase deploy --only functions:checkTrialExpirations
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cloud Function deployed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Cloud Function deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Functions directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Success Summary
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Firestore Rules: Deployed" -ForegroundColor Green
Write-Host "✅ Cloud Function: Deployed" -ForegroundColor Green
Write-Host ""
Write-Host "📋 System Overview:" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔒 Firestore Rules:" -ForegroundColor Yellow
Write-Host "   ✓ Cloud Functions can delete expired businesses" -ForegroundColor White
Write-Host "   ✓ Cloud Functions can delete all related data" -ForegroundColor White
Write-Host "   ✓ Cloud Functions can delete user accounts" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Trial Expiration Function:" -ForegroundColor Yellow
Write-Host "   ✓ Runs every 3 hours automatically" -ForegroundColor White
Write-Host "   ✓ Checks all free trial businesses" -ForegroundColor White
Write-Host "   ✓ Sends 3 reminder emails on Day 2" -ForegroundColor White
Write-Host "   ✓ Sends 2 final warnings on Day 3" -ForegroundColor White
Write-Host "   ✓ Deletes businesses 3 hours after final email" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Frontend Protection:" -ForegroundColor Yellow
Write-Host "   ✓ useAuth hook checks trial expiration" -ForegroundColor White
Write-Host "   ✓ PrivateRoute blocks expired users" -ForegroundColor White
Write-Host "   ✓ TrialExpired page shows upgrade options" -ForegroundColor White
Write-Host ""
Write-Host "✨ Your trial system is fully operational!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test with a free trial account" -ForegroundColor White
Write-Host "   2. Monitor Cloud Function logs in Firebase Console" -ForegroundColor White
Write-Host "   3. Check emails are being sent correctly" -ForegroundColor White
Write-Host ""
