<#
Deploy functions and set MAIL_SENDER_API_TOKEN in runtime env.

Usage:
  - Set environment variable MAIL_SENDER_API_TOKEN before running, or the script will prompt for it.
  - Optionally set REGION and FUNCTIONS (comma-separated) environment variables.

Example:
  $env:MAIL_SENDER_API_TOKEN = 'ya29....'
  .\scripts\deploy-functions.ps1

#>

param()

function Read-TokenFromPrompt {
    Write-Host "MAIL_SENDER_API_TOKEN not found in environment. Please paste it now (input will be hidden):"
    $secure = Read-Host -AsSecureString
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

# Configuration - override by setting env vars before running
$region = $env:REGION -or 'us-central1'
$mailFrom = $env:MAIL_FROM_EMAIL -or 'noreply@yourdomain.com'

# Functions to deploy/update - adjust if your functions have different names
# Email-related functions removed from default list
$defaultFunctions = @('healthCheck','generateUploadUrl')
$functionsList = @()
if ($env:FUNCTIONS) {
    $functionsList = $env:FUNCTIONS -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
} else {
    $functionsList = $defaultFunctions
}

# Get token from env or prompt (optional now since email functions are removed)
$token = $env:MAIL_SENDER_API_TOKEN

Write-Host "Deploying functions to region: $region"
Write-Host "Functions to update: $($functionsList -join ', ')"

foreach ($fn in $functionsList) {
    Write-Host "\nUpdating function: $fn"
    try {
        & gcloud functions deploy $fn `
            --region=$region `
            --runtime=nodejs18 `
            --trigger-http `
            --entry-point=$fn `
            --quiet `
            --update-env-vars "MAIL_SENDER_API_TOKEN=$token,MAIL_FROM_EMAIL=$mailFrom"

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "gcloud returned non-zero exit code ($LASTEXITCODE) for function $fn"
        } else {
            Write-Host "Function $fn updated successfully."
        }
    } catch {
        Write-Error "Failed to deploy/update function $fn: $_"
    }
}

Write-Host "All done. Check Cloud Console or run 'gcloud functions logs read <FUNCTION>' to inspect logs."
# Deploy script for Tradyng functions (PowerShell)
# Usage: Open PowerShell with a firebase/gcloud-authenticated user that has project permissions, then run:
#   ./deploy-functions.ps1 -ProjectId tradyng -Region us-central1 -MailToken "YOUR_MAILER_SEND_TOKEN"

param(
  [string]$ProjectId = 'tradyng',
  [string]$Region = 'us-central1',
  [string]$MailToken = '',
  [string]$MailFrom = 'noreply@rady.ng',
  [string]$SupportEmail = 'support@rady.ng'
)

Write-Host "Building functions..."
Push-Location d:/tradyng/functions
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; Pop-Location; exit 1 }

# Check Firebase login
Write-Host "Checking Firebase login and project access..."
firebase projects:list --token "$env:FIREBASE_TOKEN" | Out-Null

Write-Host "Deploying Cloud Functions (will deploy all functions)..."
$envVars = @{
  MAIL_SENDER_API_TOKEN = $MailToken
  MAIL_FROM_EMAIL = $MailFrom
  SUPPORT_EMAIL = $SupportEmail
}

# Deploy functions. If you prefer to set env vars via console, omit --set-env-vars.
$setEnvString = ($envVars.GetEnumerator() | ForEach-Object { "{0}={1}" -f $_.Key, $_.Value }) -join ','

try {
  firebase deploy --only functions --project=$ProjectId --except functions:generateUploadUrl --force
  # Deploy generateUploadUrl separately with explicit env vars if needed via gcloud (v2)
  Write-Host "Attempting to deploy generateUploadUrl via gcloud (safer for gen2 env vars)..."
  gcloud functions deploy generateUploadUrl --gen2 --region=$Region --runtime=nodejs22 --trigger-http --entry-point=generateUploadUrl --set-env-vars=$setEnvString --project=$ProjectId
} catch {
  Write-Error "Deployment failed: $_"
  Pop-Location
  exit 1
}

Pop-Location
Write-Host "Deploy complete. Use firebase functions:list --project $ProjectId to confirm."