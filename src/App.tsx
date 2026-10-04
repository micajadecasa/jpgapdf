import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sliders,
  Eye,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UploadedImage, PdfConfig, GeneratedPdfResult } from './types';
import { UploadZone } from './components/UploadZone';
import { ImageGrid } from './components/ImageGrid';
import { PdfSettingsPanel } from './components/PdfSettingsPanel';
import { ImageEditorModal } from './components/ImageEditorModal';
import { LivePdfPreviewModal } from './components/LivePdfPreviewModal';
import { CloudExportModal } from './components/CloudExportModal';
import { TopBar } from './components/TopBar';
import { generatePdf } from './utils/pdfGenerator';
import { downloadPdf } from './utils/cloudExport';

export default function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null);

  // Configuration state
  const [config, setConfig] = useState<PdfConfig>({
    documentTitle: 'Dossier de Imágenes',
    pageSize: 'a4',
    orientation: 'portrait',
    layout: '1_per_page',
    margin: 'standard',
    imageQuality: 0.9,
    includeCover: true,
    coverTitle: 'Dossier de Imágenes',
    coverSubtitle: 'Documento fotográfico organizado y preparado para archivo y revisión',
    coverAuthor: 'Estudio Profesional',
    coverDate: new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    coverTheme: 'minimal',
    showPageNumbers: true,
    showHeaders: true,
    headerText: 'Dossier de Imágenes',
    showImageTitles: true,
    showImageCaptions: true,
    backgroundColor: 'white',
  });

  // PDF Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  // Sync header text with document title if user changes it
  useEffect(() => {
    if (config.documentTitle && !config.headerText) {
      setConfig((prev) => ({ ...prev, headerText: config.documentTitle }));
    }
  }, [config.documentTitle]);

  const handleImagesAdded = (newImages: UploadedImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setPdfResult(null); // Invalidate cached PDF
  };

  const handleSaveEditedImage = (updated: UploadedImage) => {
    setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
    setPdfResult(null);
  };

  const handleApplyToAllImages = (settings: Partial<UploadedImage>) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        ...settings,
      }))
    );
    setPdfResult(null);
  };

  const handleGeneratePdf = async (afterAction?: 'preview' | 'export' | 'download') => {
    if (images.length === 0) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationProgress(5);
    setGenerationStatus('Iniciando procesamiento...');

    try {
      const result = await generatePdf(images, config, (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      });

      setPdfResult(result);

      if (afterAction === 'preview') {
        setIsPreviewOpen(true);
      } else if (afterAction === 'export') {
        setIsCloudModalOpen(true);
      } else if (afterAction === 'download') {
        downloadPdf(result);
      }
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al maquetar el PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPreview = async () => {
    if (pdfResult) {
      setIsPreviewOpen(true);
    } else {
      await handleGeneratePdf('preview');
    }
  };

  const handleOpenCloudExport = async () => {
    if (pdfResult) {
      setIsCloudModalOpen(true);
    } else {
      await handleGeneratePdf('export');
    }
  };

  const handleDirectDownload = async () => {
    if (pdfResult) {
      downloadPdf(pdfResult);
    } else {
      await handleGeneratePdf('download');
    }
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar with 3-Zone Contract */}
      <TopBar
        onOpenPreview={handleOpenPreview}
        onOpenExport={handleOpenCloudExport}
        imagesCount={images.length}
        isGenerating={isGenerating}
        onScrollToSection={handleScrollTo}
      />

      {/* Progress / Loading Banner */}
      {isGenerating && (
        <div className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-[57px] z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">{generationStatus}</span>
          </div>
          <span className="font-mono tabular-nums">{generationProgress}%</span>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {images.length === 0 ? (
          /* Empty / Onboarding State */
          <div className="max-w-3xl mx-auto space-y-8 pt-4 pb-12">
            {/* Header intro */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Convierte tus imágenes en documentos PDF profesionales
              </h1>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Carga fotografías, planos o comprobantes escaneados. Elige tu maquetación, añade
                portada editorial y exporta directamente a la nube o a tu dispositivo.
              </p>
            </div>

            {/* Upload Zone */}
            <UploadZone onImagesAdded={handleImagesAdded} />

            {/* Feature highlights grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Maquetación Automática
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  1, 2, 3, 4 o 6 fotos por hoja en formatos A4, Carta u Oficio, con márgenes uniformes y numeración de páginas.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Sliders className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Edición Visual y Filtros
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Rotación 90°, ajuste al marco, brillo, contraste y filtro escáner de alta legibilidad para recibos y textos.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Cloud className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Exportación a la Nube
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sincronización con Google Drive, envío a través de apps en la nube del sistema y almacenamiento en historial local.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Populated Workspace: Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Management & Gallery (7 cols) */}
            <div id="galeria" className="lg:col-span-7 space-y-6">
              <ImageGrid
                images={images}
                onImagesChange={(updated) => {
                  setImages(updated);
                  setPdfResult(null);
                }}
                onEditImage={(img) => setEditingImage(img)}
                onAddMoreImages={handleImagesAdded}
              />
            </div>

            {/* Right Column: PDF Settings & Actions (5 cols, sticky) */}
            <div id="maquetacion" className="lg:col-span-5 sticky top-20 space-y-4">
              <div id="portada">
                <PdfSettingsPanel
                  config={config}
                  onChange={(newConfig) => {
                    setConfig(newConfig);
                    setPdfResult(null);
                  }}
                  onOpenPreview={handleOpenPreview}
                  onOpenCloudExport={handleOpenCloudExport}
                  onDirectDownload={handleDirectDownload}
                  imagesCount={images.length}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FolioPDF Studio · Creador y Maquetador de PDF con Exportación a la Nube</span>
          <div className="flex items-center gap-3">
            <span>Privacidad local en navegador</span>
            <span>·</span>
            <span>Soporta JPG, PNG, WEBP, GIF, SVG, BMP</span>
          </div>
        </div>
      </footer>

      {/* Image Editor Modal */}
      <ImageEditorModal
        image={editingImage}
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        onSave={handleSaveEditedImage}
        onApplyToAll={handleApplyToAllImages}
        totalImagesCount={images.length}
      />

      {/* Live PDF Preview Modal */}
      <LivePdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfResult={pdfResult}
        config={config}
        onDownload={handleDirectDownload}
        onCloudExport={() => {
          setIsPreviewOpen(false);
          setIsCloudModalOpen(true);
        }}
      />

      {/* Cloud Export Modal */}
      <CloudExportModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        pdfResult={pdfResult}
        imagesCount={images.length}
      />
    </div>
  );
}
