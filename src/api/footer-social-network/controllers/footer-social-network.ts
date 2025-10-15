import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::footer-social-network.footer-social-network",
  ({ strapi }) => ({
    async findAll(ctx) {
      try {
        const items = await strapi.db
          .query("api::footer-social-network.footer-social-network")
          .findMany({
            where: { publishedAt: { $notNull: true } },
            populate: { icon: true },
          });

        const cleanItems = items.map((item) => ({
          id: item.id,
          icon: item.icon?.url || null,
          alt: item.alt || "img",
          url: item.url || "",
        }));

        ctx.send(cleanItems);
      } catch (err) {
        strapi.log.error("Error fetching footer social networks:", err);
        ctx.badRequest("No se pudieron obtener los enlaces del footer");
      }
    },
  })
);
