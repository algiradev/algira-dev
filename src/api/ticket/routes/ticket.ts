export default {
  routes: [
    {
      method: "GET",
      path: "/tickets",
      handler: "ticket.findAll",
    },
    {
      method: "GET",
      path: "/tickets/:id",
      handler: "ticket.findOne",
    },
    {
      method: "GET",
      path: "/tickets/raffle/:raffle",
      handler: "ticket.findByRaffle",
    },
    {
      method: "DELETE",
      path: "/tickets",
      handler: "ticket.deleteAll",
    },
  ],
};
