import { User } from "../models/user.models.js";
import { TryCatch } from "../middlewares/errors.middlewares.js";
import ErrorHandler from "../utils/utilityClass.js";
export const newUser = TryCatch(async (req, res, next) => {
    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);
    if (user) {
        return res.status(400).json({
            success: true,
            message: `Welcome back , ${user.name}`,
        });
    }
    if (!_id || !name || !email || !photo || !gender || !dob)
        return next(new ErrorHandler("Please fill all the fields", 400));
    user = await User.create({
        name,
        email,
        photo,
        gender,
        _id,
        dob: new Date(dob),
    });
    return res.status(201).json({
        success: true,
        message: `Welcome ${user.name}`,
    });
});
export const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find({});
    return res.status(200).json({
        success: true,
        message: users,
    });
});
export const getUser = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user)
        return next(new ErrorHandler("Invalid ID", 404));
    return res.status(200).json({
        success: true,
        message: user,
    });
});
export const deleteUser = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user)
        return next(new ErrorHandler("Invalid ID", 404));
    await user.deleteOne();
    return res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
