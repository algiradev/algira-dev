export default {
  routes: [
    {
      method: "GET",
      path: "/orders",
      handler: "order.findAll",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/orders/:id",
      handler: "order.findOne",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/orders",
      handler: "order.create",
      config: {
        auth: false,
      },
    },
    {
      method: "PUT",
      path: "/orders/:id",
      handler: "order.update",
      config: {
        auth: false,
      },
    },
    {
      method: "DELETE",
      path: "/orders/:id",
      handler: "order.delete",
      config: {
        auth: false,
      },
    },
  ],
};
