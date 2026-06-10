const { uploadDataUrl } = require('../services/cloudinaryService');

async function saveDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        return dataUrl;
    }

    try {
        const result = await uploadDataUrl(dataUrl, 'phone-cover-platform/thumbnails');
        return result.secure_url;
    } catch {
        return dataUrl;
    }
}

module.exports = { saveDataUrl };
