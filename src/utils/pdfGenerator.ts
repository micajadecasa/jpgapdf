import jsPDF from 'jspdf';
import { PdfConfig, UploadedImage, GeneratedPdfResult } from '../types';
import { processImageCanvas, loadImageElement } from './imageProcessor';

interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Returns page dimensions in millimeters for chosen format & orientation
 */
export function getPageDimensions(
  format: PdfConfig['pageSize'],
  orientation: 'portrait' | 'landscape'
): PageDimensions {
  let width = 210;
  let height = 297;

  switch (format) {
    case 'letter':
      width = 215.9;
      height = 279.4;
      break;
    case 'legal':
      width = 215.9;
      height = 355.6;
      break;
    case 'square':
      width = 210;
      height = 210;
      break;
    case 'a4':
    default:
      width = 210;
      height = 297;
      break;
  }

  if (orientation === 'landscape') {
    return { width: Math.max(width, height), height: Math.min(width, height) };
  }
  return { width: Math.min(width, height), height: Math.max(width, height) };
}

/**
 * Determines margin size in millimeters
 */
function getMarginMm(margin: PdfConfig['margin']): number {
  switch (margin) {
    case 'none':
      return 0;
    case 'narrow':
      return 8;
    case 'wide':
      return 22;
    case 'standard':
    default:
      return 14;
  }
}

/**
 * Resolves orientation if set to 'auto'
 */
function resolveOrientation(
  orientation: PdfConfig['orientation'],
  images: UploadedImage[]
): 'portrait' | 'landscape' {
  if (orientation !== 'auto') {
    return orientation;
  }
  if (images.length === 0) return 'portrait';
  
  // Count how many images are wider than taller
  let landscapeCount = 0;
  for (const img of images) {
    const isRotated = img.rotation === 90 || img.rotation === 270;
    const effectiveW = isRotated ? img.height : img.width;
    const effectiveH = isRotated ? img.width : img.height;
    if (effectiveW > effectiveH) {
      landscapeCount++;
    }
  }
  return landscapeCount >= images.length / 2 ? 'landscape' : 'portrait';
}

/**
 * Helper to get images per page based on layout
 */
export function getImagesPerPage(layout: PdfConfig['layout']): number {
  switch (layout) {
    case '1_per_page':
      return 1;
    case '2_per_page':
      return 2;
    case '3_per_page':
      return 3;
    case '4_per_page':
      return 4;
    case '6_per_page':
      return 6;
    default:
      return 1;
  }
}

/**
 * Main generator function that builds a polished, publication-grade PDF
 */
