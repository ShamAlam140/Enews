// controller/adController.js
const fs = require('fs');
const Ad = require('../models/Ad');
const { uploadFileStreamToDrive, deleteFromDrive } = require('../services/driveClient');

function safeUnlink(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

// Upload Ad Image and metadata
exports.uploadAd = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ad image file uploaded' });
    }

    const { position, link } = req.body;
    if (!position || !['left', 'right'].includes(position)) {
      safeUnlink(req.file.path);
      return res.status(400).json({ error: 'Invalid position. Must be "left" or "right"' });
    }

    let imageUrl = '';
    let driveFileId = '';
    let publicId = '';

    // Check if Cloudinary credentials are set
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const { uploadToCloudinary } = require('../services/cloudinaryClient');
      const cloudResult = await uploadToCloudinary(req.file.path, 'khabre-ads');
      imageUrl = cloudResult.secure_url;
      publicId = cloudResult.public_id;
    } else {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!folderId) {
        safeUnlink(req.file.path);
        throw new Error('Neither Cloudinary credentials nor GOOGLE_DRIVE_FOLDER_ID is set in environment');
      }

      // Upload image to Drive
      const stream = fs.createReadStream(req.file.path);
      const driveResult = await uploadFileStreamToDrive(stream, req.file.originalname, folderId, req.file.mimetype);
      imageUrl = driveResult.publicUrl;
      driveFileId = driveResult.fileId;
    }

    // Save to Database
    const ad = await Ad.create({
      imageUrl,
      position,
      link: link || '',
      driveFileId: driveFileId || undefined,
      publicId: publicId || undefined,
      isActive: true,
      uploadedAt: new Date()
    });

    // Cleanup temp file
    safeUnlink(req.file.path);

    return res.status(201).json({ success: true, message: 'Ad created successfully', ad });
  } catch (err) {
    console.error('[adController] uploadAd failed:', err);
    if (req.file && req.file.path) {
      safeUnlink(req.file.path);
    }
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};

// List Active Ads (Public) - return latest active left and right ad
exports.listActive = async (req, res) => {
  try {
    const leftAd = await Ad.findOne({ position: 'left', isActive: true }).sort({ uploadedAt: -1 });
    const rightAd = await Ad.findOne({ position: 'right', isActive: true }).sort({ uploadedAt: -1 });
    
    return res.json({ success: true, leftAd, rightAd });
  } catch (err) {
    console.error('[adController] listActive failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// List All Ads (Admin)
exports.listAll = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ uploadedAt: -1 });
    return res.json({ success: true, ads });
  } catch (err) {
    console.error('[adController] listAll failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Toggle Ad Active Status (Admin)
exports.toggleActive = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    ad.isActive = !ad.isActive;
    await ad.save();

    return res.json({ success: true, message: `Ad ${ad.isActive ? 'activated' : 'deactivated'} successfully`, ad });
  } catch (err) {
    console.error('[adController] toggleActive failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Delete Ad (Admin)
exports.remove = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    if (ad.publicId) {
      try {
        const { deleteFromCloudinary } = require('../services/cloudinaryClient');
        await deleteFromCloudinary(ad.publicId);
      } catch (cloudErr) {
        console.error(`[adController] Cloudinary deletion failed: ${cloudErr.message}`);
      }
    } else if (ad.driveFileId) {
      try {
        await deleteFromDrive(ad.driveFileId);
      } catch (driveErr) {
        console.error(`[adController] Drive file deletion failed: ${driveErr.message}`);
      }
    }

    await Ad.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Ad deleted successfully' });
  } catch (err) {
    console.error('[adController] remove failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
