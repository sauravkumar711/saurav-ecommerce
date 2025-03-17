




import { Product } from "../models/product.models.js";
import { InvalidateCacheProps, } from "../types/types.js";

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