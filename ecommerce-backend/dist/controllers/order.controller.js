// import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import { Order } from "../models/order.models.js";
export const myOrders = TryCatch(async (req, res, next) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;
    let orders;
    orders = await redis.get(key);
    if (orders)
        orders = JSON.parse(orders);
    else {
        orders = await Order.find({ user });
        await redis.setex(key, redisTTL, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        orders,
    });
});
