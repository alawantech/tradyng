Test sending email via MailerSend

This script helps you verify a MailerSend API token from your local machine before deploying functions.

Usage (PowerShell):

1. Open PowerShell in the repo root.
2. Set the environment variable and run the script:

```powershell
$env:MAIL_SENDER_API_TOKEN = 'YOUR_MAILERSEND_TOKEN_HERE'
node .\functions\send_test_email.js recipient@example.com
```

Replace `recipient@example.com` with the email you want to send to (for example, `abubakarlawan671@gmail.com`).

The script will print the HTTP response and body from MailerSend.
Test email sender

This small script sends a single test email using the MailerSend API token configured in `functions/.env`.

Files
- `send_test_email.js` - Node.js script that reads `MAIL_SENDER_API_TOKEN` from environment or `functions/.env` and sends a test email to `abubakarlawan671@gmail.com`.

How to run (Windows PowerShell)

1. From the repository root run:

   cd d:/tradyng/functions
   node send_test_email.js

Notes
- The script will try the URL set in `MAIL_SENDER_API_URL` in `.env`. If that returns 404 it will try the fallback `https://api.mailersend.com/v1/email` which is known to accept requests and returned 202 for our test.
- The token in `.env` is a secret. Do not commit it to version control. Keep `functions/.env` outside VCS or add it to `.gitignore` if not already ignored.
