import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import userRoutes from "./routes/user.routes.js";
import { errorMiddleware } from "./middlewares/errors.middlewares.js";
dotenv.config();
const port = 4000;
connectDB();
const app = express();
app.use(express.json());
// Test route
app.get("/", (req, res) => {
    res.send("Testing the API routes");
});
// Using Routes
app.use("/api/v1/user", userRoutes);
// ✅ Fix: Move errorMiddleware after all routes
app.use((err, req, res, next) => {
    errorMiddleware(err, req, res, next);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
