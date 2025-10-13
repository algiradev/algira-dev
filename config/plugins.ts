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

  // ⚙️ Configuración del plugin de autenticación de usuarios
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET", "fallback-secret-key"),
    },
  },
});
