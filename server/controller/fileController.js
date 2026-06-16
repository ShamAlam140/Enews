// controller/fileController.js
const path = require('path');
const fs = require('fs');
const util = require('util');
const pdfParse = require('pdf-parse');
const File = require('../models/File');
const { uploadsDir } = require('../middleware/upload');
const { uploadPdfStreamToDrive, deleteFromDrive } = require('../services/driveClient');

// ---------- Helper functions ----------
function normalizeCity(input) {
  if (!input) return undefined;
  return String(input).trim().toLowerCase();
}

function safeUnlink(p) {
  try { 
    if (fs.existsSync(p)) fs.unlinkSync(p); 
  } catch {}
}

function logObj(label, obj) {
  console.log(label, util.inspect(obj, { depth: 3, colors: true, breakLength: 120 }));
}

async function getPdfPageCount(filePath) {
  try {
    const data = await pdfParse(fs.readFileSync(filePath));
    return data.numpages || 0;
  } catch {
    return 0;
  }
}

function serialize(file) {
  return {
    id: file._id,
    filename: file.filename,
    originalName: file.originalName,
    url: file.url,
    size: file.size || file.bytes,
    mimetype: file.mimetype,
    uploadedAt: file.uploadedAt,
    uploadedBy: file.uploadedBy,
    publicId: file.publicId,
    driveFileId: file.driveFileId,
    city: file.city,
    pageCount: file.pageCount || 0,
    thumbUrl: file.thumbUrl || (file.driveFileId ? `https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w1600` : null),
  };
}

// ---------- Upload Single File ----------
// ✅ GOOGLE DRIVE UPLOAD
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      console.error('[uploadSingle] ❌ No file received. body=', req.body);
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logObj('[uploadSingle] ✅ Incoming file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });
    logObj('[uploadSingle] Body:', req.body);

    const pages = await getPdfPageCount(req.file.path);

    // ✅ Upload file to Google Drive instead of saving locally
    const stream = fs.createReadStream(req.file.path);
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is missing');
    }

    console.log(`[uploadSingle] 🚀 Uploading to Drive folder: ${folderId}`);
    const driveResult = await uploadPdfStreamToDrive(stream, req.file.originalname, folderId);
    console.log('[uploadSingle] ✅ Drive upload successful:', driveResult);

    // ✅ Save to database with Drive details
    const f = await File.create({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      path: driveResult.publicUrl,
      url: driveResult.publicUrl,
      driveFileId: driveResult.fileId,
      publicId: driveResult.fileId, // backwards compatibility
      resourceType: 'raw',
      format: 'pdf',
      bytes: req.file.size,
      size: req.file.size,
      pageCount: pages || 0,
      mimetype: req.file.mimetype,
      city: normalizeCity(req.body.city),
      uploadedBy: req.user?.id || null,
      uploadedAt: new Date(),
      thumbUrl: driveResult.thumbnailLink || `https://drive.google.com/thumbnail?id=${driveResult.fileId}&sz=w1600`,
      isActive: true,
    });

    logObj('[uploadSingle] 🟢 Saved DB doc:', f);

    // Cleanup temp uploaded file from uploads directory
    safeUnlink(req.file.path);

    return res.status(201).json({ message: 'Uploaded', file: serialize(f) });
  } catch (err) {
    const details = {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      original: err,
    };
    console.error('[uploadSingle] 🔴 FAILED:', util.inspect(details, { depth: 3, colors: true }));
    
    // Cleanup uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      safeUnlink(req.file.path);
    }
    
    return res
      .status(500)
      .json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : err?.message || 'Server error' });
  }
};

