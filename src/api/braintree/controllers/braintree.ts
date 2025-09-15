import type { Context } from "koa";
import gateway from "../../../extensions/braintree";
import email from "../../auth/services/email";

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
        raffles: number[];
        tickets: { number: number; raffleId: number }[];
      };

      if (!paymentMethodNonce) ctx.throw(400, "paymentMethodNonce is required");
      if (!amount || amount <= 0) ctx.throw(400, "Valid amount is required");

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

      const newInvoice = await strapi.entityService.create(
        "api::invoice.invoice",
        {
          data: {
            total: amount,
            currency: "USD",
            transactionId: transaction.id,
            transactionStatus: transaction.status,
            transactionDate: new Date(transaction.createdAt),
            users_algira: ctx.state.user?.id,
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

      // Después de crear la invoice y los tickets
      // Después de crear la invoice y los tickets
      const userEmail = ctx.state.user?.email;
      const userName = ctx.state.user?.username ?? "Usuario";

      // Agrupar tickets por raffle
      const ticketsByRaffle: Record<number, number[]> = {};
      ticketsData.forEach((t) => {
        if (!ticketsByRaffle[t.raffleId]) ticketsByRaffle[t.raffleId] = [];
        ticketsByRaffle[t.raffleId].push(t.number);
      });

      // Traer títulos de las rifas
      const rafflesRecords = await strapi.db
        .query("api::raffle.raffle")
        .findMany({
          where: { id: { $in: raffles } },
          select: ["id", "title"], // o "title" si tu campo se llama así
        });

      // Construir el HTML del correo
      let rafflesHtml = "";
      for (const raffle of rafflesRecords) {
        const numbers = ticketsByRaffle[raffle.id]?.join(", ") ?? "";
        rafflesHtml += `<p>Rifa: "${raffle.title}"<br>Tickets: ${numbers}</p>`;
      }

      const subject = "Detalles de tu compra en Algira";
      const html = `
        <p>Hola ${userName},</p>
        <p>Gracias por tu compra! Aquí tienes los detalles:</p>
        <p>Monto: $${amount.toFixed(2)}</p>
        ${rafflesHtml}
        <p>¡Disfruta tu rifa!</p>
      `;

      // Enviar el correo
      await email.sendEmail({ to: userEmail, subject, html });
      console.log("Correo enviado a", userEmail);

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
