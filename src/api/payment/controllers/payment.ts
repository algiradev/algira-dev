import { Context } from "koa";
import braintree from "../../../extensions/braintree";

export default () => ({
  async createPayment(ctx: Context) {
    const { amount, paymentMethodNonce } = ctx.request.body;

    try {
      const result = await braintree.transaction.sale({
        amount,
        paymentMethodNonce,
        options: {
          submitForSettlement: true,
        },
      });

      if (result.success) {
        return ctx.send({
          message: "Payment successful",
          transactionId: result.transaction.id,
        });
      } else {
        ctx.throw(400, `Payment failed: ${result.message}`);
      }
    } catch (error) {
      ctx.throw(500, `Payment error: ${error.message}`);
    }
  },
});
