import authJwt from "../../../middlewares/auth-jwt";

export default {
  routes: [
    {
      method: "POST",
      path: "/auth/signup",
      handler: "auth.signup",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/auth/signin",
      handler: "auth.signin",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/auth/confirm-email/:token",
      handler: "auth.confirmEmail",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/auth/forgot-password",
      handler: "auth.forgotPassword",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/auth/reset-password/:token",
      handler: "auth.resetPassword",
      config: { auth: false },
    },

    {
      method: "POST",
      path: "/auth/update-avatar",
      handler: "auth.updateAvatar",
      config: { middlewares: [authJwt], auth: false },
    },
  ],
};
