export default {
  routes: [
    {
      method: "GET",
      path: "/raffle-results",
      handler: "raffle-winner.getResults",
      config: { auth: false },
    },
  ],
};
