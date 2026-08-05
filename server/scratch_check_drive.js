const { getDrive } = require('./config/drive');

async function check() {
  try {
    const drive = await getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log('Checking folder ID:', JSON.stringify(folderId));
    console.log('Length:', folderId.length);
    console.log('Char codes:', [...folderId].map(c => c.charCodeAt(0)));
    
    const res = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, mimeType, trashed)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    console.log('Visible Files/Folders:');
    console.log(res.data.files);
  } catch (err) {
    console.error('Error fetching folder:', err.message);
  }
}

check();
