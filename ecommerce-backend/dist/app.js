import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import { errorMiddleware } from "./middlewares/errors.middlewares.js";
import NodeCache from "node-cache";
dotenv.config();
const port = 4000;
connectDB();
export const myCache = new NodeCache();
const app = express();
app.use(express.json());
// Test route
app.get("/", (req, res) => {
    res.send("Testing the API routes");
});
// Using Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/uploads", express.static("uploads"));
// ✅ Fix: Move errorMiddleware after all routes
app.use((err, req, res, next) => {
    errorMiddleware(err, req, res, next);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
