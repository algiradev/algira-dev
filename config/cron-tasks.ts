import { emitRaffleCountdown, emitRaffleDraw } from "./socket";

export default {
  "*/1 * * * *": async ({ strapi }: { strapi: any }) => {
    try {
      const now = new Date();

      const oneMinuteLaterStart = new Date(now.getTime() + 60 * 1000);
      const startMinute = new Date(oneMinuteLaterStart);
      startMinute.setSeconds(0, 0);
      const endMinute = new Date(oneMinuteLaterStart);
      endMinute.setSeconds(59, 999);

      const rafflesCountdown = await strapi.db
        .query("api::raffle.raffle")
        .findMany({
          where: {
            isDrawn: false,
            endDate: { $gte: startMinute, $lte: endMinute },
          },
        });

      for (const raffle of rafflesCountdown) {
        let secondsLeft = 60;
        console.log(
          `⏱ Countdown iniciado para rifa ${raffle.id}: ${secondsLeft}s`
        );
        const interval = setInterval(() => {
          secondsLeft--;
          console.log(`⏱ Rifa ${raffle.id}: ${secondsLeft}s restantes`);
          if (secondsLeft <= 0) {
            clearInterval(interval);
            console.log(`🚨 Rifa ${raffle.id} listo para sorteo!`);

            (async () => {
              const raffleWithTickets = await strapi.db
                .query("api::raffle.raffle")
                .findOne({
                  where: { id: raffle.id, isDrawn: false },
                  populate: {
                    tickets: {
                      populate: ["invoiceId", "invoiceId.users_algira"],
                    },
                  },
                });

              if (!raffleWithTickets || !raffleWithTickets.tickets.length) {
                strapi.log.info(
                  `⚠️ Rifa ${raffle.id} sin tickets, se marca isDrawn=true`
                );
                await strapi.db.query("api::raffle.raffle").update({
                  where: { id: raffle.id },
                  data: { isDrawn: true },
                });
                return;
              }

              const crypto = await import("crypto");
              const idx = crypto.randomInt(0, raffleWithTickets.tickets.length);
              const winnerTicket = raffleWithTickets.tickets[idx];
              const user = winnerTicket.invoiceId?.users_algira;
              const userName = user
                ? `${user.firstName} ${user.lastName}`
                : "Desconocido";
              const userEmail = user?.email ?? "";

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

              const drawPayload = {
                raffleId: raffle.id,
                ticketNumber: winnerTicket.number,
                userName,
                userEmail,
                tickets: raffleWithTickets.tickets.map((t) => ({
                  id: t.id,
                  number: t.number,
                  code: t.code,
                  userName: t.invoiceId?.users_algira
                    ? `${t.invoiceId.users_algira.firstName} ${t.invoiceId.users_algira.lastName}`
                    : "Desconocido",
                })),
              };

              emitRaffleDraw(drawPayload);
              strapi.log.info(
                `🎉 raffle:draw emitted for raffle ${raffle.id} -> ticket ${winnerTicket.number}`
              );
              strapi.log.info(
                `✅ Ganador rifa ${raffle.id}: ticket ${winnerTicket.number}, usuario ${userName}, email ${userEmail}`
              );
            })();
          }
        }, 1000);

        emitRaffleCountdown({
          raffleId: raffle.id,
          title: raffle.title,
          endDate: raffle.endDate,
        });
      }
    } catch (err) {
      strapi.log.error("❌ Error en cron-tasks raffle", err);
    }
  },
};
