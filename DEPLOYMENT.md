Deployment checklist — MailerSend env vars and Cloud Functions

Goal

Ensure the production site can send OTP emails after deployment. The Cloud Functions that actually call MailerSend need a valid API token in their runtime environment.

Summary

1. Cloud Functions call MailerSend using a runtime env var named MAIL_SENDER_API_TOKEN. The code also accepts MAILERSEND_API_TOKEN or MAILER_SEND_TOKEN as alternative names.
2. You must set this env var in the deployed Cloud Functions runtime (local `.env` files are only for local testing).
3. After setting the env var, redeploy the functions so the runtime picks up the token.

Recommended steps (Firebase CLI)

1. Set environment variables (Firebase Functions v1 style - functions.config). Note: functions.config() isn't available in v2; see gcloud below for v2.

# For v1-style projects (deprecated for v2):
# Replace YOUR_TOKEN with your MailerSend API token
firebase functions:config:set mailer.sender_api_token="YOUR_TOKEN"

# Deploy functions
firebase deploy --only functions


Google Cloud Functions (v2) / gcloud (recommended)

# Use gcloud to set runtime environment variables on a function (replace placeholders):
# REGION is your function region (e.g. us-central1)
# FUNCTION_NAME is the name of the function (e.g. sendOTPEmail)
# Note: this will perform a deploy/update of the function

gcloud functions deploy FUNCTION_NAME \
  --region=REGION \
  --set-env-vars MAIL_SENDER_API_TOKEN="YOUR_TOKEN",MAIL_FROM_EMAIL="noreply@yourdomain.com" \
  --runtime=nodejs18 \
  --trigger-http \
  --entry-point=sendOTPEmail

# If you use multiple functions, repeat or deploy the whole functions directory with the same env var values.

Alternative: Cloud Console

1. Go to Google Cloud Console → Cloud Functions → Select your function → Edit → Runtime environment variables and secrets.
2. Add a new variable named `MAIL_SENDER_API_TOKEN` and paste the MailerSend token. Save and redeploy.

Local testing

- To test locally, put your token in `functions/.env` (it is used by the local `functions/send_test_email.js` helper). After updating it you can run:

node functions/send_test_email.js

You should see a 200/OK or a MailerSend JSON response when the token is valid.

Notes and troubleshooting

- If MailerSend returns 401 Unauthenticated, the token is incorrect or doesn't have permissions.
- If it returns 404 on a v1.1 endpoint, we try multiple endpoints in the function; ensure the URL and token are correct.
- Check Cloud Functions logs (via Firebase Console or `gcloud functions logs read FUNCTION_NAME --region=REGION`) for the `tried` array — it contains attempts and response bodies.

Development shortcut (optional)

- If you want to let signups work in dev without real email delivery, create a dev-only fallback that prints OTPs to console or shows a dev-only toast. Do not enable this in production.

If you want, I can prepare the dev-only fallback and/or add a small deploy script to streamline setting env vars and deploying functions.
 
PowerShell deploy script

I added `scripts/deploy-functions.ps1` to the repository. It prompts for `MAIL_SENDER_API_TOKEN` (if not set in env) and deploys/updates a list of functions using `gcloud` and `--update-env-vars`.

Usage (PowerShell):

1. Open PowerShell in repo root.
2. Optionally set environment variables:

```powershell
$env:REGION = 'us-central1'
$env:MAIL_FROM_EMAIL = 'noreply@yourdomain.com'
# Optionally override which functions to update (comma-separated):
$env:FUNCTIONS = 'sendOTPEmail,sendEmail,testSendOTP'
```

3. Run the script (it will prompt for token if not set):

```powershell
.\scripts\deploy-functions.ps1
```

The script uses `gcloud functions deploy --update-env-vars` for each function. Check the script at `scripts/deploy-functions.ps1` and adapt the `$defaultFunctions` list if your functions differ.