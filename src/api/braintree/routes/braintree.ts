import authJwt from "../../../middlewares/auth-jwt";

export default {
  routes: [
    {
      method: "GET",
      path: "/braintree/token",
      handler: "braintree.generateToken",
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/braintree/process-payment",
      handler: "braintree.processPayment",
      config: {
        middlewares: [authJwt],
        auth: false,
      },
    },
  ],
};
