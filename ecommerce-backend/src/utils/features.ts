




import { Product } from "../models/product.models.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";

export const invalidateCache = async ({
    product,
    order,
    admin,

  }: InvalidateCacheProps) => {
    if (product) {
      const productKeys: string[] = [
        "latest-products",
        "categories",
        "all-products",
      ];
  
      const products = await Product.find().select("_id");

        products.forEach(i  => {
            productKeys.push(`product-${i._id}`);
        });

    }
  };

  export const reduceStock = async (orderItems: OrderItemType[]) => {
    for (let i = 0; i < orderItems.length; i++) {
      const order = orderItems[i];
      const product = await Product.findById(order.productId);
      if (!product) {
        console.error(`Product not found for ID: ${order.productId}`);
        throw new Error("Product Not Found");
      }
      product.stock -= order.quantity;
      await product.save();
    }
  };