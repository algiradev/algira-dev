import authJwt from "../../../middlewares/auth-jwt";

export default {
  routes: [
    {
      method: "GET",
      path: "/invoices/me",
      handler: "invoice.findUserInvoices",
      config: {
        middlewares: [authJwt],
        auth: false,
      },
    },
  ],
};
