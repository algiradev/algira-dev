import type { Context } from "koa";

export default {
  async create(ctx: Context) {
    const body = ctx.request.body;

    try {
      const order = await strapi.entityService.create("api::order.order", {
        data: {
          amount: body.amount,
          currency: body.currency,
          transactionId: body.transactionId,
          transactionDate: body.transactionDate,
          transactionStatus: body.transactionStatus,
          code: body.code,
          users_algira: body.users_algira,
          tickets: body.tickets,
        },
      });

      ctx.send(order);
    } catch (err) {
      strapi.log.error("Error creating order:", err);
      ctx.badRequest("No se pudo crear la order");
    }
  },

  async findAll(ctx: Context) {
    try {
      const orders = await strapi.entityService.findMany("api::order.order", {
        filters: { publishedAt: { $notNull: true } },
        populate: {
          users_algira: true,
          tickets: true,
        },
      });

      ctx.send(orders);
    } catch (err) {
      strapi.log.error("Error fetching orders:", err);
      ctx.badRequest("No se pudieron obtener las orders");
    }
  },

  async findOne(ctx: Context) {
    const { id } = ctx.params;

    try {
      const order = await strapi.entityService.findOne(
        "api::order.order",
        parseInt(id, 10),
        {
          populate: {
            users_algira: true,
            tickets: true,
          },
        }
      );

      if (!order) return ctx.notFound("Order no encontrada");

      ctx.send(order);
    } catch (err) {
      strapi.log.error("Error fetching order:", err);
      ctx.badRequest("No se pudo obtener la order");
    }
  },

  async update(ctx: Context) {
    const { id } = ctx.params;
    const body = ctx.request.body;

    try {
      const order = await strapi.entityService.update(
        "api::order.order",
        parseInt(id, 10),
        {
          data: {
            amount: body.amount,
            currency: body.currency,
            transactionId: body.transactionId,
            transactionDate: body.transactionDate,
            transactionStatus: body.transactionStatus,
            code: body.code,
            users_algira: body.users_algira,
            tickets: body.tickets,
          },
        }
      );

      ctx.send(order);
    } catch (err) {
      strapi.log.error("Error updating order:", err);
      ctx.badRequest("No se pudo actualizar la order");
    }
  },

  async delete(ctx: Context) {
    const { id } = ctx.params;

    try {
      const deleted = await strapi.entityService.delete(
        "api::order.order",
        parseInt(id, 10)
      );
      ctx.send(deleted);
    } catch (err) {
      strapi.log.error("Error deleting order:", err);
      ctx.badRequest("No se pudo eliminar la order");
    }
  },
};
