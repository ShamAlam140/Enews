const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    position: { type: String, required: true, enum: ['left', 'right'] },
    link: { type: String, trim: true, default: '' },
    driveFileId: { type: String },
    publicId: { type: String },
    isActive: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
