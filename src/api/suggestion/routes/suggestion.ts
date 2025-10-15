export default {
  routes: [
    {
      method: "POST",
      path: "/suggestions",
      handler: "suggestion.createSuggestion",
      config: {
        auth: false,
      },
    },
  ],
};
