const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true },
    originalName: { type: String, trim: true },
    path: { type: String },
    size: { type: Number, min: 0 },
    mimetype: { type: String },

    // Generic URL fields (Drive/Cloudinary both)
    url: { type: String },

    // Cloudinary-era fields (optional; backward compatible)
    publicId: { type: String },     // Drive me bhi isme driveFileId store ho raha
    resourceType: { type: String }, // e.g. 'raw'
    format: { type: String },       // e.g. 'pdf'
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },

    // ✅ NEW for Drive preview thumbnail
    thumbUrl: { type: String },   // ← Ye hum preview ke liye use karenge

    // NEW for Drive
    driveFileId: { type: String, index: true },

    pageCount: { type: Number, default: 0 }, // PDF pages

    city: {
      type: String,
      trim: true,
      enum: [
        'mumbai','delhi','noida','gurugram','bangalore','chennai','jaipur',
        'hyderabad','kolkata','bhopal','ahmedabad','pune','surat','lucknow','kanpur',
      ],
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    uploadedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ mimetype: 1 });
fileSchema.index({ city: 1 });

module.exports = mongoose.model('File', fileSchema);
