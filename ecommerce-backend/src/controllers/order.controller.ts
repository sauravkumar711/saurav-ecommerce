import { Request } from "express";
// import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import { Order } from "../models/order.models.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utilityClass.js";
import { myCache } from "../app.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;
  const key = `my-orders-${user}`;

  let orders = [];
  if (myCache.has(key)) {
    orders = JSON.parse(myCache.get(key) as string);
  } else {
    orders = await Order.find({ user }).sort("-createdAt");
    myCache.set(key, JSON.stringify(orders), 60);
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders = [];
  if (myCache.has(key)) {
    orders = JSON.parse(myCache.get(key) as string);
  } else {
    orders = await Order.find().populate("user", "name");
    myCache.set(key, JSON.stringify(orders), 60);
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const key = `order-${req.params.id}`;

  let order;
  if (myCache.has(key)) {
    order = JSON.parse(myCache.get(key) as string);
  } else {
    order = await Order.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));
    myCache.set(key, JSON.stringify(order), 60);
  }

  res.status(200).json({
    success: true,
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      orderItems,
      shippingInfo,
      subtotal,
      user,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    if (!shippingInfo || !subtotal || !orderItems || !tax || !user)
      return next(new ErrorHandler("Please fill all the fields", 401));

    const order = await Order.create({
      orderItems,
      shippingInfo,
      subtotal,
      user,
      tax,
      shippingCharges,
      discount,
      total,
    });

    await reduceStock(orderItems);

     invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

   invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();

   invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
    deletedOrderId: order._id,
  });
});
