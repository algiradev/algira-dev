import { Context } from "koa";

export default {
  async index(ctx: Context) {
    ctx.body = { status: "ok" };
  },
};
