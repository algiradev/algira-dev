import type { Context } from "koa";
import gateway from "../../../extensions/braintree";

export default {
  // Genera clientToken
  async generateToken(ctx: Context) {
    try {
      const response = await gateway.clientToken.generate({});
      ctx.send({ clientToken: response.clientToken, success: true });
    } catch (error: any) {
      console.error("Error generating client token:", error);
      ctx.throw(500, `Error generating client token: ${error.message}`);
    }
  },

  async processPayment(ctx: Context) {
    try {
      const body = ctx.request.body;

      if (!body || Object.keys(body).length === 0) {
        ctx.throw(400, "Request body is empty");
      }

      const { paymentMethodNonce, amount, raffles, tickets } = body as {
        paymentMethodNonce: string;
        amount: number;
        raffles: number[]; // IDs de rifas
        tickets: { number: number; raffleId: number }[]; // tickets seleccionados
      };

      if (!paymentMethodNonce) ctx.throw(400, "paymentMethodNonce is required");
      if (!amount || amount <= 0) ctx.throw(400, "Valid amount is required");

      // Procesar transacción en Braintree
      const result = await gateway.transaction.sale({
        amount: amount.toFixed(2),
        paymentMethodNonce,
        options: { submitForSettlement: true },
      });

      if (!result.success) {
        ctx.send({ success: false, error: result.message });
        return;
      }

      const transaction = result.transaction;

      // 1️⃣ Crear la invoice
      const newInvoice = await strapi.entityService.create(
        "api::invoice.invoice",
        {
          data: {
            total: amount,
            currency: "USD",
            transactionId: transaction.id,
            transactionStatus: transaction.status,
            transactionDate: new Date(transaction.createdAt),
            users_algira: ctx.state.user?.id, // usuario logueado
            raffles: ctx.request.body.raffles,
          },
          populate: ["raffles", "users_algira"],
        }
      );

      const ticketsData = tickets.map((t) => ({
        code: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        number: t.number,
        raffleId: t.raffleId,
      }));

      const createdTickets = await strapi.db
        .query("api::ticket.ticket")
        .createMany({
          data: ticketsData,
        });

      const createdTicketIds = createdTickets.ids;

      for (const raffleId of raffles) {
        const raffleRecord = await strapi.db
          .query("api::raffle.raffle")
          .findOne({
            where: { id: raffleId },
            populate: ["invoices", "tickets"],
          });

        const ticketIdsForRaffle = ticketsData
          .map((t, index) => ({ ...t, id: createdTicketIds[index] }))
          .filter((t) => t.raffleId === raffleId)
          .map((t) => t.id);

        await strapi.db.query("api::raffle.raffle").update({
          where: { id: raffleId },
          data: {
            invoices: [
              ...raffleRecord.invoices.map((i) => i.id),
              newInvoice.id,
            ],
            tickets: [
              ...raffleRecord.tickets.map((t) => t.id),
              ...ticketIdsForRaffle,
            ],
          },
        });
      }

      ctx.send({
        success: true,
        message: "Pago procesado, invoice y tickets creados correctamente",
        invoice: newInvoice,
      });
    } catch (error: any) {
      console.error("Error processing payment:", error);
      ctx.throw(500, `Error processing payment: ${error.message}`);
    }
  },
};
