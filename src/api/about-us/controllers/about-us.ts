import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::about-us.about-us",
  ({ strapi }) => ({
    async findAll(ctx) {
      try {
        const abouts = await strapi.db
          .query("api::about-us.about-us")
          .findMany({
            where: { publishedAt: { $notNull: true } },
            populate: { img: true },
          });

        const cleanAbouts = abouts.map((item) => ({
          id: item.id,
          title: item.title,
          text: item.text,
          shortText: item.shortText,
          img: item.img ? item.img.url : null,
        }));

        ctx.send(cleanAbouts);
      } catch (err) {
        strapi.log.error("Error fetching about-us:", err);
        ctx.badRequest("No se pudo obtener la información de About Us");
      }
    },
  })
);
