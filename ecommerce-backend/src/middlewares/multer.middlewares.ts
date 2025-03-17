import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

export const singleUpload = multer({storage}).single("photo");
// export const mutliUpload = multer().array("photos", 5);