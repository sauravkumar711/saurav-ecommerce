import { Product } from "../models/product.models.js";
export const invalidateCache = async ({ product, order, admin, }) => {
    if (product) {
        const productKeys = [
            "latest-products",
            "categories",
            "all-products",
        ];
        const products = await Product.find().select("_id");
        products.forEach(i => {
            productKeys.push(`product-${i._id}`);
        });
    }
};
