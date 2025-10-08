export default {
  routes: [
    {
      method: "GET",
      path: "/countries/all",
      handler: "country.findAll",
      config: {
        auth: false,
      },
    },
  ],
};
