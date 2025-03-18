import { Request } from "express";
// import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import { Order } from "../models/order.models.js";
import { NewOrderRequestBody } from "../types/types.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  const key = `my-orders-${user}`;

  let orders;

  

});
