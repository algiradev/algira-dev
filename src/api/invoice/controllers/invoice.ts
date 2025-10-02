import type { Context } from "koa";

export default {
  async findUserInvoices(ctx: Context) {
    const userId = parseInt(ctx.state.user?.id as string, 10);

    if (!userId) {
      return ctx.unauthorized("Usuario no autenticado");
    }

    try {
      const invoices = await strapi.entityService.findMany(
        "api::invoice.invoice",
        {
          filters: {
            users_algira: {
              id: userId,
            },
          },
          populate: {
            tickets: {
              populate: ["raffle"],
            },
            users_algira: true,
          },
          sort: { transactionDate: "desc" },
        }
      );

      ctx.send(invoices);
    } catch (err) {
      strapi.log.error("Error fetching invoices:", err);
      ctx.badRequest("No se pudo obtener el historial de compras");
    }
  },
};
