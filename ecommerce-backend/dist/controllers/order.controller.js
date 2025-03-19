// import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import { Order } from "../models/order.models.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utilityClass.js";
import { myCache } from "../app.js";
export const newOrder = TryCatch(async (req, res, next) => {
    const { orderItems, shippingInfo, subtotal, user, tax, shippingCharges, discount, total, } = req.body;
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
    await invalidateCache({ product: true, order: true, admin: true });
    res.status(201).json({
        success: true,
        message: "Order Placed Successfully",
    });
});
export const myOrders = TryCatch(async (req, res, next) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;
    let orders = [];
    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key));
    }
    else {
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
        orders = JSON.parse(myCache.get(key));
    }
    else {
        orders = await Order.find().populate("user", "name");
        myCache.set(key, JSON.stringify(orders), 60);
    }
    res.status(200).json({
        success: true,
        orders,
    });
});
