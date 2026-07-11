import type { VisibleBounds } from './types';

/**
 * Detect the non-transparent bounding box of an image.
 * Returns null if the image is fully transparent.
 */
export function detectVisibleBounds(
  imageUrl: string
): Promise<{ bounds: VisibleBounds; offsetX: number; offsetY: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        let found = false;

        // Scan in 4px steps for performance
        const step = 4;
        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 30) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
              found = true;
            }
          }
        }

        // Refine edges with full scan
        if (found) {
          // Expand by step to account for skipped pixels
          minX = Math.max(0, minX - step);
          minY = Math.max(0, minY - step);
          maxX = Math.min(canvas.width, maxX + step);
          maxY = Math.min(canvas.height, maxY + step);

          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              const alpha = data[(y * canvas.width + x) * 4 + 3];
              if (alpha > 30) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
              }
            }
          }

          resolve({
            bounds: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
            offsetX: minX,
            offsetY: minY,
          });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Crop a template image URL to its visible portion and return a new data URL.
 * Useful for generating a clean template preview.
 */
export function cropToVisibleBounds(
  imageUrl: string
): Promise<{ croppedUrl: string; bounds: VisibleBounds } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 30) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX <= minX || maxY <= minY) {
          resolve(null);
          return;
        }

        const bounds: VisibleBounds = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };

        // Crop the canvas
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = bounds.width;
        cropCanvas.height = bounds.height;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) { resolve(null); return; }
        cropCtx.drawImage(
          img,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          0,
          0,
          bounds.width,
          bounds.height
        );

        resolve({ croppedUrl: cropCanvas.toDataURL('image/png'), bounds });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
 