import { User } from "../models/user.models.js";
import ErrorHandler from "../utils/utilityClass.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please login", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid user id", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("You are not an admin", 403));

  next();
});