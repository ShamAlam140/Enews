const router = require('express').Router();
const { authLimiter } = require('../middleware/rateLimit');
const auth = require('../middleware/auth');
const { register, login, refresh, logout } = require('../controller/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, (req, res) => res.json({ user: req.user }));
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;


