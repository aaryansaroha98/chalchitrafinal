// Cloudinary configuration for persistent image storage in production
// In development, falls back to local disk storage via multer

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary configured for cloud image storage (cloud:', process.env.CLOUDINARY_CLOUD_NAME, ')');
} else {
  console.log('📁 Cloudinary not configured - missing env vars:', 
    !process.env.CLOUDINARY_CLOUD_NAME ? 'CLOUDINARY_CLOUD_NAME' : '',
    !process.env.CLOUDINARY_API_KEY ? 'CLOUDINARY_API_KEY' : '',
    !process.env.CLOUDINARY_API_SECRET ? 'CLOUDINARY_API_SECRET' : ''
  );
  console.log('📁 Using local disk storage for uploads');
}

// Create Cloudinary storage for a specific folder
function createCloudinaryStorage(folder) {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `chalchitra/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm'],
      resource_type: 'auto',
    },
  });
}

// Create local disk storage for a specific directory
function createLocalStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = subDir
        ? path.join(__dirname, '..', '..', subDir)
        : path.join(__dirname, '..', '..', 'uploads');
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (e) {
        console.error(`Failed ensuring dir ${dir}:`, e);
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const prefix = subDir ? subDir.split('/').pop() + '-' : '';
      cb(null, prefix + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
  });
}

// Get the appropriate multer upload middleware
// folder: Cloudinary folder name (e.g., 'posters', 'team', 'gallery')
// localDir: local directory path (e.g., 'uploads', 'public/team', 'public/gallery')
function getUpload(folder, localDir) {
  if (isCloudinaryConfigured) {
    return multer({ storage: createCloudinaryStorage(folder) });
  }
  return multer({ storage: createLocalStorage(localDir) });
}

// Get the URL for an uploaded file
// In Cloudinary mode, the file object has .path with the full URL
// In local mode, we construct it from the filename
function getUploadUrl(file, localPrefix) {
  if (!file) return null;
  
  if (isCloudinaryConfigured) {
    // Cloudinary returns the full URL in file.path
    return file.path;
  }
  
  // Local storage - return relative path
  return `${localPrefix || '/uploads'}/${file.filename}`;
}

// Delete an image from Cloudinary by URL or public_id
async function deleteImage(imageUrl) {
  if (!isCloudinaryConfigured || !imageUrl) return;
  
  // Only delete Cloudinary URLs
  if (!imageUrl.includes('cloudinary.com')) return;
  
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/chalchitra/folder/filename.ext
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) return;
    
    // Remove version prefix and file extension
    let publicId = parts[1].replace(/^v\d+\//, '');
    publicId = publicId.replace(/\.[^.]+$/, '');
    
    await cloudinary.uploader.destroy(publicId);
    console.log(`☁️  Deleted image from Cloudinary: ${publicId}`);
  } catch (err) {
    console.error('Failed to delete Cloudinary image:', err.message);
  }
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  getUpload,
  getUploadUrl,
  deleteImage,
};
