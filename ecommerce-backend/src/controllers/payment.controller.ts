import { TryCatch } from "../middlewares/errors.middlewares.js";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utilityClass.js";

import { Coupon } from "../models/coupon.models.js";
import { stripe } from "../app.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount) return next(new ErrorHandler("Please enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount)*100,
    currency: "inr",
  });
  return res.status(201).json({
    status: true,
    clientSecret: paymentIntent.client_secret
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;
  if (!coupon || !amount)
    return next(new ErrorHandler("Please enter both coupon and amount", 400));

  await Coupon.create({
    code: coupon,
    amount,
  });

  return res.status(201).json({
    status: true,
    message: `Coupon ${coupon} created successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ code: coupon });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));

  return res.status(200).json({
    status: true,
    discount: discount.amount,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();

  return res.status(200).json({
    status: true,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) return next(new ErrorHandler("Invalid coupon ID", 400));

  return res.status(200).json({
    status: true,
    message: `Coupon ${coupon?.code} has been successfully deleted`,
  });
});
