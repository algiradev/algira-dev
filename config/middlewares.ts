export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  // "strapi::cors", para local
  {
    name: "strapi::cors",
    config: {
      origin: ["https://algira-web.vercel.app/"],
      credentials: true,
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
