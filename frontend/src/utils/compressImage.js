export default function compressImage(file, maxWidth = 800, quality = 0.75) {
    return new Promise(async (resolve, reject) => {
        try {
            if (file.type === 'image/jpeg' && quality >= 0.8) {
                const bmp = await createImageBitmap(file);
                if (bmp.width <= maxWidth) {
                    bmp.close();
                    resolve(file);
                    return;
                }
                bmp.close();
            }

            const bmp = await createImageBitmap(file);
            let w = bmp.width;
            let h = bmp.height;
            if (w > maxWidth) {
                h = Math.round((h / w) * maxWidth);
                w = maxWidth;
            }

            const canvas = typeof OffscreenCanvas !== 'undefined'
                ? new OffscreenCanvas(w, h)
                : (() => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; })();

            const ctx = canvas.getContext('2d');
            ctx.drawImage(bmp, 0, 0, w, h);
            bmp.close();

            const blob = await new Promise((res, rej) => {
                canvas.convertToBlob
                    ? canvas.convertToBlob({ type: 'image/jpeg', quality }).then(res).catch(rej)
                    : canvas.toBlob((b) => b ? res(b) : rej(new Error('Compression failed')), 'image/jpeg', quality);
            });

            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        } catch (err) {
            reject(err);
        }
    });
}
