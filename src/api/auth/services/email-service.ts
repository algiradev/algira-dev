// email-service.ts
import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!); //  asegura que TS sepa que existe

interface EmailAttachment {
  filename: string;
  path: string;
}

export default {
  sendEmail: async ({
    to,
    subject,
    templateName,
    replacements,
    attachments,
  }: {
    to: string;
    subject: string;
    templateName: string;
    replacements?: Record<string, string | number>;
    attachments?: EmailAttachment[];
  }) => {
    try {
      // 🧩 1️⃣ Leer plantilla HTML
      const templatePath = path.join(
        process.cwd(),
        "public/email-templates",
        templateName
      );
      let html = fs.readFileSync(templatePath, "utf8");

      // 🧩 2️⃣ Reemplazar variables {{clave}}
      if (replacements) {
        for (const key in replacements) {
          html = html.replaceAll(`{{${key}}}`, String(replacements[key]));
        }
      }

      // 🧩 3️⃣ Preparar adjuntos en Base64
      let sgAttachments;
      if (attachments) {
        sgAttachments = attachments.map((a) => ({
          content: fs.readFileSync(a.path).toString("base64"),
          filename: a.filename,
          type: "application/octet-stream",
          disposition: "attachment",
        }));
      }

      // 🧩 4️⃣ Construir mensaje
      const msg: any = {
        to,
        from: "algira.dev@gmail.com", // debe estar verificado en SendGrid
        subject,
        html,
        attachments: sgAttachments,
      };

      // 🧩 5️⃣ Enviar
      await sgMail.send(msg);
      console.log(`✅ Correo enviado a ${to}`);
    } catch (err) {
      console.error("❌ Error enviando correo:", err);
      throw err;
    }
  },
};
