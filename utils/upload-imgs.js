import multer from "multer";
import { v4 } from "uuid";

const exts = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const fileFilter = (req, file, cb) => {
    cb(null, !!exts[file.mimetype]);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/imgs");
    },
    filename: (req, file, cb) => {
        cb(null, v4() + exts[file.mimetype]);
    },
});

export default multer({ fileFilter, storage });
