export default {
  routes: [
    {
      method: "GET",
      path: "/invoices",
      handler: "invoice.findAll",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/invoices/:id",
      handler: "invoice.findOne",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/invoices",
      handler: "invoice.create",
      config: {
        auth: false,
      },
    },
    {
      method: "PUT",
      path: "/invoices/:id",
      handler: "invoice.update",
      config: {
        auth: false,
      },
    },
    {
      method: "DELETE",
      path: "/invoices/:id",
      handler: "invoice.delete",
      config: {
        auth: false,
      },
    },
  ],
};
