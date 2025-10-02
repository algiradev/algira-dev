export default {
  routes: [
    {
      method: "GET",
      path: "/comments",
      handler: "comment.findAll",
      config: {
        auth: false,
      },
    },
  ],
};
