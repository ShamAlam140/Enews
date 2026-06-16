// controller/fileController.js
const path = require('path');
const fs = require('fs');
const util = require('util');
// pdfjs-dist v3.x for page counting (replaces pdf-parse which is incompatible)
const File = require('../models/File');
const { uploadsDir } = require('../middleware/upload');
const { uploadPdfStreamToDrive, deleteFromDrive } = require('../services/driveClient');

// Setup Canvas & DOMException polyfills for pdfjs-dist Node environment compatibility
const canvas = require('canvas');
global.DOMMatrix = canvas.DOMMatrix;
global.DOMPoint = canvas.DOMPoint;
global.ImageData = canvas.ImageData;

const buffer = require('buffer');
if (!global.DOMException) {
  if (buffer.DOMException) {
    global.DOMException = buffer.DOMException;
  } else {
    global.DOMException = class DOMException extends Error {
      constructor(message, name) {
        super(message);
        this.name = name;
      }
    };
  }
}

// Helper to download PDF from Drive
async function downloadPdfFromDrive(fileId, destPath) {
  const { getDrive } = require('../config/drive');
  const drive = await getDrive();
  const dest = fs.createWriteStream(destPath);
  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );
  return new Promise((resolve, reject) => {
    response.data
      .on('end', () => resolve(destPath))
      .on('error', (err) => reject(err))
      .pipe(dest);
  });
}

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
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    const pdfBuffer = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data: pdfBuffer, isEvalSupported: false }).promise;
    const numPages = doc.numPages || 0;
    doc.destroy(); // Free memory
    return numPages;
  } catch (err) {
    console.error('[getPdfPageCount] Error:', err.message);
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




exports.listByCityPageImages = async (req, res) => {
  try {
    const city = String(req.params.city || '').trim().toLowerCase();
    if (!city) return res.status(400).json({ error: 'City required' });

    const clamp = (n, min, max) => Math.min(Math.max(parseInt(n, 10) || 0, min), max);
    const limit = clamp(req.query.limit, 1, 100);
    const width = clamp(req.query.w, 200, 2000);

    const files = await File.find({
      $or: [{ format: 'pdf' }, { mimetype: 'application/pdf' }],
      city,
      isActive: true,
    }).sort({ uploadedAt: -1 }).limit(limit);

    const list = [];

    for (const f of files) {
      const driveId = f.driveFileId || null;
      let actualPages = f.pageCount && f.pageCount > 0 ? f.pageCount : 0;

      // ✅ If pageCount is 0/null, get real page count from cached/downloaded PDF
      if (actualPages === 0 && driveId) {
        try {
          const cacheDir = path.join(__dirname, '..', 'file', 'cache');
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

          const pdfPath = await ensurePdfCached(driveId, cacheDir);
          actualPages = await getPdfPageCount(pdfPath);

          // ✅ Update DB so we don't have to do this again
          if (actualPages > 0) {
            await File.findByIdAndUpdate(f._id, { pageCount: actualPages });
            console.log(`[listByCityPageImages] ✅ Updated pageCount for ${f.originalName}: ${actualPages}`);
          }
        } catch (err) {
          console.error(`[listByCityPageImages] ⚠️ Could not get page count for ${f.originalName}:`, err.message);
          actualPages = 1; // Fallback to at least 1 page
        }
      }

      // If still 0 (local file), try reading from local path
      if (actualPages === 0 && !driveId) {
        const localFilesDir = path.join(__dirname, '..', 'file');
        const localPath = path.join(localFilesDir, f.filename || '');
        if (fs.existsSync(localPath)) {
          actualPages = await getPdfPageCount(localPath);
          if (actualPages > 0) {
            await File.findByIdAndUpdate(f._id, { pageCount: actualPages });
          }
        }
      }

      // Ensure at least 1 page
      if (actualPages <= 0) actualPages = 1;

      const base = `${req.protocol}://${req.get('host')}/api/v1/files`;
      
      const pageImages = Array.from({ length: actualPages }, (_, i) => ({
        page: i + 1,
        url: `${base}/${driveId || f._id}/page/${i + 1}`,
      }));

      list.push({
        id: String(f._id),
        originalName: f.originalName,
        uploadedAt: f.uploadedAt,
        pageCount: actualPages,
        driveFileId: driveId,
        viewerUrl: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null,
        pageImages,
      });
    }

    res.json({ success: true, city, count: list.length, files: list });
  } catch (err) {
    console.error('[listByCityPageImages] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── NodeCanvasFactory for pdfjs-dist in Node.js ───
// pdfjs-dist v3.x needs this to create canvases for rendering in Node.js
const { createCanvas: _createCanvas } = require('canvas');

class NodeCanvasFactory {
  create(width, height) {
    const canvas = _createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

// ─── Download lock to prevent concurrent downloads of same PDF ───
const _downloadLocks = new Map(); // fileId → Promise

// Simple Mutex to prevent concurrent PDF page renders from causing memory (OOM) crashes
class SimpleMutex {
  constructor() {
    this.queue = Promise.resolve();
  }
  async run(fn) {
    let resolveLock;
    const lockPromise = new Promise((r) => { resolveLock = r; });
    const previous = this.queue;
    this.queue = lockPromise;
    try {
      await previous;
      return await fn();
    } finally {
      resolveLock();
    }
  }
}
const renderMutex = new SimpleMutex();


async function ensurePdfCached(driveFileId, cacheDir) {
  const cachedPdfPath = path.join(cacheDir, `${driveFileId}.pdf`);

  // Already downloaded & cached on disk
  if (fs.existsSync(cachedPdfPath)) {
    return cachedPdfPath;
  }

  // Another request is already downloading this PDF — wait for it
  if (_downloadLocks.has(driveFileId)) {
    await _downloadLocks.get(driveFileId);
    if (fs.existsSync(cachedPdfPath)) return cachedPdfPath;
  }

  // Download with lock
  const downloadPromise = (async () => {
    // Download to a unique temp file first, then rename (atomic)
    const tmpPath = path.join(cacheDir, `${driveFileId}_dl_${Date.now()}.tmp`);
    try {
      console.log(`[renderPdfPage] ⬇️  Downloading PDF ${driveFileId} from Drive...`);
      await downloadPdfFromDrive(driveFileId, tmpPath);
      fs.renameSync(tmpPath, cachedPdfPath);
      console.log(`[renderPdfPage] ✅ PDF cached: ${cachedPdfPath}`);
    } catch (err) {
      safeUnlink(tmpPath);
      throw err;
    }
  })();

  _downloadLocks.set(driveFileId, downloadPromise);
  try {
    await downloadPromise;
  } finally {
    _downloadLocks.delete(driveFileId);
  }

  return cachedPdfPath;
}

// Render PDF Page to Image on the fly using Canvas & PDF.js
exports.renderPdfPage = async (req, res) => {
  try {
    const { fileId, page } = req.params;
    const pageNum = parseInt(page, 10) || 1;

    // Cache directory inside server/file/cache
    const cacheDir = path.join(__dirname, '..', 'file', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cachedImagePath = path.join(cacheDir, `${fileId}_page_${pageNum}.png`);

    // If cached image exists, serve it directly
    if (fs.existsSync(cachedImagePath)) {
      return res.sendFile(cachedImagePath);
    }

    // Lookup PDF document in database
    const fileDoc = await File.findOne({
      $or: [
        { driveFileId: fileId },
        { publicId: fileId },
        { filename: fileId }
      ]
    });

    let pdfPath;

    if (fileDoc && fileDoc.driveFileId) {
      // PDF is on Google Drive — download once & cache
      pdfPath = await ensurePdfCached(fileDoc.driveFileId, cacheDir);
    } else {
      // PDF is stored locally
      const filename = fileDoc ? fileDoc.filename : fileId;
      const localFilesDir = path.join(__dirname, '..', 'file');
      const uploadsDirLocal = path.join(__dirname, '..', 'uploads');

      const path1 = path.join(localFilesDir, filename);
      const path2 = path.join(uploadsDirLocal, filename);

      if (fs.existsSync(path1)) {
        pdfPath = path1;
      } else if (fs.existsSync(path2)) {
        pdfPath = path2;
      } else {
        return res.status(404).json({ error: 'PDF file not found' });
      }
    }

    // Render page to image using pdfjs-dist v3.x and canvas (wrapped in Mutex to prevent OOM)
    await renderMutex.run(async () => {
      // Check again inside the lock in case it was rendered while waiting in queue
      if (fs.existsSync(cachedImagePath)) {
        return;
      }

      console.log(`[renderPdfPage] 🖼️  Rendering page ${pageNum} for PDF ${fileId}...`);

      // ✅ pdfjs-dist v3.x uses CommonJS require (not ESM import)
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

      const pdfBuffer = new Uint8Array(fs.readFileSync(pdfPath));
      const canvasFactory = new NodeCanvasFactory();

      const loadingTask = pdfjsLib.getDocument({
        data: pdfBuffer,
        canvasFactory: canvasFactory,
        isEvalSupported: false,
      });
      const pdfDocument = await loadingTask.promise;

      if (pageNum > pdfDocument.numPages || pageNum < 1) {
        const error = new Error(`Page number out of bounds (1-${pdfDocument.numPages})`);
        error.statusCode = 400;
        throw error;
      }

      const pdfPage = await pdfDocument.getPage(pageNum);

      // Determine the viewport scale (adjust scale for quality/size tradeoff)
      const scale = 2.0;
      const viewport = pdfPage.getViewport({ scale });

      const { canvas: canvasObj, context } = canvasFactory.create(
        Math.floor(viewport.width),
        Math.floor(viewport.height)
      );

      await pdfPage.render({
        canvasContext: context,
        viewport: viewport,
        canvasFactory: canvasFactory,
      }).promise;

      // Save rendered image to cache
      const imgBuffer = canvasObj.toBuffer('image/png');
      fs.writeFileSync(cachedImagePath, imgBuffer);
      console.log(`[renderPdfPage] ✅ Rendered page ${pageNum} successfully (${(imgBuffer.length / 1024).toFixed(0)} KB).`);

      // Cleanup: destroy the canvas
      canvasFactory.destroy({ canvas: canvasObj, context });
    });

    return res.sendFile(cachedImagePath);
  } catch (err) {
    console.error('[renderPdfPage] ❌ Error rendering PDF page:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to render PDF page' });
  }
};

