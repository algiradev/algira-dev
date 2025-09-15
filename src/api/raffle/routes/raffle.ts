export default {
  routes: [
    {
      method: "GET",
      path: "/raffles",
      handler: "raffle.findAll",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/raffles/:id",
      handler: "raffle.findOne",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/raffles",
      handler: "raffle.create",
      config: { auth: false },
    },
    {
      method: "PUT",
      path: "/raffles/:id",
      handler: "raffle.update",
      config: { auth: false },
    },
  ],
};
