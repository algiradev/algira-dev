export default {
  routes: [
    {
      method: "GET",
      path: "/footer-social-networks/all",
      handler: "footer-social-network.findAll",
      config: {
        auth: false,
      },
    },
  ],
};
