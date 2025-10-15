import type { Context } from "koa";

export default {
  async createSuggestion(ctx: Context) {
    try {
      const { name, email, message, type } = ctx.request.body;

      if (!message || message.trim() === "") {
        return ctx.badRequest("El mensaje es obligatorio");
      }
      if (type === "contact" && (!email || !name)) {
        return ctx.badRequest("Nombre y correo son obligatorios para contacto");
      }

      const newContact = await strapi.entityService.create(
        "api::suggestion.suggestion",
        {
          data: { name, email, message, type },
        }
      );

      if (ctx.request.files?.image) {
        const file = ctx.request.files.image;
        const uploadedFiles = await strapi
          .plugin("upload")
          .service("upload")
          .upload({
            data: {
              refId: newContact.id,
              ref: "api::suggestion.suggestion",
              field: "image",
            },
            files: file,
          });

        if (uploadedFiles && uploadedFiles.length > 0) {
          await strapi.entityService.update(
            "api::suggestion.suggestion",
            newContact.id,
            {
              data: {
                image: uploadedFiles[0].id,
              },
            }
          );
        }
      }

      const contactWithImage = await strapi.db
        .query("api::suggestion.suggestion")
        .findOne({
          where: { id: newContact.id },
          populate: ["image"],
        });

      ctx.send({
        success: true,
        message: "Contacto/feedback registrado correctamente",
        data: contactWithImage,
      });
    } catch (err: any) {
      strapi.log.error("Error creando contacto:", err);
      ctx.badRequest(`Error creando contacto: ${err.message}`);
    }
  },
};
