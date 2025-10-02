export default {
  routes: [
    {
      method: "GET",
      path: "/about-us",
      handler: "about-us.findAll",
      config: {
        auth: false,
      },
    },
  ],
};
