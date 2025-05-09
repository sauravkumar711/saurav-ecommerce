import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import dashboardRoutes from "./routes/stats.routes.js";
import { errorMiddleware } from "./middlewares/errors.middlewares.js";
import ErrorHandler from "./utils/utilityClass.js";
import NodeCache from "node-cache";
import morgan from "morgan";
import Stripe from "stripe";

dotenv.config();

const port = process.env.PORT || 5000;
const stripeKey = process.env.STRIPE_KEY || ""
connectDB();

export const stripe = new Stripe(stripeKey)
export const myCache = new NodeCache();
 

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.send("Testing the API routes");
});

// Using Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));

// ✅ Fix: Move errorMiddleware after all routes
app.use((err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
