export default {
  routes: [
    {
      method: "GET",
      path: "/sliders",
      handler: "slider.findAll",
      config: {
        auth: false,
      },
    },
  ],
};
