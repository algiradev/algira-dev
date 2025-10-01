import { factories } from "@strapi/strapi";
import { emitRaffleDraw } from "../../../../config/socket";

export default factories.createCoreController(
  "api::raffle.raffle",
  ({ strapi }) => ({
    async draw(ctx: any) {
      try {
        const { id } = ctx.params;
        const raffleId = Number(id);
        if (!raffleId) return ctx.badRequest("Id inválido");

        const raffle = await strapi.db.query("api::raffle.raffle").findOne({
          where: { id: raffleId, isDrawn: false },
          populate: {
            tickets: {
              populate: {
                invoiceId: {
                  populate: ["users_algira"],
                },
              },
            },
          },
        });

        if (!raffle) return ctx.notFound("Rifa no encontrada o ya sorteada");
        if (!raffle.tickets || raffle.tickets.length === 0)
          return ctx.badRequest("No hay tickets comprados");

        const crypto = await import("crypto");
        const idx = crypto.randomInt(0, raffle.tickets.length);
        const winnerTicket = raffle.tickets[idx];
        const userName = winnerTicket.invoiceId?.users_algira
          ? `${winnerTicket.invoiceId.users_algira.firstName} ${winnerTicket.invoiceId.users_algira.lastName}`
          : "Desconocido";

        const userEmail = winnerTicket.invoiceId?.users_algira?.email ?? "";

        const winnerRecord = await strapi.db
          .query("api::raffle-winner.raffle-winner")
          .create({
            data: {
              raffle: raffle.id,
              ticket: winnerTicket.id,
              user_name: userName,
              user_email: userEmail,
              won_at: new Date(),
            },
          });

        await strapi.db.query("api::raffle.raffle").update({
          where: { id: raffle.id },
          data: { isDrawn: true },
        });

        const winnerFull = await strapi.db
          .query("api::raffle-winner.raffle-winner")
          .findOne({
            where: { id: winnerRecord.id },
            populate: { ticket: true },
          });

        const payload = {
          raffleId: raffle.id,
          ticketNumber: winnerTicket.number,
          userName: userName,
          userEmail: userEmail,
        };

        emitRaffleDraw(payload);

        return ctx.send({
          success: true,
          winner: {
            id: winnerFull.id,
            user_name: winnerFull.user_name,
            user_email: winnerFull.user_email,
            ticketNumber: winnerFull.ticket?.number ?? null,
            won_at: winnerFull.won_at,
          },
        });
      } catch (err) {
        strapi.log.error("Error en draw controller", err);
        return ctx.internalServerError("Error al ejecutar sorteo manual");
      }
    },
  })
);