// ---------- List Files ----------
exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = String(req.query.city).toLowerCase();

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const [total, files] = await Promise.all([
      File.countDocuments(filter),
      File.find(filter).sort({ uploadedAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({ files: files.map(serialize), total, page, limit });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------- Delete File ----------
// ✅ GOOGLE DRIVE DELETE WITH LOCAL FALLBACK
exports.remove = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    // ✅ Delete from Google Drive if driveFileId exists
    const driveFileId = file.driveFileId || file.publicId;
    if (driveFileId) {
      try {
        console.log(`[remove] 🗑️ Deleting from Drive: ${driveFileId}`);
        await deleteFromDrive(driveFileId);
        console.log(`[remove] ✅ Deleted from Drive: ${driveFileId}`);
      } catch (driveErr) {
        console.error(`[remove] ❌ Failed to delete from Drive: ${driveErr.message}`);
      }
    }

    // ✅ Delete local file if it exists (for legacy local files)
    if (file.filename) {
      const localFilesDir = path.join(__dirname, '..', 'file');
      const filePath = path.join(localFilesDir, file.filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[remove] ✅ Deleted local file: ${filePath}`);
      }
    }
    
    // Also check uploads directory for backward compatibility
    if (file.filename) {
      const uploadsPath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(uploadsPath)) {
        fs.unlinkSync(uploadsPath);
        console.log(`[remove] ✅ Deleted upload file: ${uploadsPath}`);
      }
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('[remove] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------- Get Latest PDF by City ----------
// controller/fileController.js  (getLatestByCity)
exports.getLatestByCity = async (req, res) => {
  try {
    // ✅ First, scan local files directory and sync with DB
    const localFilesDir = path.join(__dirname, '..', 'file');
    if (fs.existsSync(localFilesDir)) {
      const localFiles = fs.readdirSync(localFilesDir).filter(f => f.endsWith('.pdf'));
      
      const allowedCities = File.schema.path('city').enumValues;

      for (const filename of localFiles) {
        try {
          const filePath = path.join(localFilesDir, filename);
          const stats = fs.statSync(filePath);
          
          // Extract city from filename (e.g., "Chandigarh---06-November-2025.pdf")
          const cityMatch = filename.match(/^([a-zA-Z]+)/);
          const city = cityMatch ? cityMatch[1].toLowerCase() : null;
          
          if (!city || !allowedCities.includes(city)) {
            // Skip files that don't match our valid cities list
            continue;
          }
          
          // Check if file already exists in DB
          const exists = await File.findOne({ originalName: filename });
          if (!exists) {
            const pages = await getPdfPageCount(filePath);
            await File.create({
              filename: filename,
              originalName: filename,
              path: `/files/${filename}`,
              url: `/files/${filename}`,
              size: stats.size,
              bytes: stats.size,
              mimetype: 'application/pdf',
              format: 'pdf',
              resourceType: 'raw',
              pageCount: pages || 0,
              city: city,
              uploadedAt: stats.mtime,
              isActive: true,
              thumbUrl: `/files/${filename}`, // Local file URL
            });
            console.log(`[getLatestByCity] ✅ Added local file to DB: ${filename}`);
          }
        } catch (syncErr) {
          console.error(`[getLatestByCity] ⚠️ Failed to sync local file ${filename}:`, syncErr.message);
        }
      }
    }

    const pdfs = await File.find({
      $or: [{ format: 'pdf' }, { mimetype: 'application/pdf' }],
      city: { $exists: true, $ne: null },
      isActive: true
    })
      .sort({ uploadedAt: -1 })
      .select('city thumbUrl driveFileId uploadedAt originalName path url');

    const cityMap = new Map();

    pdfs.forEach(pdf => {
      if (!pdf.city) return;
      const cityLower = String(pdf.city).toLowerCase();

      if (!cityMap.has(cityLower) || (cityMap.get(cityLower).uploadedAt < pdf.uploadedAt)) {
        // ✅ Prioritize Google Drive URLs if driveFileId exists, otherwise use local path/url
        const thumbUrl = pdf.driveFileId
          ? `https://drive.google.com/thumbnail?id=${pdf.driveFileId}&sz=w1600`
          : (pdf.path || pdf.url);

        cityMap.set(cityLower, {
          city: pdf.city,
          previewUrl: pdf.driveFileId
            ? `https://drive.google.com/file/d/${pdf.driveFileId}/preview`
            : (pdf.path || pdf.url),
          thumbUrl: thumbUrl,
          uploadedAt: pdf.uploadedAt,
          originalName: pdf.originalName,
          driveFileId: pdf.driveFileId
        });
      }
    });

    const result = Array.from(cityMap.values()).map(item => ({
      city: item.city,
      previewUrl: item.previewUrl,
      thumbUrl: item.thumbUrl,
      date: item.uploadedAt,
      originalName: item.originalName,
      driveFileId: item.driveFileId
    }));

    return res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    console.error('[getLatestByCity] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};


// ---------- Helper: Drive viewer/download links ----------
function buildDriveLinks(fileId) {
  if (!fileId) return {};
  return {
    viewerUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

/**
 * GET /api/v1/files/by-city/:city/pdfs
 * Client ko city ke sab PDFs ka meta + pdfUrl deta hai.
 * Frontend pdf.js se isi pdfUrl ko load karega (no base64, no server render).
 * Query: ?limit=20 (default 30, max 100)
 */
exports.listByCityPdfUrls = async (req, res) => {
  try {
    const city = normalizeCity(req.params.city);
    if (!city) return res.status(400).json({ error: 'City required' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    const files = await File.find({
      $or: [{ format: 'pdf' }, { mimetype: 'application/pdf' }],
      city,
      isActive: true,
    })
      .sort({ uploadedAt: -1 })
      .limit(limit);

    const base = `${req.protocol}://${req.get('host')}/api/v1/files`;

    const list = files.map((f) => {
      const driveId = f.driveFileId || f.publicId || null;
      const links = buildDriveLinks(driveId);
      return {
        id: String(f._id),
        city: f.city,
        originalName: f.originalName,
        uploadedAt: f.uploadedAt,
        pageCount: f.pageCount || 0,
        driveFileId: driveId,
        // 👇 pdf.js isi URL ko open karega (same-origin to your API)
        pdfUrl: driveId ? `${base}/${encodeURIComponent(driveId)}/pdf` : null,
        viewerUrl: links.viewerUrl || null,
      };
    });

    return res.json({ success: true, city, count: list.length, files: list });
  } catch (err) {
    console.error('[listByCityPdfUrls] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};




// ---------- Helper: Drive viewer/download links ----------
function buildDrivePageImage(driveId, page = 1, width = 1000) {
  return `https://drive.google.com/thumbnail?authuser=0&sz=w${width}&id=${driveId}&page=${page}`;
}

exports.listByCityPageImages = async (req, res) => {
  try {
    const city = String(req.params.city || '').trim().toLowerCase();
    if (!city) return res.status(400).json({ error: 'City required' });

    const clamp = (n, min, max) => Math.min(Math.max(parseInt(n, 10) || 0, min), max);
    const limit = clamp(req.query.limit, 1, 100);
    const pages = clamp(req.query.pages, 1, 60); // ✅ Support up to 60 pages
    const width = clamp(req.query.w, 200, 2000);

    const files = await File.find({
      $or: [{ format: 'pdf' }, { mimetype: 'application/pdf' }],
      city,
      isActive: true,
    }).sort({ uploadedAt: -1 }).limit(limit);

    const list = files.map((f) => {
      const driveId = f.driveFileId || null;
      
      // ✅ ALWAYS use Google Drive thumbnails (working solution)
      const pageImages = driveId 
        ? Array.from({ length: pages }, (_, i) => ({
            page: i + 1,
            url: buildDrivePageImage(driveId, i + 1, width),
          }))
        : [];

      return {
        id: String(f._id),
        originalName: f.originalName,
        uploadedAt: f.uploadedAt,
        pageCount: Number(f.pageCount || 0),
        driveFileId: driveId,
        viewerUrl: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null,
        pageImages,
      };
    });

    res.json({ success: true, city, count: list.length, files: list });
  } catch (err) {
    console.error('[listByCityPageImages] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
