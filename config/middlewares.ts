export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  // "strapi::cors", para local
  {
    name: "strapi::cors",
    config: {
      origin: ["https://algira-web.vercel.app", "http://localhost:3000"],
      headers: ["*"],
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
