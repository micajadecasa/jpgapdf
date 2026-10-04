import React from 'react';
import { Eye, Cloud, FileText, Smartphone, Download } from 'lucide-react';

interface TopBarProps {
  onOpenPreview: () => void;
  onOpenExport: () => void;
  imagesCount: number;
  isGenerating: boolean;
  onScrollToSection: (id: string) => void;
  onSwitchToLiteMode: () => void;
  onOpenInstallPrompt?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenPreview,
  onOpenExport,
  imagesCount,
  isGenerating,
  onScrollToSection,
  onSwitchToLiteMode,
  onOpenInstallPrompt,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
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
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200 cursor-pointer"
              title="Instalar en el móvil o escritorio"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instalar App</span>
            </button>
          )}
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onScrollToSection('galeria')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Imágenes
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('maquetacion')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Maquetación
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('portada')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Portada
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('nube')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Nube & Compartir
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
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
            <span>Vista Previa</span>
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
        </div>
      </div>
    </header>
  );
};
