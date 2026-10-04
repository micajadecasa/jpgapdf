import React from 'react';
import {
  X,
  Download,
  Cloud,
  FileText,
} from 'lucide-react';
import { GeneratedPdfResult, PdfConfig } from '../types';

interface LivePdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfResult: GeneratedPdfResult | null;
  config: PdfConfig;
  onDownload: () => void;
  onCloudExport: () => void;
}

export const LivePdfPreviewModal: React.FC<LivePdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfResult,
  config,
  onDownload,
  onCloudExport,
}) => {
  if (!isOpen || !pdfResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 truncate max-w-sm sm:max-w-md">
                {pdfResult.filename}
              </h2>
              <p className="text-xs text-slate-500">
                {pdfResult.pageCount} {pdfResult.pageCount === 1 ? 'página' : 'páginas'} · Formato{' '}
                {config.pageSize.toUpperCase()} ({config.orientation})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCloudExport}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Nube</span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-900 p-4 flex items-center justify-center overflow-hidden relative">
          <iframe
            src={`${pdfResult.dataUrl}#toolbar=0&navpanes=0`}
            title="Vista previa del documento PDF"
            className="w-full h-full rounded shadow-2xl bg-white border border-slate-700"
          />
        </div>

        {/* Bottom Status bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Maquetación: {config.layout.replace('_', ' ')}</span>
            <span>·</span>
            <span>Margen: {config.margin}</span>
            <span>·</span>
            <span>Portada: {config.includeCover ? 'Sí (' + config.coverTheme + ')' : 'No'}</span>
          </div>

          <span className="font-mono text-[11px]">
            {Math.round(pdfResult.fileSizeBytes / 1024)} KB
          </span>
        </div>
      </div>
    </div>
  );
};
