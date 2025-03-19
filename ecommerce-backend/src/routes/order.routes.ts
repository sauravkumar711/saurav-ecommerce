import express from "express";
import { adminOnly } from "../middlewares/auth.middlewares.js";
import {
    newOrder,
    myOrders,
    allOrders,
  
} from "../controllers/order.controller.js";

const app = express.Router();

// route - /api/v1/order/new
app.post("/new", newOrder);
app.get("/my" , myOrders);
app.get("/all", allOrders);




export default app;