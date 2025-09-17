import { stat } from "fs";
import type { Context } from "koa";

export default {
  async getPurshasedTickets(ctx: Context) {
    try {
      // Convertir raffleId a número
      const raffleId = parseInt(ctx.query.raffleId as string, 10);

      if (isNaN(raffleId)) {
        ctx.throw(400, "raffleId is required and must be a number");
      }

      // Obtener tickets ocupados de la rifa
      const tickets = await strapi.db.query("api::ticket.ticket").findMany({
        where: { raffle: raffleId },
        select: ["number"], // solo necesitamos el número
        // populate: { raffle: { fields: ["title", "id"] } } // opcional
      });

      // Enviar resultado
      ctx.send({ takenNumbers: tickets.map((t) => t.number) });
    } catch (err) {
      strapi.log.error("Error fetching tickets:", err);
      ctx.badRequest("No se pudo obtener los tickets");
    }
  },
  // ===============================
  //  FIND ALL TICKETS
  // ===============================
  async findAll(ctx: Context) {
    try {
      const tickets = await strapi.db.query("api::ticket.ticket").findMany({
        where: { status_ticket: "a" },
        populate: {
          raffle: true, // Opcional, si quieres traer la info del raffle
        },
      });

      ctx.send(tickets);
    } catch (err) {
      strapi.log.error("Error fetching tickets:", err);
      ctx.badRequest("No se pudieron obtener los tickets");
    }
  },

  // ===============================
  //  FIND ONE TICKET
  // ===============================
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

  // ===============================
  //  FIND TICKETS BY RAFFLE
  // ===============================
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

  // ===============================
  //  DELETE ALL TICKETS
  // ===============================
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
