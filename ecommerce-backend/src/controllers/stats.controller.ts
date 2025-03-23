import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { User } from "../models/user.models.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";



export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};

  if (myCache.has("admin-stats")) {
    stats = JSON.parse(myCache.get("admin-stats") as string);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      thisMonthProducts,
      thisMonthUsers,
      thisMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      totalProductsCount,
      totalUsersCount,
      allOrders,
      lastSixMonthOrders,
      distinctCategories,
      femaleUsersCount,
      latestTransactions,
    ] = await Promise.all([
      Product.find({ createdAt: { $gte: thisMonthStart, $lte: today } }),
      User.find({ createdAt: { $gte: thisMonthStart, $lte: today } }),
      Order.find({ createdAt: { $gte: thisMonthStart, $lte: today } }),
      Product.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      User.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      Order.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total createdAt"),
      Order.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } }),
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      Order.find()
        .select(["orderItems", "discount", "total", "status"])
        .limit(4),
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const count = {
      revenue: totalRevenue,
      product: totalProductsCount,
      user: totalUsersCount,
      order: allOrders.length,
    };

    const orderCounts = Array(6).fill(0);
    const monthlyRevenue = Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const yearDiff = today.getFullYear() - orderDate.getFullYear();
      const monthDiff = today.getMonth() - orderDate.getMonth() + yearDiff * 12;

      if (monthDiff >= 0 && monthDiff < 6) {
        const index = 5 - monthDiff;
        orderCounts[index]++;
        monthlyRevenue[index] += order.total || 0;
      }
    });

    const categoryCount: Record<string, number>[] = await getInventories({
      categories: distinctCategories,
      productsCount: totalProductsCount,
    });

    const userRatio = {
      male: totalUsersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    const refinedTransactions = latestTransactions.map((order) => ({
      _id: order._id,
      discount: order.discount,
      amount: order.total,
      quantity: order.orderItems.length,
      status: order.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      count,
      chart: {
        order: orderCounts,
        revenue: monthlyRevenue,
      },
      userRatio,
      latestTransaction: refinedTransactions,
    };

    myCache.set("admin-stats", JSON.stringify(stats));
  }

  return res.status(200).json({ success: true, stats });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  if (myCache.has("admin-pie-charts"))
    charts = JSON.parse(myCache.get("admin-pie-charts") as string);
  else {
    const allOrdersPromise = Order.find().select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productsOutOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find().select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      deliver: deliveredOrder,
    };

    const productCategories = await getInventories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock: productsCount - productsOutOfStock,
      outOfStock: productsOutOfStock,
    };

    const totalGrossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );
    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );
    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
    const marketingCost = Math.round(totalGrossIncome * (30 / 100));
    const netMargin =
      totalGrossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const userAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      userAgeGroup,
    };

    myCache.set("admin-pie-charts", JSON.stringify(charts));
  }
  return res.status(200).json({ success: true, charts });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";
  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 12);

    const sixMonthProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const tweleveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [tweleveMonthOrders, sixMonthUsers, sixMonthProducts] =
      await Promise.all([
        tweleveMonthOrdersPromise,
        sixMonthUsersPromise,
        sixMonthProductsPromise,
      ]);
    const productCounts = getChartData({
      length: 6,
      docArr: sixMonthProducts,
      today,
    });
    const userCounts = getChartData({
      length: 6,
      docArr: sixMonthUsers,
      today,
    });
    const orderCounts = getChartData({
      length: 12,
      docArr: tweleveMonthOrders,
      today,
    });

    charts = {
      users: userCounts,
      product: productCounts,
      order: orderCounts,
    };
    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";
  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    };

    const [orders, users, products] = await Promise.all([
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
      User.find(baseQuery).select("createdAt"),
      Product.find(baseQuery).select("createdAt"),
    ]);
    const productCounts = getChartData({ length: 12, docArr: products, today });
    const userCounts = getChartData({ length: 12, docArr: users, today });
    const discount = getChartData({ length: 12, docArr: orders, today, property: "discount" });
    const revenue = getChartData({ length: 12, docArr: orders, today, property: "total" });

    charts = {
      users: userCounts,
      product: productCounts,
      discount,
      revenue,
    };
    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});
