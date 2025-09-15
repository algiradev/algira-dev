import authJwt from "../../../middlewares/auth-jwt";

export default {
  routes: [
    {
      method: "GET",
      path: "/users-algira",
      handler: "users-algira.findAll",
      config: {
        auth: false,
      },
    },
    {
      method: "PUT",
      path: "/users-algira/:id",
      handler: "users-algira.updateUser",
      config: {
        middlewares: [authJwt],
        auth: false,
      },
    },
  ],
};
