export default {
  routes: [
    {
      method: "GET",
      path: "/tickets/taken",
      handler: "ticket.getPurshasedTickets",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/tickets",
      handler: "ticket.findAll",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/tickets/:id",
      handler: "ticket.findOne",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/tickets/raffle/:raffle",
      handler: "ticket.findByRaffle",
      config: {
        auth: false,
      },
    },
    {
      method: "DELETE",
      path: "/tickets",
      handler: "ticket.deleteAll",
      config: {
        auth: false,
      },
    },
  ],
};
