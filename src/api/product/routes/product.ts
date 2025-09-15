export default {
  routes: [
    {
      method: "GET",
      path: "/products/list-table",
      handler: "product.listTable",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/products/find-one-by-title",
      handler: "product.findOneByTitle",
      config: {
        auth: false,
      },
    },
  ],
};
