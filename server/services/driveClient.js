// services/driveClient.js
const { getDrive } = require('../config/drive');

/**
 * Upload a PDF stream to Google Drive (public), inside the given folder.
 * Returns public/preview + download URLs and metadata.
 *
 * @param {Readable} stream - fs.createReadStream(tempFilePath)
 * @param {string} originalName - e.g. "invoice.pdf"
 * @param {string} folderId - your Drive folder ID
 */
async function uploadPdfStreamToDrive(stream, originalName, folderId) {
  const drive = await getDrive();

  // Create the file in your shared folder (supportsAllDrives fixes quota issue)
  const create = await drive.files.create({
    requestBody: {
      name: originalName,
      parents: [folderId],
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
    fields: 'id,name,mimeType,webViewLink,webContentLink,thumbnailLink',
    supportsAllDrives: true, // ✅ important
  });

  const fileId = create.data.id;

  // Make file public (anyone with link can view)
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true, // ✅ important
  });

  // Friendly URLs
  const publicUrl   = `https://drive.google.com/uc?id=${fileId}&export=view`;      // preview/embed
  const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;  // force download

  return {
    fileId,
    name: create.data.name,
    mimeType: create.data.mimeType,
    publicUrl,
    downloadUrl,
    webViewLink: create.data.webViewLink,
    webContentLink: create.data.webContentLink,
    thumbnailLink: create.data.thumbnailLink,
  };
}

/**
 * Delete a Drive file by fileId
 */
async function deleteFromDrive(fileId) {
  const drive = await getDrive();
  try {
    // 1) Try hard delete
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return { deleted: true, mode: 'delete' };
  } catch (err) {
    const code = err?.code || err?.response?.status;
    const msg  = err?.message || err?.response?.data || String(err);
    console.error('[drive] delete error:', code, msg);

    // 2) Probe: file accessible hai ya nahi?
    try {
      const meta = await drive.files.get({
        fileId,
        fields: 'id,name,parents,driveId,trashed',
        supportsAllDrives: true,
      });
      console.log('[drive] delete-probe meta:', meta.data);

      // 3) Fallback: hard delete blocked ho to TRASH me bhej do
      try {
        await drive.files.update({
          fileId,
          requestBody: { trashed: true },
          supportsAllDrives: true,
        });
        return { deleted: true, mode: 'trash-fallback' };
      } catch (trashErr) {
        const tcode = trashErr?.code || trashErr?.response?.status;
        const tmsg  = trashErr?.message || String(trashErr);
        console.error('[drive] trash fallback failed:', tcode, tmsg);
        throw trashErr;
      }
    } catch (probeErr) {
      const pcode = probeErr?.code || probeErr?.response?.status;
      // 4) Agar get bhi 404 deta hai → hamare liye inaccessible/absent: treat as gone
      if (pcode === 404) return { deleted: true, mode: 'not-found' };
      throw probeErr;
    }
  }
}

module.exports = { uploadPdfStreamToDrive, deleteFromDrive };
