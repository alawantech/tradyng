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
