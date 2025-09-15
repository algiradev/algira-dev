import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true si usas 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default {
  sendEmail: async ({ to, subject, html }) => {
    await transporter.sendMail({
      from: `"Algira" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  },
};
