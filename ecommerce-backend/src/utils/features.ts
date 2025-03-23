import { myCache } from "../app.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";

export const invalidateCache = ({
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
    myCache.del(["admin-stats", "admin-pie-charts", "admin-bar-charts","admin-line-charts" ]);
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

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

type MyDocument = {
  createdAt: Date;
  discount?: number;
  total?: number;
};

type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total"; // Optional, for summing specific values
};

export const getChartData = ({ length, docArr, today, property }: FuncProps): number[] => {
  const data = new Array(length).fill(0);

  docArr.forEach((doc) => {
    const docDate = new Date(doc.createdAt);
    const yearDiff = today.getFullYear() - docDate.getFullYear();
    const monthDiff = today.getMonth() - docDate.getMonth() + yearDiff * 12;

    if (monthDiff >= 0 && monthDiff < length) {
      const index = length - monthDiff - 1;

      if (property && typeof doc[property] === "number") {
        data[index] += doc[property] as number;
      } else {
        data[index]++;
      }
    }
  });

  return data;
};
