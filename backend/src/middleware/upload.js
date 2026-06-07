const multer = require('multer');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, WEBP, GIF images are allowed'));
    }
    cb(null, true);
};

const imageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 }
});

module.exports = imageUpload;
