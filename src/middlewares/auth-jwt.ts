import { Context, Next } from "koa";
import jwt, { TokenExpiredError } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "my-secret-key";

export default async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "Falta el token" };
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    ctx.status = 401;
    ctx.body = { error: "Token inválido" };
    return;
  }

  const token = parts[1];

  try {
    const decoded = await strapi
      .service("plugin::users-permissions.jwt")
      .verify(token);
    console.log("🛡 Middleware ejecutado. Authorization:", decoded);

    ctx.state.user = decoded;
    await next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      ctx.status = 401;
      ctx.body = { error: "Token expirado" };
    } else {
      ctx.status = 401;
      ctx.body = { error: "Token inválido" };
    }
  }
};
