import express from "express";
import { adminOnly } from "../middlewares/auth.middlewares.js";
import { newOrder, myOrders, allOrders, getSingleOrder, processOrder, deleteOrder, } from "../controllers/order.controller.js";
const app = express.Router();
// route - /api/v1/order/new
app.post("/new", newOrder);
app.get("/my", myOrders);
app.get("/all", adminOnly, allOrders);
app.route("/:id").get(getSingleOrder).put(processOrder).delete(deleteOrder);
export default app;
