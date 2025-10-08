import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::country.country",
  ({ strapi }) => ({
    async findAll(ctx) {
      try {
        const countries = await strapi.db
          .query("api::country.country")
          .findMany({
            where: { publishedAt: { $notNull: true } },
          });

        const cleanCountries = countries.map((country) => ({
          id: country.id,
          name: country.name,
        }));

        ctx.send(cleanCountries);
      } catch (err) {
        strapi.log.error("Error fetching countries:", err);
        ctx.badRequest("No se pudieron obtener los países");
      }
    },
  })
);
