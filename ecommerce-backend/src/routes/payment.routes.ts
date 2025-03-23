import express from "express";
import {
  newCoupon,
  applyDiscount,
  allCoupons,
  deleteCoupon,
  createPaymentIntent,
} from "../controllers/payment.controller.js";
import { adminOnly } from "../middlewares/auth.middlewares.js";

const app = express.Router();

app.post("/create", createPaymentIntent);

app.get("/discount", applyDiscount);
app.post("/coupon/new", adminOnly, newCoupon);

app.get("/coupon/all", adminOnly, allCoupons);
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
