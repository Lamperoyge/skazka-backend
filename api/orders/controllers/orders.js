"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const pricesThreshold = {
  small: 30,
  medium: 28,
  large: 25,
  extralarge: 20,
};

const totalPriceCalculator = (
  numberOfProducts,
  picturesTotal,
  discount = 0
) => {
  let totalPrice = 0;
  switch (true) {
    case numberOfProducts <= 3:
      totalPrice = numberOfProducts * (picturesTotal * pricesThreshold.small);
      return totalPrice - totalPrice * (discount / 100);
    case numberOfProducts > 3 && numberOfProducts <= 6:
      totalPrice = numberOfProducts * (picturesTotal * pricesThreshold.medium);
      return totalPrice - totalPrice * (discount / 100);

    case numberOfProducts > 6 && numberOfProducts <= 15:
      totalPrice = numberOfProducts * (picturesTotal * pricesThreshold.large);
      return totalPrice - totalPrice * (discount / 100);

    case numberOfProducts > 15:
      totalPrice =
        numberOfProducts * (picturesTotal * pricesThreshold.extralarge);
      return totalPrice - totalPrice * (discount / 100);
  }
  return Math.round((totalPrice - totalPrice * (discount / 100)) * 100) / 100;
};

const chargeUser = async (
  numberOfProducts,
  picturesTotal,
  discountPercentage,
  user_email
) => {
  const stripeAmount = Math.round(
    totalPriceCalculator(numberOfProducts, picturesTotal, discountPercentage) *
      100
  );
  console.log(stripeAmount);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency: "ron",
    receipt_email: user_email,
    description: `Fotografie de produs. ${numberOfProducts} produse. ${picturesTotal} fotografii per produs`,
  });
  console.log(paymentIntent);
  return paymentIntent;
};

module.exports = {
  create: async (ctx) => {
    const {
      numberOfProducts,
      picturesTotal,
      charge_id,
      phone,
      specialInstructions,
      category,
      user_email,
      user_name,
      user_business_name,
      user_cui,
      customFormat,
      formatType,
      afterFinisherdProduct,
      coupon,
    } = ctx.request.body;
    const stripeAmount = Math.round(
      (totalPriceCalculator(numberOfProducts, picturesTotal, coupon) * 100) /
        100
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
        phone,
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
  applyDiscount: async (ctx) => {
    const { code } = ctx.request.body;
    try {
      const coupon = await stripe.coupons.retrieve(code);
      ctx.send(coupon);
    } catch (error) {
      ctx.send(error);
    }
  },
  createSession: async (ctx) => {
    const { numberOfProducts, picturesTotal, user_email, coupon } =
      ctx.request.body;

    // charge on stripe

    try {
      let response;
      response = coupon ? await stripe.coupons.retrieve(coupon) : {};
      const discountPercentage = response.percent_off
        ? response.percent_off
        : 0;
      const paymentIntent = await chargeUser(
        numberOfProducts,
        picturesTotal,
        discountPercentage,
        user_email
      );
      ctx.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      ctx.send(error);
    }
  },
};
