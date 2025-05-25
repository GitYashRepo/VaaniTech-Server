import multer, { Multer } from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(__dirname, "../uploads");

// Ensure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // use absolute path here
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload: Multer = multer({ storage });
export default upload;
