export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "Internal Server Error");
    err.statusCode || (err.statusCode = 500);
    if (err.name === "CastError")
        err.message = "Invalid ID";
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
export const TryCatch = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    };
};
