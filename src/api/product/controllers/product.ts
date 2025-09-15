import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    // ===============================
    //  GET /products/list-table
    // ===============================
    async listTable(ctx) {
      try {
        const products = await strapi.db
          .query("api::product.product")
          .findMany({
            where: { status_product: "a", publishedAt: { $notNull: true } },
            select: ["id", "title", "shortDescription"],
            populate: {
              image: true,
              raffles: {
                select: ["id", "title"], // asumiendo que raffle tiene title
              },
            },
          });

        ctx.body = products;
      } catch (err) {
        ctx.throw(500, err);
      }
    },

    // ===============================
    //  POST /products/find-one-by-title
    // ===============================
    async findOneByTitle(ctx) {
      try {
        const { title } = ctx.request.body;

        const product = await strapi.db.query("api::product.product").findOne({
          where: {
            title,
            status_product: "a",
            publishedAt: { $notNull: true },
          },
          populate: {
            image: true,
            raffles: {
              select: ["id", "title"],
            },
          },
        });

        if (!product) return ctx.notFound();

        ctx.body = { data: product, err: false };
      } catch (err) {
        ctx.throw(500, err);
      }
    },

    // ===============================
    //  PUT /products/:id
    // ===============================
    async update(ctx) {
      const { id } = ctx.params;
      const body = ctx.request.body;

      try {
        const updated = await strapi.db.query("api::product.product").update({
          where: { id: Number(id) },
          data: {
            title: body.title,
            description: body.description,
            shortDescription: body.shortDescription,
            image: body.image, // id de media
            status_product: body.status_product,
            raffles: body.raffles, // array de ids
          },
        });

        ctx.body = updated;
      } catch (err) {
        ctx.throw(500, err);
      }
    },
  })
);
