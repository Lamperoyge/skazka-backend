"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const pricesThreshold = {
  price: 7,
};

const totalPriceCalculator = (picturesTotal) => {
  return pricesThreshold.price * picturesTotal;
};

module.exports = {
  create: async (ctx) => {
    const {
      picturesTotal,
      charge_id,
      user_email,
      user_name,
      phone,
      user_business_name,
      user_cui,
      customFormat,
      formatType,
    } = ctx.request.body;
    const stripeAmount = Math.round(
      (totalPriceCalculator(picturesTotal) * 100) / 100
    );
    try {
      const order = await strapi.services["edit-request"].create({
        user_email,
        picturesTotal,
        user_name,
        phone,
        charge_id,
        totalPrice: stripeAmount,
        customFormat,
        user_business_name,
        user_cui,
        formatType,
        order_status: 1,
      });
      ctx.send(order);
      console.log(order);
      return order;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  createSession: async (ctx) => {
    const { numberOfProducts, picturesTotal, user_email } = ctx.request.body;
    const stripeAmount = Math.round(totalPriceCalculator(picturesTotal) * 100);
    // charge on stripe

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "ron",
      receipt_email: user_email,
      description: `Fotografie de produs.${picturesTotal} fotografii de editat`,
    });
    ctx.send({
      clientSecret: paymentIntent.client_secret,
    });
  },
};
