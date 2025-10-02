import { stat } from "fs";
import type { Context } from "koa";

export default {
  async getPurshasedTickets(ctx: Context) {
    try {
      const raffleId = parseInt(ctx.query.raffleId as string, 10);

      if (isNaN(raffleId)) {
        ctx.throw(400, "raffleId is required and must be a number");
      }

      const tickets = await strapi.db.query("api::ticket.ticket").findMany({
        where: { raffle: raffleId },
        select: ["number"],
      });

      ctx.send({ takenNumbers: tickets.map((t) => t.number) });
    } catch (err) {
      strapi.log.error("Error fetching tickets:", err);
      ctx.badRequest("No se pudo obtener los tickets");
    }
  },

  async findAll(ctx: Context) {
    try {
      const tickets = await strapi.db.query("api::ticket.ticket").findMany({
        where: { status_ticket: "a" },
        populate: {
          raffle: true,
        },
      });

      ctx.send(tickets);
    } catch (err) {
      strapi.log.error("Error fetching tickets:", err);
      ctx.badRequest("No se pudieron obtener los tickets");
    }
  },

  async findOne(ctx: Context) {
    const { id } = ctx.params;

    try {
      const ticket = await strapi.db.query("api::ticket.ticket").findOne({
        where: { number: parseInt(id, 10), status_ticket: "a" },
        populate: {
          raffle: true,
        },
      });

      if (!ticket) return ctx.notFound("Ticket no encontrado");

      ctx.send(ticket);
    } catch (err) {
      strapi.log.error("Error fetching ticket:", err);
      ctx.badRequest("No se pudo obtener el ticket");
    }
  },

  async findByRaffle(ctx: Context) {
    const { raffle } = ctx.params;

    try {
      const tickets = await strapi.db.query("api::ticket.ticket").findMany({
        where: { raffle: Number(raffle) },
        populate: {
          raffle: true,
        },
      });

      if (!tickets || tickets.length === 0)
        return ctx.notFound("No se encontraron tickets para este raffle");

      ctx.send(tickets);
    } catch (err) {
      strapi.log.error("Error fetching tickets by raffle:", err);
      ctx.badRequest("No se pudieron obtener los tickets");
    }
  },

  async deleteAll(ctx: Context) {
    try {
      const deleted = await strapi.db.query("api::ticket.ticket").deleteMany({
        where: {},
      });

      ctx.send({
        message: "Todos los tickets fueron eliminados",
        count: deleted.count ?? deleted,
      });
    } catch (err) {
      strapi.log.error("Error deleting all tickets:", err);
      ctx.badRequest("No se pudieron eliminar los tickets");
    }
  },
};
