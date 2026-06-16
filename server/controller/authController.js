const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });

}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await Admin.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Admin already exists' });

    const admin = await Admin.create({ username, email, password });
    return res.status(201).json({ message: 'Admin created', admin });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    admin.lastLogin = new Date();
    await admin.save();

    const accessToken = signAccessToken({ id: admin._id, role: 'admin' });
    const refreshToken = signRefreshToken({ id: admin._id, role: 'admin' });

    const decoded = jwt.decode(refreshToken);
    admin.refreshToken = refreshToken;
    admin.refreshTokenExpiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
    await admin.save();

    return res.json({ message: 'Login successful', accessToken, refreshToken, admin });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const admin = await Admin.findById(payload.id);
    if (!admin || !admin.refreshToken) return res.status(401).json({ error: 'Not authorized' });
    if (admin.refreshToken !== refreshToken) return res.status(401).json({ error: 'Refresh token mismatch' });
    if (admin.refreshTokenExpiresAt && admin.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const accessToken = signAccessToken({ id: admin._id, role: 'admin' });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const admin = await Admin.findById(payload.id);
    if (admin && admin.refreshToken === refreshToken) {
      admin.refreshToken = null;
      admin.refreshTokenExpiresAt = null;
      await admin.save();
    }
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};


