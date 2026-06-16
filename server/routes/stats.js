// routes/stats.js
const router = require('express').Router();
// const auth = require('../middleware/auth');
// const { generalLimiter } = require('../middleware/rateLimit');
const statsCtrl = require('../controller/statsController');

// Admin-only stats (cards)
router.get('/overview',  statsCtrl.getOverview);

// Optional line chart data
router.get('/uploads-trend',statsCtrl.getUploadsTrend);

module.exports = router;
