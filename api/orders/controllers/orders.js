"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

console.log(process.env.STRIPE_SECRET_KEY);
const pricesThreshold = {
  small: 30,
  medium: 28,
  large: 25,
  extralarge: 20,
};

const totalPriceCalculator = (numberOfProducts, picturesTotal) => {
  let totalPrice = 0;
  switch (true) {
    case numberOfProducts <= 3:
      return (totalPrice =
        numberOfProducts * (picturesTotal * pricesThreshold.small));
    case numberOfProducts > 3 && numberOfProducts <= 6:
      return (totalPrice =
        numberOfProducts * (picturesTotal * pricesThreshold.medium));
    case numberOfProducts > 6 && numberOfProducts <= 15:
      return (totalPrice =
        numberOfProducts * (picturesTotal * pricesThreshold.large));
    case numberOfProducts > 15:
      return (totalPrice =
        numberOfProducts * (picturesTotal * pricesThreshold.extralarge));
  }
  return totalPrice;
};

module.exports = {
  create: async (ctx) => {
    const {
      numberOfProducts,
      picturesTotal,
      charge_id,
      specialInstructions,
      category,
      user_email,
      user_name,
      user_business_name,
      user_cui,
      customFormat,
      formatType,
      afterFinisherdProduct,
    } = ctx.request.body;
    const stripeAmount = Math.round(
      (totalPriceCalculator(numberOfProducts, picturesTotal) * 100) / 100
    );
    try {
      const order = await strapi.services.orders.create({
        user_email,
        numberOfProducts,
        picturesTotal,
        user_name,
        charge_id,
        totalPrice: stripeAmount,
        customFormat,
        specialInstructions,
        category,
        user_business_name,
        user_cui,
        formatType,
        afterFinisherdProduct,
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
    const { numberOfProducts, picturesTotal } = ctx.request.body;
    const stripeAmount = Math.round(
      totalPriceCalculator(numberOfProducts, picturesTotal) * 100
    );

    // charge on stripe

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "ron",
    });
    ctx.send({
      clientSecret: paymentIntent.client_secret,
    });
  },
};
