import { myCache } from "../app.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";

export const invalidateCache = async ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (Array.isArray(productId)) {
      productId.forEach((i) => productKeys.push(`product-${i}`));
    }

    myCache.del(productKeys);
  }

  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(ordersKeys);
  }

  if (admin) {
    myCache.del("admin-stats");
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
