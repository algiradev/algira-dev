export default {
  routes: [
    {
      method: "GET",
      path: "/footer-contact",
      handler: "footer-contact.find",
      config: {
        auth: false,
      },
    },
  ],
};
