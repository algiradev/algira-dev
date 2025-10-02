import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:1337";

export default {
  sendEmail: async ({
    to,
    subject,
    templateName,
    replacements,
  }: {
    to: string;
    subject: string;
    templateName: string;
    replacements?: Record<string, string | number>;
  }) => {
    const templatePath = path.join(
      process.cwd(),
      "public/email-templates",
      templateName
    );
    let html = fs.readFileSync(templatePath, "utf8");

    // Reemplazar placeholders
    if (replacements) {
      for (const key in replacements) {
        html = html.replaceAll(`{{${key}}}`, String(replacements[key]));
      }
    }

    await transporter.sendMail({
      from: `"Algira" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  },
};
