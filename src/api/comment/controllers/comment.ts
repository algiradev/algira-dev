import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::comment.comment",
  ({ strapi }) => ({
    async findAll(ctx) {
      try {
        const comments = await strapi.db
          .query("api::comment.comment")
          .findMany({
            where: { publishedAt: { $notNull: true } },
            populate: { img: true },
          });

        const cleanComments = comments.map((item) => ({
          id: item.id,
          name: item.name,
          comment: item.comment,
          img: item.img ? item.img.url : null,
          rating: item.rating ?? 5,
        }));

        ctx.send(cleanComments);
      } catch (err) {
        strapi.log.error("Error fetching comments:", err);
        ctx.badRequest("No se pudo obtener la información de Comments");
      }
    },
  })
);
