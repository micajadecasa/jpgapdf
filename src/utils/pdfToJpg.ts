import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// Configure the PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ConvertedPage {
  pageNumber: number;
  dataUrl: string; // Object URL for fast, memory-safe preview in UI
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  filename: string;
}

export interface PdfConversionOptions {
  scale?: number; // 1.5 standard, 2.0 high quality, 3.0 ultra
  quality?: number; // 0.85 - 0.95
  maxDimension?: number;
  colorMode?: 'color' | 'grayscale' | 'bw_contrast';
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Quick inspection to obtain page count from a PDF file.
 */
export async function getPdfPageCount(file: File | Blob): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  await pdfDoc.destroy();
  return numPages;
}

/**
 * Extracts each page of a PDF file into high-quality JPEG images.
 * Designed to handle multi-page scanned documents (e.g. 9-page IDs/scans)
 * reliably without browser canvas memory limits.
 */
export async function convertPdfToJpg(
  file: File | Blob,
  fileNameWithoutExt: string,
  options: PdfConversionOptions = {}
): Promise<ConvertedPage[]> {
  const { scale = 2.0, quality = 0.92, colorMode = 'color', onProgress } = options;

  onProgress?.(0, 100, 'Leyendo archivo PDF...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(5, 100, 'Cargando documento en el motor PDF...');
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const convertedPages: ConvertedPage[] = [];

  // Determine safe max dimension based on chosen preset scale
  // standard: ~1600px, high: ~2400px, ultra: ~3200px
  const maxAllowedDim = options.maxDimension || (scale >= 3.0 ? 3200 : scale <= 1.5 ? 1600 : 2400);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const progressPercent = Math.round(((pageNum - 1) / numPages) * 90) + 5;
    onProgress?.(progressPercent, numPages, `Convirtiendo hoja ${pageNum} de ${numPages}...`);

    let page: any = null;
    let canvas: HTMLCanvasElement | null = null;

    try {
      page = await pdfDoc.getPage(pageNum);

      // Measure unscaled base viewport (respects intrinsic rotation like 90/270 deg)
      const baseViewport = page.getViewport({ scale: 1.0 });
      const maxDim = Math.max(baseViewport.width, baseViewport.height);

      // Calculate safe scale: avoid generating 50-megapixel canvases on high-DPI scans
      let targetScale = scale;
      if (maxDim * targetScale > maxAllowedDim) {
        targetScale = maxAllowedDim / maxDim;
      } else if (maxDim < 700) {
        // Upscale low-res small pages for sharp readability
        targetScale = Math.max(targetScale, 1400 / maxDim);
      }

      const viewport = page.getViewport({ scale: targetScale });

      // Create isolated canvas
      canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('No se pudo inicializar el contexto 2D del lienzo.');
      }

      // Fill clean solid white background (prevents transparent black pixels in scans)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render page using PDF.js
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport,
      });

      await renderTask.promise;

      // Apply Black & White / Grayscale filter if requested
      if (colorMode && colorMode !== 'color') {
        applyGrayscaleFilter(ctx, canvas.width, canvas.height, colorMode);
      }

      // Extract high-quality JPEG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        if (!canvas) return reject(new Error('Canvas no disponible'));
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Error al exportar blob JPG en página ${pageNum}`));
          },
          'image/jpeg',
          quality
        );
      });

      // Create lightweight Object URL for instant UI preview with zero memory overhead
      const objectUrl = URL.createObjectURL(blob);
      const pageFilename = `${fileNameWithoutExt}_pag_${pageNum}.jpg`;

      convertedPages.push({
        pageNumber: pageNum,
        dataUrl: objectUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
        sizeBytes: blob.size,
        filename: pageFilename,
      });
    } catch (pageErr) {
      console.error(`Error procesando página ${pageNum}:`, pageErr);
      // If a page fails, attempt a lower-resolution fallback for that specific page
      try {
        if (page) {
          const fallbackViewport = page.getViewport({ scale: 1.0 });
          const fbCanvas = document.createElement('canvas');
          fbCanvas.width = Math.floor(fallbackViewport.width);
          fbCanvas.height = Math.floor(fallbackViewport.height);
          const fbCtx = fbCanvas.getContext('2d');
          if (fbCtx) {
            fbCtx.fillStyle = '#ffffff';
            fbCtx.fillRect(0, 0, fbCanvas.width, fbCanvas.height);
            await page.render({ canvasContext: fbCtx, viewport: fallbackViewport }).promise;
            if (colorMode && colorMode !== 'color') {
              applyGrayscaleFilter(fbCtx, fbCanvas.width, fbCanvas.height, colorMode);
            }
            const fbBlob = await new Promise<Blob>((res) =>
              fbCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.85)
            );
            const fbUrl = URL.createObjectURL(fbBlob);
            convertedPages.push({
              pageNumber: pageNum,
              dataUrl: fbUrl,
              blob: fbBlob,
              width: fbCanvas.width,
              height: fbCanvas.height,
              sizeBytes: fbBlob.size,
              filename: `${fileNameWithoutExt}_pag_${pageNum}.jpg`,
            });
            fbCanvas.width = 0;
            fbCanvas.height = 0;
          }
        }
      } catch (fallbackErr) {
        console.error(`Error en rescate de página ${pageNum}:`, fallbackErr);
      }
    } finally {
      // Clean up page resources immediately to prevent memory buildup
      if (page && typeof page.cleanup === 'function') {
        page.cleanup();
      }
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    }
  }

  // Cleanup PDF document worker memory
  try {
    await pdfDoc.cleanup();
    await pdfDoc.destroy();
  } catch {
    // Ignore cleanup errors
  }

  onProgress?.(100, numPages, `¡Las ${convertedPages.length} hojas se han convertido a JPG con éxito!`);
  return convertedPages;
}

/**
 * Packs all converted pages into a single ZIP file.
 */
export async function createZipFromPages(
  pages: ConvertedPage[],
  zipFilename: string,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  pages.forEach((page) => {
    zip.file(page.filename, page.blob);
  });

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  return content;
}

/**
 * Triggers a direct browser download of a blob or file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Applies high-fidelity Black & White or High-Contrast Document scan filter to 2D canvas context.
 */
export function applyGrayscaleFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: 'grayscale' | 'bw_contrast' = 'grayscale'
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  const isHighContrast = mode === 'bw_contrast';

  for (let i = 0; i < d.length; i += 4) {
    // Perceptual luminance formula
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

    if (isHighContrast) {
      // Document scan contrast: whitens background paper and darkens text and ink
      const contrast = 1.35;
      const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
      d[i] = adjusted;
      d[i + 1] = adjusted;
      d[i + 2] = adjusted;
    } else {
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Converts a single ConvertedPage to Black and White on the fly.
 */
export async function applyGrayscaleToPage(
  page: ConvertedPage,
  mode: 'grayscale' | 'bw_contrast' = 'grayscale'
): Promise<ConvertedPage> {
  const img = new Image();
  img.src = page.dataUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return page;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  applyGrayscaleFilter(ctx, canvas.width, canvas.height, mode);

  const newBlob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || page.blob), 'image/jpeg', 0.92)
  );

  const newUrl = URL.createObjectURL(newBlob);

  if (page.dataUrl.startsWith('blob:')) {
    URL.revokeObjectURL(page.dataUrl);
  }

  canvas.width = 0;
  canvas.height = 0;

  return {
    ...page,
    dataUrl: newUrl,
    blob: newBlob,
    sizeBytes: newBlob.size,
  };
}