export async function generatePdf(
  images: UploadedImage[],
  config: PdfConfig,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedPdfResult> {
  if (images.length === 0) {
    throw new Error('Debes subir al menos una imagen para generar el PDF.');
  }

  const resolvedOrientation = resolveOrientation(config.orientation, images);
  const dims = getPageDimensions(config.pageSize, resolvedOrientation);
  const marginMm = getMarginMm(config.margin);

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: resolvedOrientation,
    unit: 'mm',
    format: config.pageSize === 'square' ? [210, 210] : config.pageSize,
    compress: true,
  });

  const processedDataUrls: string[] = [];
  const processedImgs: HTMLImageElement[] = [];

  // Step 1: Pre-process all images with canvas filters
  onProgress?.(10, 'Procesando imágenes y aplicando filtros...');
  for (let i = 0; i < images.length; i++) {
    const imgDataUrl = await processImageCanvas(images[i], config.imageQuality);
    processedDataUrls.push(imgDataUrl);
    const loaded = await loadImageElement(imgDataUrl);
    processedImgs.push(loaded);
    const progress = 10 + Math.round(((i + 1) / images.length) * 35);
    onProgress?.(progress, `Procesando imagen ${i + 1} de ${images.length}...`);
  }

  // Calculate layout chunks
  const itemsPerPage = getImagesPerPage(config.layout);
  const totalContentPages = Math.ceil(images.length / itemsPerPage);
  const totalPages = (config.includeCover ? 1 : 0) + totalContentPages;

  let currentPageNum = 1;

  // Background color helper
  const applyPageBackground = () => {
    if (config.backgroundColor === 'white') return;
    doc.saveGraphicsState();
    if (config.backgroundColor === 'warm_white') {
      doc.setFillColor(250, 249, 245);
    } else if (config.backgroundColor === 'light_gray') {
      doc.setFillColor(244, 245, 247);
    } else if (config.backgroundColor === 'dark') {
      doc.setFillColor(24, 24, 27);
    }
    doc.rect(0, 0, dims.width, dims.height, 'F');
    doc.restoreGraphicsState();
  };

  // Header & Footer helper
  const drawHeaderFooter = (pageIndexInDoc: number) => {
    if (marginMm === 0) return; // No header/footer in full-bleed mode

    const isDark = config.backgroundColor === 'dark';
    const textGray = isDark ? 180 : 120;
    const lineGray = isDark ? 60 : 225;

    // Header
    if (config.showHeaders && dims.height > 60) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textGray, textGray, textGray);

      const headerTitle = config.headerText.trim() || config.documentTitle || 'Documento PDF';
      doc.text(headerTitle, marginMm, marginMm - 4);

      // Thin separator line
      doc.setDrawColor(lineGray, lineGray, lineGray);
      doc.setLineWidth(0.2);
      doc.line(marginMm, marginMm - 2, dims.width - marginMm, marginMm - 2);
    }

    // Footer
    if (config.showPageNumbers && dims.height > 60) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textGray, textGray, textGray);

      // Separator line
      doc.setDrawColor(lineGray, lineGray, lineGray);
      doc.setLineWidth(0.2);
      doc.line(marginMm, dims.height - marginMm + 3, dims.width - marginMm, dims.height - marginMm + 3);

      const pageStr = `Página ${pageIndexInDoc} de ${totalPages}`;
      doc.text(pageStr, dims.width - marginMm, dims.height - marginMm + 7, { align: 'right' });

      // Left footer with date
      const dateStr = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      doc.text(dateStr, marginMm, dims.height - marginMm + 7);
    }
  };

  // 1. Render Cover Page if requested
  if (config.includeCover) {
    onProgress?.(50, 'Generando portada del documento...');
    applyPageBackground();
    renderCoverPage(doc, dims, config, processedDataUrls[0]);
    currentPageNum++;
  }

  // 2. Render Content Pages
  for (let pageIdx = 0; pageIdx < totalContentPages; pageIdx++) {
    const progress = 55 + Math.round(((pageIdx + 1) / totalContentPages) * 35);
    onProgress?.(progress, `Maquetando página ${pageIdx + 1} de ${totalContentPages}...`);

    if (config.includeCover || pageIdx > 0) {
      doc.addPage([dims.width, dims.height], resolvedOrientation);
    }

    applyPageBackground();
    drawHeaderFooter(currentPageNum);

    const startIndex = pageIdx * itemsPerPage;
    const pageImages: { img: UploadedImage; dataUrl: string; loaded: HTMLImageElement }[] = [];

    for (let k = 0; k < itemsPerPage; k++) {
      const idx = startIndex + k;
      if (idx < images.length) {
        pageImages.push({
          img: images[idx],
          dataUrl: processedDataUrls[idx],
          loaded: processedImgs[idx],
        });
      }
    }

    renderPageImages(doc, dims, marginMm, config, pageImages);
    currentPageNum++;
  }

  onProgress?.(95, 'Finalizando ensamblado del archivo PDF...');

  const cleanTitle = (config.documentTitle || 'documento')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  onProgress?.(100, '¡PDF generado exitosamente!');

  return {
    blob,
    dataUrl,
    filename,
    pageCount: totalPages,
    fileSizeBytes: blob.size,
  };
}

/**
 * Renders cover page based on selected style
 */
