import "dotenv/config";

import nodemailer from "nodemailer";

async function main() {
  const required = [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "MAIL_FROM_ADDRESS",
  ] as const;

  if (process.env.MAIL_ENABLED !== "true") {
    throw new Error(
      "MAIL_ENABLED=true is required for an SMTP verification run",
    );
  }

  for (const name of required) {
    if (!process.env[name]) throw new Error(`${name} is required`);
  }

  const recipient =
    process.env.SMTP_TEST_RECIPIENT ?? process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!recipient) {
    throw new Error("Set SMTP_TEST_RECIPIENT or ADMIN_NOTIFICATION_EMAIL");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10_000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10_000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 15_000),
  });

  await transporter.verify();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM_ADDRESS,
    to: recipient,
    subject: "Setu SMTP verification",
    text: "This message confirms that Setu authenticated with SMTP and delivered a test message.",
  });

  console.info(`SMTP verification succeeded; message id ${info.messageId}`);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "SMTP verification failed",
  );
  process.exitCode = 1;
});
