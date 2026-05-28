import { createTransport } from "nodemailer";
import { readFileSync } from "fs";

// Load .env manually
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const transporter = createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT ?? "587"),
  secure: env.EMAIL_SECURE === "true",
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

const approvalUrl = `${env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/approve-account?token=test-token-preview`;

const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:560px">
        <tr><td style="background:#000000;padding:28px 40px">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:10px">
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="17" r="6" fill="white"/>
                <circle cx="18" cy="12" r="7" fill="white"/>
                <circle cx="25" cy="17" r="6" fill="white"/>
                <rect x="5" y="17" width="26" height="8" rx="4" fill="white"/>
                <path d="M18 16 L12 17.5 L12 23 L18 22 Z" fill="black"/>
                <path d="M18 16 L24 17.5 L24 23 L18 22 Z" fill="black"/>
              </svg>
            </td>
            <td style="vertical-align:middle">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px">Cloud Library</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#000;letter-spacing:-0.5px">Parental consent required</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
            Your child <strong style="color:#000">Alex Johnson</strong> (username: <strong style="color:#000">@Alex_J</strong>)
            has requested an account on <strong style="color:#000">Cloud Library</strong> — a school book-sharing service.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6">
            Because they are under 13, we need your consent before activating their account.
            Cloud Library collects their name, username, and email address to operate the service.
            No advertising or data selling.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="${approvalUrl}"
              style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 40px;border-radius:12px;letter-spacing:-0.2px">
              Confirm account creation
            </a>
          </td></tr></table>
          <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
            If you did not expect this email, you can safely ignore it — no account will be created
            unless you click the button above.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:12px;color:#9ca3af">Cloud Library · School Book Exchange</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

console.log("Sending consent email preview to viraatiyer@gmail.com ...");

try {
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: "viraatiyer@gmail.com",
    subject: "Action required: confirm your child's Cloud Library account",
    html,
  });
  console.log("SUCCESS — message ID:", info.messageId);
  console.log("Check your Gmail inbox now.");
} catch (err) {
  console.error("FAILED:", err.message);
}
