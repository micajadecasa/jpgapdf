import { GeneratedPdfResult, SavedPdfHistoryItem } from '../types';

const STORAGE_KEY = 'foliopdf_saved_docs';

/**
 * Downloads the PDF directly to user's device
 */
export function downloadPdf(result: GeneratedPdfResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Checks if native Web Share API with files is supported
 */
export function canWebShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Shares PDF file natively to installed cloud services (Google Drive, iCloud, Dropbox, OneDrive, Mail)
 */
export async function sharePdfToCloud(result: GeneratedPdfResult): Promise<boolean> {
  if (!canWebShareFiles()) {
    throw new Error('Tu navegador no admite compartir archivos directamente a apps en la nube.');
  }

  const file = new File([result.blob], result.filename, { type: 'application/pdf' });
  await navigator.share({
    title: result.filename,
    text: 'Documento PDF generado con FolioPDF Studio',
    files: [file],
  });
  return true;
}

/**
 * Saves a generated PDF into local browser cloud history (IndexedDB / localStorage metadata)
 */
export function saveToLocalCloud(result: GeneratedPdfResult, title: string, imageCount: number): SavedPdfHistoryItem {
  const item: SavedPdfHistoryItem = {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    filename: result.filename,
    title: title || result.filename,
    date: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    pageCount: result.pageCount,
    imageCount,
    fileSizeBytes: result.fileSizeBytes,
    dataUrl: result.dataUrl,
  };

  try {
    const existing = getSavedCloudDocuments();
    // Keep last 8 documents to prevent quota issues
    const updated = [item, ...existing.filter((d) => d.id !== item.id)].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('No se pudo guardar en almacenamiento local de documentos:', err);
  }

  return item;
}

/**
 * Retrieves all stored documents in local cloud history
 */
export function getSavedCloudDocuments(): SavedPdfHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Removes a document from local cloud history
 */
export function removeSavedCloudDocument(id: string): void {
  try {
    const existing = getSavedCloudDocuments();
    const filtered = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error al eliminar documento:', err);
  }
}

/**
 * Direct print of the PDF
 */
export function printPdf(result: GeneratedPdfResult): void {
  const url = URL.createObjectURL(result.blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 60000);
  };
}
