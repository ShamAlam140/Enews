// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

// ✅ Allow only PDF
function fileFilter(req, file, cb) {
  const isPDF = file.mimetype === 'application/pdf';
  if (isPDF) return cb(null, true);
  cb(new Error('Only PDF files are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // ✅ 100MB Upload Limit
});

module.exports = { upload, uploadsDir };