function renderCoverPage(
  doc: jsPDF,
  dims: PageDimensions,
  config: PdfConfig,
  featuredImgUrl?: string
) {
  const { width, height } = dims;
  const theme = config.coverTheme;

  if (theme === 'executive') {
    // Executive Theme: Navy header block, clean white metadata box
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, width, height * 0.38, 'F');

    // Title in header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    const title = config.coverTitle || config.documentTitle || 'Dossier de Imágenes';
    const splitTitle = doc.splitTextToSize(title, width - 40);
    doc.text(splitTitle, 20, height * 0.16);

    // Subtitle
    if (config.coverSubtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(config.coverSubtitle, 20, height * 0.26);
    }

    // Gold/cyan fine accent line
    doc.setDrawColor(56, 189, 248); // sky-400
    doc.setLineWidth(1.2);
    doc.line(20, height * 0.33, 70, height * 0.33);

    // Metadata section in lower half
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('DOCUMENTO PREPARADO POR', 20, height * 0.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(config.coverAuthor || 'Estudio Fotográfico & Documental', 20, height * 0.56);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('FECHA DE EMISIÓN', 20, height * 0.65);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(config.coverDate || new Date().toLocaleDateString('es-ES'), 20, height * 0.71);

    // Bottom subtle imprint
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, height - 25, width - 20, height - 25);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generado automáticamente con diseño profesional', 20, height - 18);
  } else if (theme === 'modern_dark') {
    // Dark Slate Modern Theme
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, width, height, 'F');

    // Accent square
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(24, 28, 12, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    const title = config.coverTitle || config.documentTitle || 'Colección de Imágenes';
    const splitTitle = doc.splitTextToSize(title, width - 48);
    doc.text(splitTitle, 24, 52);

    if (config.coverSubtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(148, 163, 184);
      doc.text(config.coverSubtitle, 24, 74);
    }

    // Bottom author block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(203, 213, 225);
    doc.text(config.coverAuthor || 'Autor', 24, height - 36);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(config.coverDate || new Date().toLocaleDateString('es-ES'), 24, height - 26);
  } else if (theme === 'editorial') {
    // Editorial Frame Theme
    doc.setFillColor(250, 249, 245);
    doc.rect(0, 0, width, height, 'F');

    // Double elegant frame
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.rect(14, 14, width - 28, height - 28);
    doc.setLineWidth(0.2);
    doc.rect(16.5, 16.5, width - 33, height - 33);

    // Centered Title
    doc.setFont('times', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(15, 23, 42);
    const title = config.coverTitle || config.documentTitle || 'Edición de Imágenes';
    const splitTitle = doc.splitTextToSize(title, width - 60);
    doc.text(splitTitle, width / 2, height * 0.38, { align: 'center' });

    if (config.coverSubtitle) {
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text(config.coverSubtitle, width / 2, height * 0.48, { align: 'center' });
    }

    // Small divider
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(width / 2 - 15, height * 0.55, width / 2 + 15, height * 0.55);

    // Author
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text((config.coverAuthor || 'Compilación').toUpperCase(), width / 2, height * 0.72, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(config.coverDate || new Date().toLocaleDateString('es-ES'), width / 2, height * 0.78, { align: 'center' });
  } else {
    // Minimal Theme (Default clean aesthetic)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    const title = config.coverTitle || config.documentTitle || 'Colección de Imágenes';
    const splitTitle = doc.splitTextToSize(title, width - 40);
    doc.text(splitTitle, 20, height * 0.35);

    if (config.coverSubtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text(config.coverSubtitle, 20, height * 0.45);
    }

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, height * 0.52, 60, height * 0.52);

    // Author & Date
    doc.setFont('helvetica', 'medium');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(config.coverAuthor || 'Autor del Documento', 20, height - 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(config.coverDate || new Date().toLocaleDateString('es-ES'), 20, height - 28);
  }
}

/**
 * Calculates slot bounding boxes for grid layouts
 */
interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

function calculateGridSlots(
  layout: PdfConfig['layout'],
  contentW: number,
  contentH: number,
  startX: number,
  startY: number
): Slot[] {
  const gap = 8; // mm between images

  switch (layout) {
    case '1_per_page':
      return [{ x: startX, y: startY, w: contentW, h: contentH }];

    case '2_per_page': {
      // If page is wider than tall, split side-by-side; else split top-bottom
      if (contentW > contentH) {
        const slotW = (contentW - gap) / 2;
        return [
          { x: startX, y: startY, w: slotW, h: contentH },
          { x: startX + slotW + gap, y: startY, w: slotW, h: contentH },
        ];
      } else {
        const slotH = (contentH - gap) / 2;
        return [
          { x: startX, y: startY, w: contentW, h: slotH },
          { x: startX, y: startY + slotH + gap, w: contentW, h: slotH },
        ];
      }
    }

    case '3_per_page': {
      // 1 Top Hero (60% height), 2 Bottom images side by side (40% height)
      const topH = contentH * 0.56;
      const bottomH = contentH - topH - gap;
      const bottomW = (contentW - gap) / 2;
      return [
        { x: startX, y: startY, w: contentW, h: topH },
        { x: startX, y: startY + topH + gap, w: bottomW, h: bottomH },
        { x: startX + bottomW + gap, y: startY + topH + gap, w: bottomW, h: bottomH },
      ];
    }

    case '4_per_page': {
      // 2x2 grid
      const slotW = (contentW - gap) / 2;
      const slotH = (contentH - gap) / 2;
      return [
        { x: startX, y: startY, w: slotW, h: slotH },
        { x: startX + slotW + gap, y: startY, w: slotW, h: slotH },
        { x: startX, y: startY + slotH + gap, w: slotW, h: slotH },
        { x: startX + slotW + gap, y: startY + slotH + gap, w: slotW, h: slotH },
      ];
    }

    case '6_per_page': {
      // 2 cols x 3 rows (or 3 cols x 2 rows if landscape)
      if (contentW > contentH) {
        const cols = 3;
        const rows = 2;
        const slotW = (contentW - gap * (cols - 1)) / cols;
        const slotH = (contentH - gap * (rows - 1)) / rows;
        const slots: Slot[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            slots.push({
              x: startX + c * (slotW + gap),
              y: startY + r * (slotH + gap),
              w: slotW,
              h: slotH,
            });
          }
        }
        return slots;
      } else {
        const cols = 2;
        const rows = 3;
        const slotW = (contentW - gap * (cols - 1)) / cols;
        const slotH = (contentH - gap * (rows - 1)) / rows;
        const slots: Slot[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            slots.push({
              x: startX + c * (slotW + gap),
              y: startY + r * (slotH + gap),
              w: slotW,
              h: slotH,
            });
          }
        }
        return slots;
      }
    }

    default:
      return [{ x: startX, y: startY, w: contentW, h: contentH }];
  }
}

