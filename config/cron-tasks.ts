import email from "../src/api/auth/services/email";
import { emitRaffleCountdown, emitRaffleDraw } from "./socket";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

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
            console.log(`🚨 Rifa ${raffle.id} lista para sorteo!`);

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

              if (!raffleWithTickets) return;

              const tickets = raffleWithTickets.tickets || [];
              const totalTickets = tickets.length;

              // 🧩 Si no cumple el mínimo de tickets comprados
              if (totalTickets < raffleWithTickets.minQuantity) {
                strapi.log.info(
                  `⏸️ Rifa ${raffle.id} no cumple el mínimo (${totalTickets}/${raffleWithTickets.minQuantity}). No se sortea.`
                );
                await strapi.db.query("api::raffle.raffle").update({
                  where: { id: raffle.id },
                  data: { isDrawn: true },
                });

                emitRaffleDraw({
                  raffleId: raffle.id,
                  ticketNumber: 0,
                  userName: "No hubo ganador",
                  userEmail: "",
                  noTickets: true,
                  message: `No se realizará el sorteo porque no se compraron al menos ${raffleWithTickets.minQuantity} tickets.`,
                });

                return;
              }

              // 🧩 CASO 2: Todos los tickets vendidos → elegir ganador
              const crypto = await import("crypto");
              const idx = crypto.randomInt(0, totalTickets);
              const winnerTicket = tickets[idx];
              const user = winnerTicket.invoiceId?.users_algira;

              const userName = user ? user.username : "Desconocido";
              const userEmail = user?.email ?? "";

              // 🏆 Crear registro de ganador
              await strapi.db.query("api::raffle-winner.raffle-winner").create({
                data: {
                  raffle: raffle.id,
                  ticket: winnerTicket.id,
                  user_name: userName,
                  user_email: userEmail,
                  won_at: new Date(),
                },
              });

              // 🔒 Marcar rifa como sorteada
              await strapi.db.query("api::raffle.raffle").update({
                where: { id: raffle.id },
                data: { isDrawn: true },
              });

              // 📧 Enviar correo al ganador (si tiene email)
              if (userEmail) {
                try {
                  await email.sendEmail({
                    to: userEmail,
                    subject: "🎉 ¡Felicidades! Ganaste la rifa",
                    templateName: "winner-email.html",
                    replacements: {
                      firstName: userName,
                      raffleTitle: raffle.title,
                      ticketNumber: winnerTicket.number,
                      link: `${frontendUrl}/raffle/${raffle.id}`,
                      year: new Date().getFullYear().toString(),
                    },
                  });

                  strapi.log.info(
                    `📨 Email enviado a ${userEmail} (ganador de la rifa ${raffle.id})`
                  );
                } catch (emailError) {
                  strapi.log.error(
                    `❌ Error enviando email a ${userEmail}:`,
                    emailError
                  );
                }
              }

              // 📡 Emitir resultado del sorteo
              emitRaffleDraw({
                raffleId: raffle.id,
                ticketNumber: winnerTicket.number,
                userName,
                userEmail,
                noTickets: false,
              });

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
