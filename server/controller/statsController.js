// controller/statsController.js
const File = require('../models/File');
const Admin = require('../models/Admin');

exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 6); // last 7 days

    // Base aggregations
    const [
      totalFiles,
      filesToday,
      filesThisWeek,
      byMime,
      totalBytesAgg,
      lastUploadAgg,
      byCityAgg,
      adminsCount,
      activeAdminsCount,
    ] = await Promise.all([
      File.estimatedDocumentCount(),
      File.countDocuments({ uploadedAt: { $gte: startOfToday } }),
      File.countDocuments({ uploadedAt: { $gte: startOfWeek } }),
      File.aggregate([
        {
          $group: {
            _id: {
              type: {
                $switch: {
                  branches: [
                    { case: { $regexMatch: { input: '$mimetype', regex: /^image\// } }, then: 'image' },
                    { case: { $regexMatch: { input: '$mimetype', regex: /^video\// } }, then: 'video' },
                    { case: { $regexMatch: { input: '$mimetype', regex: /^audio\// } }, then: 'audio' },
                    { case: { $regexMatch: { input: '$mimetype', regex: /pdf$/ } }, then: 'pdf' },
                  ],
                  default: 'other',
                },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      File.aggregate([{ $group: { _id: null, bytes: { $sum: { $ifNull: ['$bytes', '$size'] } } } }]),
      File.find().sort({ uploadedAt: -1 }).limit(1).select('uploadedAt'),
      File.aggregate([
        { $match: { city: { $exists: true, $ne: null } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Admin.estimatedDocumentCount(),
      Admin.countDocuments({ isActive: true }),
    ]);

    const typeCounts = Object.fromEntries(byMime.map(x => [x._id.type, x.count]));
    const totalBytes = totalBytesAgg?.[0]?.bytes || 0;
    const lastUploadAt = lastUploadAgg?.[0]?.uploadedAt || null;

    return res.json({
      // Cards ke liye seedha ready numbers:
      totalFiles,
      filesToday,
      filesThisWeek,
      totalStorageBytes: totalBytes,
      lastUploadAt,

      // Breakdown (agar chhote cards/chips dikhane hain):
      typeCounts: {
        image: typeCounts.image || 0,
        video: typeCounts.video || 0,
        audio: typeCounts.audio || 0,
        pdf: typeCounts.pdf || 0,
        other: typeCounts.other || 0,
      },

      // Top 5 cities for a side card / mini table:
      topCities: byCityAgg.map(c => ({ city: c._id, count: c.count })),

      // Admin related quick info:
      admins: {
        total: adminsCount || 0,
        active: activeAdminsCount || 0,
        me: {
          id: req.user?.id || null,
          lastLogin: req.user?.lastLogin || null,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Optional: line chart ke liye last 14 days uploads
exports.getUploadsTrend = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || '14', 10), 1), 90);
    const start = new Date(); start.setDate(start.getDate() - (days - 1));
    // Group by YYYY-MM-DD
    const data = await File.aggregate([
      { $match: { uploadedAt: { $gte: start } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates to keep chart smooth
    const map = new Map(data.map(d => [d._id, d.count]));
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      series.push({ date: key, count: map.get(key) || 0 });
    }

    return res.json({ days, series });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
