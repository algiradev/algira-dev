export default {
  routes: [
    {
      method: "POST",
      path: "/payments",
      handler: "payment.createPayment",
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
