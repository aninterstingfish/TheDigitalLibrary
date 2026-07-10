// Quick standalone test of Gmail sending.
// Usage:  node test-email.mjs you@example.com
//
// Loads .env.local (where GMAIL_USER / GMAIL_APP_PASSWORD live), connects to
// Gmail, and sends one test email so you can confirm the credentials work —
// no database or signup needed.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
dotenv.config(); // also load .env (does not override .env.local)

import { createTransport } from "nodemailer";

const to = process.argv[2];
if (!to) {
  console.error("\n❌ Please pass an email address to send the test to.");
  console.error("   Example:  node test-email.mjs you@example.com\n");
  process.exit(1);
}

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

console.log("\nGMAIL_USER:", user || "(not set)");
console.log("GMAIL_APP_PASSWORD:", pass ? "found" : "MISSING");

if (!user || !pass) {
  console.error("\n❌ GMAIL_USER or GMAIL_APP_PASSWORD is missing from .env.local.");
  console.error("   Open .env.local and make sure both lines are there, then try again.\n");
  process.exit(1);
}

const transporter = createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user, pass },
});

console.log(`\nSending a test email to ${to} ...`);

try {
  const info = await transporter.sendMail({
    from: `Cloud Library <${user}>`,
    to,
    subject: "Cloud Library — test email",
    text: "If you can read this, your Gmail sending is working!",
    html: "<h2 style='font-family:sans-serif'>It works!</h2><p style='font-family:sans-serif;color:#555'>Your Cloud Library Gmail setup is sending correctly.</p>",
  });
  console.log("\n✅ Sent successfully! Message ID:", info.messageId);
  console.log("   Check the inbox for", to, "(and the spam folder just in case).\n");
} catch (err) {
  console.error("\n❌ Failed to send. Gmail said:\n");
  console.error("  ", err.message);
  console.error("\nMost common causes:");
  console.error("  - The app password was typed wrong -> regenerate it and paste it again.");
  console.error("  - 2-Step Verification isn't fully on for that Gmail account.");
  console.error("  - GMAIL_USER isn't the same account the app password was made for.\n");
  process.exit(1);
}
