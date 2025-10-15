import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::footer-contact.footer-contact",
  ({ strapi }) => ({
    async find(ctx) {
      try {
        const contact = await strapi.db
          .query("api::footer-contact.footer-contact")
          .findOne({
            where: { publishedAt: { $notNull: true } },
          });

        if (!contact) {
          return ctx.notFound("Footer contact not found");
        }

        ctx.send({
          email: contact.email,
          phone: contact.phone,
        });
      } catch (err) {
        strapi.log.error("Error fetching footer contact:", err);
        ctx.badRequest("No se pudo obtener el contacto del footer");
      }
    },
  })
);
