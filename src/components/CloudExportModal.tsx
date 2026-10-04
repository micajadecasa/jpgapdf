import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  Share2,
  Printer,
  X,
  CheckCircle2,
  ExternalLink,
  History,
  Trash2,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeneratedPdfResult, SavedPdfHistoryItem } from '../types';
import {
  downloadPdf,
  sharePdfToCloud,
  canWebShareFiles,
  saveToLocalCloud,
  getSavedCloudDocuments,
  removeSavedCloudDocument,
  printPdf,
} from '../utils/cloudExport';

interface CloudExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfResult: GeneratedPdfResult | null;
  imagesCount: number;
}

export const CloudExportModal: React.FC<CloudExportModalProps> = ({
  isOpen,
  onClose,
  pdfResult,
  imagesCount,
}) => {
  const [hasShared, setHasShared] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<SavedPdfHistoryItem[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen || !pdfResult) return;

    // Automatically save generated doc into history
    saveToLocalCloud(pdfResult, pdfResult.filename, imagesCount);
    setHistoryList(getSavedCloudDocuments());

    // Celebrate with subtle confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore if confetti fails
    }
  }, [isOpen, pdfResult, imagesCount]);

  if (!isOpen || !pdfResult) return null;

  const handleDownload = () => {
    downloadPdf(pdfResult);
  };

  const handleNativeShare = async () => {
    setShareError(null);
    try {
      await sharePdfToCloud(pdfResult);
      setHasShared(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setShareError(err.message || 'No se pudo compartir a la nube.');
      }
    }
  };

  const handleOpenGoogleDrive = () => {
    // First trigger download so user has the file
    downloadPdf(pdfResult);
    // Open Google Drive upload screen in new tab
    window.open('https://drive.google.com/drive/u/0/my-drive', '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    printPdf(pdfResult);
  };

  const handleDeleteHistory = (id: string) => {
    removeSavedCloudDocument(id);
    setHistoryList(getSavedCloudDocuments());
  };

  const handleCopyFileName = () => {
    navigator.clipboard.writeText(pdfResult.filename);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isShareSupported = canWebShareFiles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                ¡Tu documento PDF está listo!
              </h2>
              <p className="text-xs text-slate-500">
                {pdfResult.filename} ({Math.round(pdfResult.fileSizeBytes / 1024)} KB)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Cloud Export Options Cards */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Destinos de Exportación a la Nube
            </span>

            {/* Option 1: Google Drive */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Google Drive</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.2 rounded">
                      Nube Directa
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Descarga el documento y abre tu Google Drive para guardarlo inmediatamente en tu carpeta.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenGoogleDrive}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <span>Guardar en Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option 2: Native Cloud Share (Dropbox, iCloud, OneDrive, etc.) */}
            {isShareSupported && (
              <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">
                      Compartir a Nube Nativa (Apps del Sistema)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Envía directo a iCloud Drive, OneDrive, Dropbox, Correo o Mensajería desde el menú nativo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </button>
              </div>
            )}

            {/* Option 3: Direct Download */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Descargar archivo PDF
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guarda una copia directa en tu almacenamiento local o dispositivo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          {/* Quick extra actions: Print & Copy name */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handlePrint}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir directamente</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFileName}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Nombre copiado!' : 'Copiar nombre de archivo'}</span>
            </button>
          </div>

          {/* Local Cloud Storage History */}
          {historyList.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Historial Reciente en la Nube Local</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {historyList.length} guardados en navegador
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-md">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-slate-800 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.date} · {item.pageCount} págs · {item.imageCount} fotos
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.dataUrl && (
                        <a
                          href={item.dataUrl}
                          download={item.filename}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                          title="Descargar este PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Eliminar de historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
