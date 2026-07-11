const { uploadDataUrl } = require('../services/cloudinaryService');

const REMOTE_URL_RE = /^https?:\/\//;

async function saveDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;

    // Already a remote URL — no need to re-upload
    if (REMOTE_URL_RE.test(dataUrl)) return dataUrl;

    if (!dataUrl.startsWith('data:image')) return dataUrl;

    try {
        const result = await uploadDataUrl(dataUrl, 'phone-cover-platform/thumbnails');
        return result.secure_url;
    } catch {
        return dataUrl;
    }
}

module.exports = { saveDataUrl };
