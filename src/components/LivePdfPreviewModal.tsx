import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Cloud,
  FileText,
  ExternalLink,
  Layers,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { GeneratedPdfResult, PdfConfig, UploadedImage } from '../types';

interface LivePdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfResult: GeneratedPdfResult | null;
  config: PdfConfig;
  images?: UploadedImage[];
  onDownload: () => void;
  onCloudExport: () => void;
}

export const LivePdfPreviewModal: React.FC<LivePdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfResult,
  config,
  images = [],
  onDownload,
  onCloudExport,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'pdf'>('pages');
  const [blobUrl, setBlobUrl] = useState<string>('');

  // Create clean Blob URL (replaces datauristring which browsers block in iframes)
  useEffect(() => {
    if (pdfResult?.blob) {
      const url = URL.createObjectURL(pdfResult.blob);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfResult]);

  // Calculate pages for visual preview
  const pagesData = useMemo(() => {
    if (!images || images.length === 0) return [];

    let itemsPerPage = 1;
    switch (config.layout) {
      case '2_per_page':
        itemsPerPage = 2;
        break;
      case '3_per_page':
        itemsPerPage = 3;
        break;
      case '4_per_page':
        itemsPerPage = 4;
        break;
      case '6_per_page':
        itemsPerPage = 6;
        break;
      case '1_per_page':
      default:
        itemsPerPage = 1;
        break;
    }

    const pages: UploadedImage[][] = [];
    for (let i = 0; i < images.length; i += itemsPerPage) {
      pages.push(images.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [images, config.layout]);

  if (!isOpen || !pdfResult) return null;

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const isLandscape = config.orientation === 'landscape';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div
        className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. Header (Mobile-optimized: Title + Close Button X guaranteed visible) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {pdfResult.filename}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {pdfResult.pageCount} {pdfResult.pageCount === 1 ? 'página' : 'páginas'} · Formato{' '}
                {config.pageSize.toUpperCase()} ({config.orientation}) ·{' '}
                {Math.round(pdfResult.fileSizeBytes / 1024)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Quick Actions */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Abrir PDF en nueva pestaña"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir pestaña</span>
            </button>

            {/* Close Button X: ALWAYS visible in top-right corner */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Mode Selector Bar (Tabs) */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pages'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Páginas maquetadas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Visor PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="md:hidden flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium py-1 px-2 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Pantalla completa</span>
          </button>
        </div>

        {/* 3. Main Viewer Body */}
        <div className="flex-1 bg-slate-900/90 overflow-y-auto p-3 sm:p-6">
          {activeTab === 'pages' ? (
            /* Visual Pages Representation (Never blocked by any mobile browser) */
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Optional Cover Page */}
              {config.includeCover && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
                    Portada del documento
                  </span>
                  <div
                    className={`bg-white rounded-lg shadow-xl border border-slate-700 p-6 sm:p-10 flex flex-col justify-between w-full transition-all ${
                      isLandscape ? 'aspect-4/3 max-w-xl' : 'aspect-3/4 max-w-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-1 bg-blue-600 rounded-full" />
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                        {config.coverTitle || config.documentTitle || 'Dossier de Imágenes'}
                      </h3>
                      {config.coverSubtitle && (
                        <p className="text-xs sm:text-sm text-slate-600">{config.coverSubtitle}</p>
                      )}
                    </div>

                    <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>{config.coverAuthor || 'Estudio Profesional'}</span>
                      <span>{config.coverDate || new Date().toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Pages */}
              {pagesData.map((pageImgs, pageIdx) => {
                const pageNumber = pageIdx + (config.includeCover ? 2 : 1);
                return (
                  <div key={pageIdx} className="flex flex-col items-center">
                    <span className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
                      Página {pageNumber} de {pdfResult.pageCount}
                    </span>

                    <div
                      className={`bg-white rounded-lg shadow-xl border border-slate-700 p-4 sm:p-6 flex flex-col justify-between w-full transition-all ${
                        isLandscape ? 'aspect-4/3 max-w-xl' : 'aspect-3/4 max-w-md'
                      }`}
                    >
                      {/* Optional Header */}
                      {config.showHeaders && (
                        <div className="pb-2 border-b border-slate-200 text-[11px] text-slate-500 font-medium truncate">
                          {config.headerText || config.documentTitle}
                        </div>
                      )}

                      {/* Image Layout Grid */}
                      <div
                        className={`flex-1 flex items-center justify-center p-2 gap-3 min-h-0 ${
                          config.layout === '1_per_page'
                            ? 'grid grid-cols-1'
                            : config.layout === '2_per_page'
                            ? 'grid grid-cols-1 sm:grid-cols-2'
                            : config.layout === '3_per_page'
                            ? 'grid grid-cols-1 sm:grid-cols-3'
                            : config.layout === '4_per_page'
                            ? 'grid grid-cols-2 grid-rows-2'
                            : 'grid grid-cols-2 sm:grid-cols-3'
                        }`}
                      >
                        {pageImgs.map((img) => (
                          <div
                            key={img.id}
                            className="w-full h-full flex flex-col items-center justify-center min-h-[140px] max-h-[380px] p-1 overflow-hidden"
                          >
                            <img
                              src={img.previewUrl}
                              alt={img.title}
                              className={`max-w-full max-h-full object-contain rounded shadow-xs ${
                                img.filter === 'scan' ? 'contrast-150 grayscale' : ''
                              }`}
                              style={{
                                transform: `rotate(${img.rotation}deg)`,
                              }}
                            />
                            {config.showImageTitles && (
                              <p className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                                {img.title}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Optional Footer */}
                      {config.showPageNumbers && (
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date().toLocaleDateString('es-ES')}</span>
                          <span>
                            Página {pageNumber} de {pdfResult.pageCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* PDF Blob Viewer with Mobile Fallback Card */
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {blobUrl ? (
                <>
                  <iframe
                    src={`${blobUrl}#toolbar=0&navpanes=0`}
                    title="Vista previa del documento PDF"
                    className="w-full h-full rounded-lg shadow-2xl bg-white border border-slate-700 hidden sm:block"
                  />

                  {/* Mobile message because mobile browsers block embedded PDF iframes */}
                  <div className="sm:hidden bg-white rounded-xl p-6 text-center max-w-sm mx-auto shadow-xl space-y-4 my-auto">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Visor nativo para smartphone
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Los navegadores móviles protegen la seguridad bloqueando visores de PDF
                        dentro de ventanas emergentes. Puedes ver las páginas en la pestaña "Páginas
                        maquetadas" o abrir el visor PDF nativo del teléfono:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir visor PDF en pantalla completa</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-white text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparando documento...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Dedicated Action Footer: NEVER CUT OFF */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Maquetación: {config.layout.replace('_', ' ')}</span>
            <span>·</span>
            <span>Margen: {config.margin}</span>
            <span>·</span>
            <span>Portada: {config.includeCover ? 'Sí' : 'No'}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCloudExport}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Compartir / Nube</span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
