import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::raffle-winner.raffle-winner",
  ({ strapi }) => ({
    async getResults(ctx) {
      try {
        const winners = await strapi.db
          .query("api::raffle-winner.raffle-winner")
          .findMany({
            populate: {
              raffle: { select: ["id", "title"] },
              ticket: { select: ["id", "number"] },
            },
            orderBy: { won_at: "desc" },
          });

        const cleanResults = winners.map((w) => ({
          id: w.id,
          raffleTitle: w.raffle?.title || "",
          wonAt: w.won_at,
          ticketNumber: w.ticket?.number || "",
          winnerName: w.user_name,
        }));

        ctx.send(cleanResults);
      } catch (err) {
        strapi.log.error("Error fetching raffle winners:", err);
        ctx.badRequest("No se pudieron obtener los resultados.");
      }
    },
  })
);
