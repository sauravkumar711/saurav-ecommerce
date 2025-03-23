import express from "express";
import {
  newProduct,
  getLatestProducts,
  getAllCategories,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from "../controllers/product.controller.js";
import { adminOnly } from "../middlewares/auth.middlewares.js";
import { singleUpload } from "../middlewares/multer.middlewares.js";

const app = express.Router();

// To Create New Product  - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// To get all Products with filters  - /api/v1/product/all
app.get("/all", getAllProducts);

// To get last 10 Products  - /api/v1/product/latest
app.get("/latest", getLatestProducts);

// To get all unique Categories  - /api/v1/product/categories
app.get("/categories", getAllCategories);

// To get all Products (admin only)  - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

// To get, update, delete a specific Product - /api/v1/product/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
