import React from 'react';
import { Eye, Cloud, FileText, Smartphone, Download, Image as ImageIcon, RefreshCw, Layers } from 'lucide-react';
import { ToolMode } from '../types';

interface TopBarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  imagesCount: number;
  isGenerating: boolean;
  onScrollToSection: (id: string) => void;
  onSwitchToLiteMode: () => void;
  onOpenInstallPrompt?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  toolMode,
  onSetToolMode,
  onOpenPreview,
  onOpenExport,
  imagesCount,
  isGenerating,
  onScrollToSection,
  onSwitchToLiteMode,
  onOpenInstallPrompt,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Device / Install buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer"
          >
            FolioPDF Studio
          </a>

          <button
            type="button"
            onClick={onSwitchToLiteMode}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 cursor-pointer"
            title="Cambiar a la versión ligera adaptada para móviles"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Versión Móvil Lite</span>
          </button>

          {onOpenInstallPrompt && (
            <button
              type="button"
              onClick={onOpenInstallPrompt}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200 cursor-pointer"
              title="Instalar en el móvil o escritorio"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instalar App</span>
            </button>
          )}
        </div>

        {/* Zone 2: Tool Mode Switcher (Imágenes a PDF vs PDF a JPG) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onSetToolMode('images_to_pdf')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              toolMode === 'images_to_pdf'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Fotos a PDF</span>
          </button>

          <button
            type="button"
            onClick={() => onSetToolMode('pdf_to_jpg')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              toolMode === 'pdf_to_jpg'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>PDF a JPG</span>
          </button>

          <button
            type="button"
            onClick={() => onSetToolMode('merge_pdf')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              toolMode === 'merge_pdf'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Unir PDFs</span>
          </button>
        </div>

        {/* Zone 3: Actions (Context-sensitive) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {toolMode === 'images_to_pdf' ? (
            <>
              <button
                type="button"
                disabled={imagesCount === 0 || isGenerating}
                onClick={onOpenPreview}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  imagesCount > 0 && !isGenerating
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vista Previa</span>
              </button>

              <button
                type="button"
                disabled={imagesCount === 0 || isGenerating}
                onClick={onOpenExport}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs ${
                  imagesCount > 0 && !isGenerating
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Exportar PDF</span>
              </button>
            </>
          ) : toolMode === 'merge_pdf' ? (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hidden sm:inline">
              Unir varios PDFs en uno
            </span>
          ) : (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 hidden sm:inline">
              Extraer páginas a JPG
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
