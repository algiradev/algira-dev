import type { Context } from "koa";

export default {
  // ===============================
  //  CREATE ORDER
  // ===============================
  async create(ctx: Context) {
    const body = ctx.request.body;

    try {
      const order = await strapi.entityService.create("api::invoice.invoice", {
        data: {
          amount: body.amount,
          currency: body.currency,
          transactionId: body.transactionId,
          transactionDate: body.transactionDate,
          transactionStatus: body.transactionStatus,
          code: body.code,
          users_algira: body.users_algira, // id del usuario
          tickets: body.tickets, // array de ids de tickets si los hay
        },
      });

      ctx.send(order);
    } catch (err) {
      strapi.log.error("Error creating order:", err);
      ctx.badRequest("No se pudo crear la order");
    }
  },

  // ===============================
  //  FIND ALL ORDERS
  // ===============================
  async findAll(ctx: Context) {
    try {
      const orders = await strapi.entityService.findMany(
        "api::invoice.invoice",
        {
          populate: {
            users_algira: true,
            raffles: {
              populate: {
                tickets: true,
              },
            },
          },
        }
      );

      ctx.send(orders);
    } catch (err) {
      strapi.log.error("Error fetching orders:", err);
      ctx.badRequest("No se pudieron obtener las orders");
    }
  },

  // ===============================
  //  FIND ONE ORDER
  // ===============================
  async findOne(ctx: Context) {
    const { id } = ctx.params;

    try {
      const order = await strapi.entityService.findOne(
        "api::invoice.invoice",
        parseInt(id, 10),
        {
          populate: {
            users_algira: true,
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

  // ===============================
  //  UPDATE ORDER
  // ===============================
  async update(ctx: Context) {
    const { id } = ctx.params;
    const body = ctx.request.body;

    try {
      const order = await strapi.entityService.update(
        "api::invoice.invoice",
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

  // ===============================
  //  DELETE ORDER
  // ===============================
  async delete(ctx: Context) {
    const { id } = ctx.params;

    try {
      const deleted = await strapi.entityService.delete(
        "api::invoice.invoice",
        parseInt(id, 10)
      );
      ctx.send(deleted);
    } catch (err) {
      strapi.log.error("Error deleting order:", err);
      ctx.badRequest("No se pudo eliminar la order");
    }
  },
};
