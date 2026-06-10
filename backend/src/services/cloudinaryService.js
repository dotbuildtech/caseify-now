const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const FOLDER = 'phone-cover-platform';

const uploadFromBuffer = (buffer, folder = FOLDER) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                eager: [{ quality: 'auto:good', fetch_format: 'auto' }],
                eager_async: true
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        Readable.from(buffer).pipe(uploadStream);
    });
};

const uploadFromPath = (filePath, folder = FOLDER) => {
    return cloudinary.uploader.upload(filePath, { folder, resource_type: 'image' });
};

const uploadDataUrl = (dataUrl, folder = FOLDER) => {
    return cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: 'image',
        eager: [{ quality: 'auto:good', fetch_format: 'auto', width: 600, crop: 'scale' }],
        eager_async: true
    });
};

const deleteImage = (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

const getPublicIdFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('cloudinary.com')) return null;
    const parts = url.split('/');
    const fileWithExt = parts[parts.length - 1];
    const publicId = fileWithExt.replace(/\.[^.]+$/, '');
    const folder = parts[parts.length - 2];
    if (folder && !folder.startsWith('v')) return `${folder}/${publicId}`;
    return publicId;
};

module.exports = { uploadFromBuffer, uploadFromPath, uploadDataUrl, deleteImage, getPublicIdFromUrl };
