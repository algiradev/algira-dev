import type { Context } from "koa";

export default {
  async createContact(ctx: Context) {
    try {
      const { subject, name, email, message, type } = ctx.request.body;

      let image;

      if (ctx.request.files?.image) {
        image = ctx.request.files.image; // Strapi recibe los archivos en ctx.request.files
      }

      if (!message || message.trim() === "") {
        ctx.badRequest("El mensaje es obligatorio");
        return;
      }

      if (type === "contact" && (!email || !name)) {
        ctx.badRequest("Nombre y correo son obligatorios para contacto");
        return;
      }

      const newContact = await strapi.entityService.create(
        "api::contact.contact",
        {
          data: {
            subject,
            name,
            email,
            message,
            type,
          },
          ...(image ? { files: { image } } : {}),
        }
      );

      ctx.send({
        success: true,
        message: "Contacto/feedback registrado correctamente",
        data: newContact,
      });
    } catch (err: any) {
      strapi.log.error("Error posting contact:", err);
      ctx.badRequest(`Error creando contacto: ${err.message}`);
    }
  },
};
