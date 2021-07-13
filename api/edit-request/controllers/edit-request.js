"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");

const pricesThreshold = {
  price: 7,
};

const totalPriceCalculator = (picturesTotal, discount = 0) => {
  const totalPrice = pricesThreshold.price * picturesTotal;
  return totalPrice - totalPrice * (discount / 100);
};

const chargeUser = async (picturesTotal, discountPercentage, user_email) => {
  const stripeAmount = Math.round(
    totalPriceCalculator(picturesTotal, discountPercentage) * 100
  );
  // charge on stripe

  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency: "ron",
    receipt_email: user_email,
    description: `Fotografie de produs.${picturesTotal} fotografii de editat`,
  });
  return paymentIntent;
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
      coupon,
    } = ctx.request.body;
    const stripeAmount = Math.round(
      (totalPriceCalculator(picturesTotal, coupon) * 100) / 100
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
    const { numberOfProducts, picturesTotal, user_email, coupon } =
      ctx.request.body;

    try {
      let response;
      response = coupon ? await stripe.coupons.retrieve(coupon) : {};
      const discountPercentage = response.percent_off
        ? response.percent_off
        : 0;
      const paymentIntent = await chargeUser(
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
