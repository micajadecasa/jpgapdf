import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface PdfToMergeItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  pageCount: number;
  thumbnailUrl?: string;
}

export interface MergedPdfOutput {
  blob: Blob;
  dataUrl: string;
  filename: string;
  totalPageCount: number;
  sizeBytes: number;
}

/**
 * Inspects a PDF file to retrieve its page count and an optional thumbnail of its first page.
 */
export async function inspectPdfForMerge(file: File): Promise<{ pageCount: number; thumbnailUrl?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    let thumbnailUrl: string | undefined = undefined;

    // Render 1st page as a fast thumbnail
    if (pageCount > 0) {
      try {
        const page = await pdfDoc.getPage(1);
        const baseVp = page.getViewport({ scale: 1.0 });
        const scale = Math.min(1.0, 240 / Math.max(baseVp.width, baseVp.height));
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      } catch {
        // Thumbnail generation is optional; continue if it fails
      }
    }

    await pdfDoc.cleanup();
    await pdfDoc.destroy();

    return { pageCount, thumbnailUrl };
  } catch (err) {
    console.error('Error inspeccionando PDF:', err);
    return { pageCount: 1 };
  }
}

/**
 * Merges multiple PDF files in sequential order into a single unified PDF document.
 */
export async function mergePdfDocuments(
  items: PdfToMergeItem[],
  outputFilename: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<MergedPdfOutput> {
  if (items.length < 2) {
    throw new Error('Debes añadir al menos 2 archivos PDF para poder unirlos.');
  }

  onProgress?.(0, items.length, 'Iniciando creación del documento combinado...');

  const mergedDoc = await PDFDocument.create();
  let totalPageCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(
      i + 1,
      items.length,
      `Uniendo documento ${i + 1} de ${items.length}: "${item.name}"...`
    );

    const fileBuffer = await item.file.arrayBuffer();
    // Load existing PDF with ignoreEncryption flag for max compatibility
    const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

    copiedPages.forEach((page) => {
      mergedDoc.addPage(page);
    });

    totalPageCount += pageIndices.length;
  }

  onProgress?.(items.length, items.length, 'Compilando y optimizando PDF final...');
  const mergedBytes = await mergedDoc.save();

  const finalBlob = new Blob([mergedBytes], { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(finalBlob);

  const cleanFilename = outputFilename.endsWith('.pdf')
    ? outputFilename
    : `${outputFilename}.pdf`;

  return {
    blob: finalBlob,
    dataUrl,
    filename: cleanFilename,
    totalPageCount,
    sizeBytes: finalBlob.size,
  };
}
