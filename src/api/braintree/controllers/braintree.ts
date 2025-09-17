import type { Context } from "koa";
import gateway from "../../../extensions/braintree";
import email from "../../auth/services/email";

import { formatDateToLocal } from "../../../utils/dateFormatter";

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
      const transactionId = transaction.id;
      const transactionDate = new Date(transaction.createdAt);

      const newInvoice = await strapi.entityService.create(
        "api::invoice.invoice",
        {
          data: {
            total: amount,
            currency: "USD",
            transactionId,
            transactionStatus: transaction.status,
            transactionDate,
            users_algira: ctx.state.user?.id,
          },
          populate: ["tickets", "users_algira"],
        }
      );

      const ticketsData = tickets.map((t) => ({
        code: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        number: t.number,
        invoiceId: newInvoice.id,
        raffle: t.raffleId,
      }));

      // Crear cada ticket con entityService para mantener relaciones
      const createdTickets = await Promise.all(
        ticketsData.map((ticket) =>
          strapi.entityService.create("api::ticket.ticket", {
            data: {
              code: ticket.code,
              number: ticket.number,
              raffle: ticket.raffle,
              invoiceId: ticket.invoiceId,
            },
            populate: ["raffle", "invoiceId"],
          })
        )
      );

      // Después de crear la invoice y los tickets
      // Después de crear la invoice y los tickets
      const userEmail = ctx.state.user?.email;
      const userName = ctx.state.user?.username ?? "Usuario";

      // Agrupar tickets por raffle
      const ticketsByRaffle: Record<number, number[]> = {};
      ticketsData.forEach((t) => {
        if (!ticketsByRaffle[t.raffle]) ticketsByRaffle[t.raffle] = [];
        ticketsByRaffle[t.raffle].push(t.number);
      });

      // Traer títulos de las rifas
      const rafflesRecords = await strapi.db
        .query("api::raffle.raffle")
        .findMany({
          where: { id: { $in: raffles } },
          select: ["id", "title", "price", "endDate"],
        });

      // Construir el HTML del correo
      let rafflesRows = "";
      for (const raffle of rafflesRecords) {
        const numbers = ticketsByRaffle[raffle.id] ?? [];
        const qty = numbers.length;
        const subtotal = raffle.price * qty;
        const endDate = formatDateToLocal(raffle.endDate);

        rafflesRows += `
    <tr>
      <td>${raffle.title}</td>
      <td align="center">$${raffle.price.toFixed(2)}</td>
      <td align="center">${numbers.join(", ")}</td>
      <td align="center">${endDate}</td>
      <td align="right">$${subtotal.toFixed(2)}</td>
    </tr>
  `;
      }

      const subject = "Factura de compra";

      // Enviar el correo
      // Generar el HTML y enviar correo usando el servicio
      await email.sendEmail({
        to: userEmail,
        subject,
        templateName: "purchase-confirmation.html",
        replacements: {
          userName,
          amount: amount.toFixed(2),
          invoiceId: transaction.id,
          transactionDate: formatDateToLocal(transaction.createdAt),
          rafflesRows,
          year: new Date().getFullYear().toString(),
        },
      });

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
