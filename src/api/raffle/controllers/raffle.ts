import type { Context } from "koa";
import ticket from "../../ticket/controllers/ticket";
import { emitRaffleCreated } from "../../../../config/socket";

export default {
  async create(ctx: Context) {
    const body = ctx.request.body;

    try {
      const raffle = await strapi.db.transaction(async (trx) => {
        const post = await strapi.db.query("api::post.post").create({
          data: body.post,
        });

        if (body.postsMultimedias?.length) {
          for (const image of body.postsMultimedias) {
            await strapi.db
              .query("api::post-multimedia.post-multimedia")
              .create({
                data: { ...image, post: post.id },
              });
          }
        }

        const raffle = await strapi.db.query("api::raffle.raffle").create({
          data: { ...body, post: post.id },
        });

        return raffle;
      });

      ctx.send(raffle);
    } catch (err) {
      strapi.log.error("Error creating raffle:", err);
      ctx.badRequest("No se pudo crear el raffle");
    }
  },

  async findAll(ctx: Context) {
    try {
      const raffles = await strapi.db.query("api::raffle.raffle").findMany({
        where: { status_raffle: "a", publishedAt: { $notNull: true } },
        populate: {
          product: {
            select: ["id", "title", "description", "shortDescription"],
            populate: {
              image: true,
            },
          },
        },
      });

      const cleanRaffles = raffles.map((raffle) => ({
        ...raffle,
        product: raffle.product
          ? {
              ...raffle.product,
              image: raffle.product.image?.map((img) => img.url) || [],
            }
          : null,
      }));

      ctx.send(cleanRaffles);
    } catch (err) {
      strapi.log.error("Error fetching raffles:", err);
      ctx.badRequest("No se pudieron obtener los raffles");
    }
  },

  async findOne(ctx: Context) {
    const { id } = ctx.params;

    try {
      const raffle = await strapi.db.query("api::raffle.raffle").findOne({
        where: {
          id: parseInt(id, 10),
          status_raffle: "a",
          publishedAt: { $notNull: true },
        },
        populate: {
          product: {
            select: ["id", "title", "description", "shortDescription"],

            populate: {
              image: true,
            },
          },
          tickets: true,
        },
      });

      if (!raffle) return ctx.notFound("Raffle no encontrado");

      const cleanRaffle = {
        ...raffle,
        product: raffle.product
          ? {
              ...raffle.product,
              image: raffle.product.image?.map((img) => img.url) || [],
            }
          : null,
      };

      ctx.send(cleanRaffle);
    } catch (err) {
      strapi.log.error("Error fetching raffle:", err);
      ctx.badRequest("No se pudo obtener el raffle");
    }
  },

  async update(ctx: Context) {
    const { id } = ctx.params;
    const body = ctx.request.body;

    try {
      const raffle = await strapi.db.transaction(async (trx) => {
        if (body.post) {
          await strapi.db.query("api::post.post").update({
            where: { id: body.post.id },
            data: body.post,
          });
        }

        if (body.deletedImages?.length) {
          for (const idDeleted of body.deletedImages) {
            await strapi.db
              .query("api::post-multimedia.post-multimedia")
              .delete({
                where: { id: idDeleted },
              });
          }
        }

        if (body.postsMultimedias?.length) {
          for (const image of body.postsMultimedias) {
            if (!image.id) {
              await strapi.db
                .query("api::post-multimedia.post-multimedia")
                .create({
                  data: image,
                });
            } else {
              await strapi.db
                .query("api::post-multimedia.post-multimedia")
                .update({
                  where: { id: image.id },
                  data: image,
                });
            }
          }
        }

        const raffle = await strapi.db.query("api::raffle.raffle").update({
          where: { id: parseInt(id, 10) },
          data: body,
        });

        return raffle;
      });

      ctx.send(raffle);
    } catch (err) {
      strapi.log.error("Error updating raffle:", err);
      ctx.badRequest("No se pudo actualizar el raffle");
    }
  },

  async delete(ctx: Context) {
    const { id } = ctx.params;

    try {
      const deleted = await strapi.db.transaction(async (trx) => {
        const raffle = await strapi.db.query("api::raffle.raffle").findOne({
          where: { id: parseInt(id, 10) },
          populate: { post: true },
        });

        if (!raffle) throw new Error("Raffle no encontrado");

        await strapi.db
          .query("api::raffle.raffle")
          .delete({ where: { id: raffle.id } });

        if (raffle.post?.id) {
          await strapi.db
            .query("api::post.post")
            .delete({ where: { id: raffle.post.id } });
        }

        return raffle;
      });

      ctx.send(deleted);
    } catch (err) {
      strapi.log.error("Error deleting raffle:", err);
      ctx.badRequest("No se pudo eliminar el raffle");
    }
  },
};
