const router = require('express').Router();

const { generalLimiter } = require('../middleware/rateLimit');
const { upload } = require('../middleware/upload');
const auth = require('../middleware/auth');
const fileCtrl = require('../controller/fileController');

// Public routes
router.get('/', generalLimiter, fileCtrl.list);
router.get('/latest-by-city', generalLimiter, fileCtrl.getLatestByCity);


router.get('/by-city/:city/page-images', fileCtrl.listByCityPageImages);


// Protected routes (require auth)
router.post('/upload', upload.single('file'), fileCtrl.uploadSingle);
router.delete('/:id',  fileCtrl.remove);

module.exports = router;
