import braintree, { Customer } from "braintree";

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID as string,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY as string,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY as string,
});

export default {
  createClient: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) => {
    try {
      const result = await gateway.customer.create(userData);
      return { customer: result.customer, err: null };
    } catch (err) {
      return { customer: null, err: err.message };
    }
  },
};
