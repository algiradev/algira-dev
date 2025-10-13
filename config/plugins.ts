export default ({ env }) => ({
  // 👉 Configuración de envío de correos con SendGrid
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "algira.dev@gmail.com",
        defaultReplyTo: "algira.dev@gmail.com",
      },
    },
  },

  //Cloudinary
  upload: {
    config: {
      provider: "@strapi/provider-upload-cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
        secure: true,
      },
      actionOptions: {
        upload: {
          folder: "algira",
          resource_type: "image",
        },
        delete: {},
      },
      breakpoints: {
        large: 1000,
        medium: 750,
        small: 500,
        thumbnail: 245,
      },
      baseUrl: "https://res.cloudinary.com/dmit9qci3/image/upload/",
    },
  },

  // ⚙️ Configuración del plugin de autenticación de usuarios
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET", "fallback-secret-key"),
    },
  },
});