/**
 * Places images into page slots respecting fit and titles/captions
 */
function renderPageImages(
  doc: jsPDF,
  dims: PageDimensions,
  marginMm: number,
  config: PdfConfig,
  pageImages: { img: UploadedImage; dataUrl: string; loaded: HTMLImageElement }[]
) {
  // Usable area
  const headerSpace = config.showHeaders && marginMm > 0 ? 6 : 0;
  const footerSpace = config.showPageNumbers && marginMm > 0 ? 8 : 0;

  const startX = marginMm;
  const startY = marginMm + headerSpace;
  const contentW = dims.width - marginMm * 2;
  const contentH = dims.height - marginMm * 2 - headerSpace - footerSpace;

  const slots = calculateGridSlots(config.layout, contentW, contentH, startX, startY);

  pageImages.forEach((item, index) => {
    if (index >= slots.length) return;
    const slot = slots[index];

    // Check if image title or caption needs to be rendered
    const hasTitle = config.showImageTitles && item.img.title.trim().length > 0;
    const hasCaption = config.showImageCaptions && item.img.caption.trim().length > 0;

    let textH = 0;
    if (hasTitle) textH += 6;
    if (hasCaption) textH += 6;

    const availableImgH = Math.max(10, slot.h - textH);
    const availableImgW = slot.w;

    // Calculate aspect ratio
    const imgNaturalW = item.loaded.naturalWidth || 800;
    const imgNaturalH = item.loaded.naturalHeight || 600;
    const imgAspect = imgNaturalW / imgNaturalH;
    const slotAspect = availableImgW / availableImgH;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (item.img.fit === 'cover') {
      // Cover the slot area
      drawW = availableImgW;
      drawH = availableImgH;
      drawX = slot.x;
      drawY = slot.y;
    } else {
      // Contain (Default: preserve aspect ratio, fit inside bounding box)
      if (imgAspect > slotAspect) {
        drawW = availableImgW;
        drawH = availableImgW / imgAspect;
      } else {
        drawH = availableImgH;
        drawW = availableImgH * imgAspect;
      }
      // Center horizontally & vertically inside slot
      drawX = slot.x + (availableImgW - drawW) / 2;
      drawY = slot.y + (availableImgH - drawH) / 2;
    }

    // Draw the image
    try {
      doc.addImage(item.dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    } catch (err) {
      console.error('Error dibujando imagen en PDF:', err);
    }

    // Render Text Below Image
    if (hasTitle || hasCaption) {
      const textStartY = slot.y + availableImgH + 3.5;
      const isDark = config.backgroundColor === 'dark';

      if (hasTitle) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(config.layout === '1_per_page' ? 11 : 9);
        doc.setTextColor(isDark ? 240 : 30, isDark ? 240 : 41, isDark ? 240 : 59);
        const titleText = doc.splitTextToSize(item.img.title, slot.w);
        doc.text(titleText, slot.x, textStartY);
      }

      if (hasCaption) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(config.layout === '1_per_page' ? 9 : 7.5);
        doc.setTextColor(isDark ? 160 : 100, isDark ? 160 : 116, isDark ? 160 : 139);
        const captionY = textStartY + (hasTitle ? 4 : 0);
        const captionText = doc.splitTextToSize(item.img.caption, slot.w);
        doc.text(captionText, slot.x, captionY);
      }
    }
  });
}
