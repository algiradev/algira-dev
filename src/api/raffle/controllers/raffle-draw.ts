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
        if (!raffle.tickets) {
          emitRaffleDraw({
            raffleId: raffle.id,
            ticketNumber: "0",
            userName:
              "No se realizará el sorteo porque no se vendieron tickets",
            userEmail: "",
            noTickets: true,
          });
          return;
        }

        const crypto = await import("crypto");
        const randomNumber = String(
          crypto.randomInt(1, raffle.maxQuantity + 1)
        );
        const winnerTicket = raffle.tickets.find(
          (t) => t.number === randomNumber
        );
        const userName = winnerTicket.invoiceId?.users_algira
          ? `${winnerTicket.invoiceId.users_algira.username}`
          : "No hubo ganador";

        const userEmail = winnerTicket.invoiceId?.users_algira?.email ?? "";

        const winnerRecord = await strapi.db
          .query("api::raffle-winner.raffle-winner")
          .create({
            data: {
              raffle: raffle.id,
              ticket: randomNumber,
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
          ticketNumber: randomNumber,
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
            ticketNumber: randomNumber ?? null,
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
