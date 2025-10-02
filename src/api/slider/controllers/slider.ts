import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::slider.slider",
  ({ strapi }) => ({
    async findAll(ctx) {
      try {
        const slides = await strapi.db.query("api::slider.slider").findMany({
          where: { publishedAt: { $notNull: true } },
          populate: { img: true, imgSmall: true },
        });

        const cleanSlides = slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          alt: slide.alt,
          img: slide.img ? slide.img.url : null,
          imgSmall: slide.imgSmall ? slide.imgSmall.url : null,
        }));

        ctx.send(cleanSlides);
      } catch (err) {
        strapi.log.error("Error fetching sliders:", err);
        ctx.badRequest("No se pudieron obtener los slides");
      }
    },
  })
);
