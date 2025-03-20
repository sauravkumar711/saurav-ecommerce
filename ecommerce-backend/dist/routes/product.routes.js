import express from "express";
import { newProduct, getLatestProducts, getAllCategories, getAdminProducts, getSingleProduct, updateProduct, deleteProduct, getAllProducts, } from "../controllers/product.controller.js";
import { adminOnly } from "../middlewares/auth.middlewares.js";
import { singleUpload } from "../middlewares/multer.middlewares.js";
const app = express.Router();
// app.post("/new", adminOnly singleUpload, newProduct);
app.post("/new", singleUpload, newProduct);
app.get("/all", getAllProducts);
app.get("/latest", getLatestProducts);
app.get("/categories", getAllCategories);
app.get("/admin-products", adminOnly, getAdminProducts);
app
    .route("/:id")
    .get(getSingleProduct)
    .put(singleUpload, updateProduct)
    .delete(deleteProduct);
export default app;
