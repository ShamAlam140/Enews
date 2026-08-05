// services/cloudinaryClient.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using process.env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload local file to Cloudinary
 * @param {string} filePath - path of the temp local file
 * @param {string} folder - destination folder in Cloudinary
 */
async function uploadToCloudinary(filePath, folder = 'khabre-ads') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public id
 */
async function deleteFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
