import { TryCatch } from "../middlewares/errors.middlewares.js";
import { NextFunction, Request, Response } from "express";
import {
  NewProductRequestBody,
  SearchRequestQuery,
  BaseQuery,
} from "../types/types.js";
import { Product } from "../models/product.models.js";
import ErrorHandler from "../utils/utilityClass.js";
import { promises as fs } from "fs";
// import {faker} from "@faker-js/faker";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";

export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);

    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    message: products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(201).json({
    success: true,
    message: categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find();
    myCache.set("all-products", JSON.stringify(products));
  }
  return res.status(201).json({
    success: true,
    message: products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  if (myCache.has(`product-${req.params.id}`)) {
    product = JSON.parse(myCache.get(`product-${req.params.id}`) as string);
  } else {
    product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
    myCache.set(`product-${req.params.id}`, JSON.stringify(product));
  }
  // const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  return res.status(201).json({
    success: true,
    message: product,
  });
});

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add photo", 400));

    if (!name || !price || !stock || !category) {
      await fs.rm(photo.path);
      return next(new ErrorHandler("Please enter All Fields", 400));
    }

    const product = await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photos: photo.path,
    });

    await invalidateCache({ product: true, productId: String(product._id) });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (photo) {
    // Delete the old photo file if it exists
    if (product.photos) {
      await fs.rm(product.photos, { force: true });
      console.log("Old photo deleted");
    }
    product.photos = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();
  await invalidateCache({ product: true, productId: String(product._id) });
  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.photos) {
    try {
      await fs.rm(product.photos, { force: true });
      console.log("Product photo deleted");
    } catch (err) {
      console.error("Failed to delete product photo:", err);
    }
  }

  await product.deleteOne();
  await invalidateCache({ product: true });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;
    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       // photo: "uploads\\5ba9bd91-b89c-40c2-bb8a-66703408f986.png",
//       photo: "uploads/86174b51-da48-47e8-9112-0e9c565d6ac3.webp",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// generateRandomProducts(40)

// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };
