import { UploadedImage } from '../types';

/**
 * Loads an image element from a URL or data URI
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('No se pudo cargar la imagen: ' + err));
    img.src = src;
  });
}

/**
 * Applies filters and transformations to an image and returns a processed Data URL
 */
export async function processImageCanvas(image: UploadedImage, targetQuality = 0.92): Promise<string> {
  const img = await loadImageElement(image.originalUrl);
  
  // Calculate canvas dimensions according to 90/270 deg rotation
  const isRotated90or270 = image.rotation === 90 || image.rotation === 270;
  const canvasWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const canvasHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  // Max dimension limit to keep rendering fast and memory safe
  const maxDim = 2800;
  let scale = 1;
  if (canvasWidth > maxDim || canvasHeight > maxDim) {
    scale = Math.min(maxDim / canvasWidth, maxDim / canvasHeight);
  }

  const finalWidth = Math.round(canvasWidth * scale);
  const finalHeight = Math.round(canvasHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D del Canvas');
  }

  // Clear canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, finalWidth, finalHeight);

  // Apply transformation matrix for rotation and flip
  ctx.save();
  ctx.translate(finalWidth / 2, finalHeight / 2);

  // Rotation
  const rad = (image.rotation * Math.PI) / 180;
  ctx.rotate(rad);

  // Flips
  const scaleX = image.flipH ? -1 : 1;
  const scaleY = image.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw the image centered
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Apply pixel-level filters if needed
  applyCanvasFilters(ctx, finalWidth, finalHeight, image);

  return canvas.toDataURL('image/jpeg', targetQuality);
}

/**
 * Modifies canvas pixel buffer for contrast, brightness, saturation, and artistic/document filters
 */
function applyCanvasFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: UploadedImage
) {
  const hasAdjustments =
    image.brightness !== 0 ||
    image.contrast !== 0 ||
    image.saturation !== 100 ||
    image.filter !== 'none';

  if (!hasAdjustments) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Brightness factor: -50 to +50 -> -128 to +128
  const brightnessOffset = (image.brightness / 50) * 80;

  // Contrast factor: [-50, 50] -> [0.5, 2.0]
  // factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const c = (image.contrast / 50) * 100;
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));

  // Saturation factor: [0, 200] -> [0.0, 2.0]
  const satFactor = image.saturation / 100;

  const filter = image.filter;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Basic Brightness & Contrast
    if (brightnessOffset !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    if (contrastFactor !== 1) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 2. Saturation
    if (satFactor !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    // 3. Preset filters
    switch (filter) {
      case 'grayscale': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray;
        g = gray;
        b = gray;
        break;
      }
      case 'scan': {
        // High contrast document enhancer for invoices/scans
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Threshold with smooth S-curve
        const normalized = gray / 255;
        let enhanced: number;
        if (normalized > 0.6) {
          // Push paper background to clean white
          enhanced = Math.min(255, 255 * (1 + (normalized - 0.6) * 1.5));
        } else {
          // Darken ink/letters
          enhanced = Math.max(0, gray * 0.75);
        }
        r = enhanced;
        g = enhanced;
        b = enhanced;
        break;
      }
      case 'contrast': {
        // Punchy boost
        r = Math.min(255, Math.max(0, 1.25 * (r - 128) + 128));
        g = Math.min(255, Math.max(0, 1.25 * (g - 128) + 128));
        b = Math.min(255, Math.max(0, 1.25 * (b - 128) + 128));
        break;
      }
      case 'warm': {
        // Warm tone / sepia tint
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = tr * 0.9 + r * 0.1;
        g = tg * 0.9 + g * 0.1;
        b = tb * 0.9 + b * 0.1;
        break;
      }
      case 'cool': {
        // Subtle cool tone
        r = r * 0.92;
        g = g * 0.98;
        b = Math.min(255, b * 1.15);
        break;
      }
      case 'invert': {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }
    }

    // Clamp
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Formats byte size to human readable (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
