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

console.log("Sending test email via", env.EMAIL_HOST, "...");

try {
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: "viraatiyer@gmail.com",
    subject: "Cloud Library — email test",
    html: "<p>If you can read this, email sending is working correctly.</p>",
  });
  console.log("SUCCESS — message ID:", info.messageId);
} catch (err) {
  console.error("FAILED:", err.message);
}
