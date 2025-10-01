import auth from "../../auth/controllers/auth";

export default {
  routes: [
    {
      method: "POST",
      path: "/raffles/:id/draw",
      handler: "raffle-draw.draw",
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
