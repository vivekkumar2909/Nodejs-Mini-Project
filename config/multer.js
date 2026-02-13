import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Ensure uploads folder exists
const uploadPath = "uploads/";

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        // Extract extension
        const ext = path.extname(file.originalname);

        // Generate random filename using crypto
        const randomName = crypto.randomBytes(16).toString("hex");

        // Final filename
        cb(null, randomName + ext);
    }
});

const upload = multer({ storage });

export default upload;
