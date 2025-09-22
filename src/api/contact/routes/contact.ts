export default {
  routes: [
    {
      method: "POST",
      path: "/contacts",
      handler: "contact.createContact",
      config: {
        auth: false,
      },
    },
  ],
};
