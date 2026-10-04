import React, { useState } from 'react';
import {
  Layout,
  BookOpen,
  Sliders,
  Cloud,
  FileText,
  Eye,
  Download,
  Share2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { PdfConfig, PageFormat, PageOrientation, GridLayout, MarginOption, CoverTheme, PageBackground } from '../types';

interface PdfSettingsPanelProps {
  config: PdfConfig;
  onChange: (updated: PdfConfig) => void;
  onOpenPreview: () => void;
  onOpenCloudExport: () => void;
  onDirectDownload: () => void;
  imagesCount: number;
  isGenerating: boolean;
}

export const PdfSettingsPanel: React.FC<PdfSettingsPanelProps> = ({
  config,
  onChange,
  onOpenPreview,
  onOpenCloudExport,
  onDirectDownload,
  imagesCount,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'cover' | 'style' | 'export'>('layout');

  const update = (partial: Partial<PdfConfig>) => {
    onChange({ ...config, ...partial });
  };

  const layoutOptions: { id: GridLayout; title: string; desc: string; icon: string }[] = [
    { id: '1_per_page', title: '1 foto / página', desc: 'Impacto visual completo', icon: '◻' },
    { id: '2_per_page', title: '2 fotos / página', desc: 'Doble comparativa', icon: '◫' },
    { id: '3_per_page', title: '3 fotos / página', desc: 'Tríptico destacado', icon: '⬚' },
    { id: '4_per_page', title: '4 fotos (2×2)', desc: 'Catálogo ordenado', icon: '⊞' },
    { id: '6_per_page', title: '6 fotos (Hoja)', desc: 'Hoja de contactos', icon: '⠿' },
  ];

  const pageSizeOptions: { id: PageFormat; label: string; desc: string }[] = [
    { id: 'a4', label: 'A4', desc: '210 × 297 mm' },
    { id: 'letter', label: 'Carta (US Letter)', desc: '216 × 279 mm' },
    { id: 'legal', label: 'Oficio (Legal)', desc: '216 × 356 mm' },
    { id: 'square', label: 'Cuadrado', desc: '210 × 210 mm' },
  ];

  const marginOptions: { id: MarginOption; label: string; desc: string }[] = [
    { id: 'none', label: 'Sin margen', desc: '0 mm (A sangre)' },
    { id: 'narrow', label: 'Estrecho', desc: '8 mm' },
    { id: 'standard', label: 'Estándar', desc: '14 mm (Recomendado)' },
    { id: 'wide', label: 'Amplio', desc: '22 mm (Editorial)' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Primary Actions Top Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Generación del Documento
          </span>
          <span className="text-xs text-slate-500">
            {imagesCount} {imagesCount === 1 ? 'imagen' : 'imágenes'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={imagesCount === 0 || isGenerating}
            onClick={onOpenPreview}
            className={`px-3 py-2.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              imagesCount > 0 && !isGenerating
                ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Vista Previa PDF</span>
          </button>

          <button
            type="button"
            disabled={imagesCount === 0 || isGenerating}
            onClick={onOpenCloudExport}
            className={`px-3 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              imagesCount > 0 && !isGenerating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-300 text-white cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Exportar a Nube</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-2 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'layout'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Maquetación</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cover')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'cover'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Portada</span>
          {config.includeCover && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'style'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Estilo & Texto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'export'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Nube y Enlaces</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 overflow-y-auto flex-1 space-y-5">
        {/* TAB 1: MAQUETACIÓN */}
        {activeTab === 'layout' && (
          <div className="space-y-5">
            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre del Documento
              </label>
              <input
                type="text"
                value={config.documentTitle}
                onChange={(e) => update({ documentTitle: e.target.value })}
                placeholder="Dossier de Imágenes"
                className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Layout Grid Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Distribución por Página
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {layoutOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update({ layout: opt.id })}
                    className={`p-2.5 text-left border rounded-lg transition-all cursor-pointer flex items-start gap-2.5 ${
                      config.layout === opt.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5 text-blue-600 font-mono">{opt.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{opt.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size & Orientation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tamaño de Hoja
                </label>
                <select
                  value={config.pageSize}
                  onChange={(e) => update({ pageSize: e.target.value as PageFormat })}
                  className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white cursor-pointer"
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Orientación
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => update({ orientation: 'portrait' })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border text-center cursor-pointer transition-colors ${
                      config.orientation === 'portrait'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Vertical
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ orientation: 'landscape' })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border text-center cursor-pointer transition-colors ${
                      config.orientation === 'landscape'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ orientation: 'auto' })}
                    title="Adapta automáticamente según la mayoría de fotos"
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border text-center cursor-pointer transition-colors ${
                      config.orientation === 'auto'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Márgenes de Página
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {marginOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update({ margin: m.id })}
                    className={`p-2 border rounded-lg text-left text-xs cursor-pointer transition-colors ${
                      config.margin === m.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{m.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PORTADA */}
        {activeTab === 'cover' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  Página de Portada
                </span>
                <span className="text-xs text-slate-500">
                  Añade una primera página formal con estilo ejecutivo
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.includeCover}
                onChange={(e) => update({ includeCover: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {config.includeCover ? (
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título de Portada
                  </label>
                  <input
                    type="text"
                    value={config.coverTitle}
                    onChange={(e) => update({ coverTitle: e.target.value })}
                    placeholder="Ej: Informe Fotográfico de Avance de Obra"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtítulo descriptivo
                  </label>
                  <input
                    type="text"
                    value={config.coverSubtitle}
                    onChange={(e) => update({ coverSubtitle: e.target.value })}
                    placeholder="Ej: Registro visual correspondiente a la Fase II"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Autor o Empresa
                    </label>
                    <input
                      type="text"
                      value={config.coverAuthor}
                      onChange={(e) => update({ coverAuthor: e.target.value })}
                      placeholder="Ej: Estudio de Arquitectura"
                      className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="text"
                      value={config.coverDate}
                      onChange={(e) => update({ coverDate: e.target.value })}
                      placeholder={new Date().toLocaleDateString('es-ES')}
                      className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estilo de Portada
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'minimal' as CoverTheme, name: 'Minimalista', desc: 'Blanco y sobrio' },
                      { id: 'executive' as CoverTheme, name: 'Ejecutivo', desc: 'Franja azul marino' },
                      { id: 'modern_dark' as CoverTheme, name: 'Moderno Oscuro', desc: 'Fondo grafito elegante' },
                      { id: 'editorial' as CoverTheme, name: 'Editorial Clásico', desc: 'Marco fino serif' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => update({ coverTheme: theme.id })}
                        className={`p-2 border rounded-lg text-left text-xs cursor-pointer transition-colors ${
                          config.coverTheme === theme.id
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>{theme.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{theme.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                La portada está desactivada. El PDF comenzará directamente con las imágenes.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ESTILO & TEXTO */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Background Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Color de fondo de página
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'white' as PageBackground, name: 'Blanco Puro', bg: 'bg-white border-slate-300' },
                  { id: 'warm_white' as PageBackground, name: 'Marfil / Crema', bg: 'bg-[#FAF9F5] border-amber-200' },
                  { id: 'light_gray' as PageBackground, name: 'Gris Tenue', bg: 'bg-slate-100 border-slate-300' },
                  { id: 'dark' as PageBackground, name: 'Oscuro Noche', bg: 'bg-slate-900 text-white border-slate-800' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => update({ backgroundColor: b.id })}
                    className={`p-2 border rounded-lg text-left text-xs cursor-pointer transition-colors ${
                      config.backgroundColor === b.id
                        ? 'border-blue-600 ring-1 ring-blue-600 font-semibold'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-full border ${b.bg}`} />
                      <span className="truncate">{b.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes for page elements */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Elementos en cada página
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showPageNumbers}
                  onChange={(e) => update({ showPageNumbers: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Mostrar pie de página con número de hoja ("Página X de Y")</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showHeaders}
                  onChange={(e) => update({ showHeaders: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Mostrar encabezado superior con título del documento</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showImageTitles}
                  onChange={(e) => update({ showImageTitles: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Mostrar títulos de cada fotografía o imagen</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showImageCaptions}
                  onChange={(e) => update({ showImageCaptions: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Mostrar notas y leyendas descriptivas debajo de cada foto</span>
              </label>
            </div>

            {/* Quality Compression */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Calidad de compresión fotográfica
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 0.75, label: 'Ligera / Web', sub: 'Archivo pequeño' },
                  { val: 0.9, label: 'Alta (Óptima)', sub: 'Equilibrio ideal' },
                  { val: 1.0, label: 'Máxima', sub: 'Para imprenta' },
                ].map((q) => (
                  <button
                    key={q.val}
                    type="button"
                    onClick={() => update({ imageQuality: q.val })}
                    className={`p-2 border rounded-lg text-left text-xs cursor-pointer transition-colors ${
                      config.imageQuality === q.val
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{q.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{q.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPORTACIÓN A NUBE */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Opciones de Exportación a la Nube</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Guarda tu documento directamente en Google Drive, compártelo mediante apps nativas
                (Dropbox, OneDrive, iCloud) o descárgalo al instante.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={imagesCount === 0 || isGenerating}
                onClick={onOpenCloudExport}
                className="w-full p-3 bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50/40 rounded-lg text-left text-xs font-medium text-slate-800 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Guardar en Google Drive / Nube</div>
                    <div className="text-[11px] text-slate-500">Sincronización directa o enlace cloud</div>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-semibold">Abrir →</span>
              </button>

              <button
                type="button"
                disabled={imagesCount === 0 || isGenerating}
                onClick={onDirectDownload}
                className="w-full p-3 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-left text-xs font-medium text-slate-800 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Descarga Directa de PDF</div>
                    <div className="text-[11px] text-slate-500">Archivo .pdf listo en tu equipo</div>
                  </div>
                </div>
                <span className="text-xs text-slate-600">Descargar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
