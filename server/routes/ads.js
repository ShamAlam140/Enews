const router = require('express').Router();
const { generalLimiter } = require('../middleware/rateLimit');
const { uploadImage } = require('../middleware/upload');
const auth = require('../middleware/auth');
const adCtrl = require('../controller/adController');

// Public route
router.get('/', generalLimiter, adCtrl.listActive);

// Protected routes (admin auth required)
router.get('/all', auth, adCtrl.listAll);
router.post('/upload', auth, uploadImage.single('file'), adCtrl.uploadAd);
router.put('/:id/toggle', auth, adCtrl.toggleActive);
router.delete('/:id', auth, adCtrl.remove);

module.exports = router;
