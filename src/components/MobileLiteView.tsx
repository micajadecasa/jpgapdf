import React, { useRef, useState } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  Share2,
  Eye,
  Monitor,
  Sparkles,
  FileText,
  SlidersHorizontal,
  Check,
  Zap,
} from 'lucide-react';
import { UploadedImage, PdfConfig, GeneratedPdfResult } from '../types';
import { formatBytes } from '../utils/imageProcessor';
import { createSampleImages } from '../utils/sampleImages';
import { canWebShareFiles } from '../utils/cloudExport';

interface MobileLiteViewProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onImagesAdded: (images: UploadedImage[]) => void;
  config: PdfConfig;
  onConfigChange: (config: PdfConfig) => void;
  onSwitchToFullMode: () => void;
  onOpenPreview: () => void;
  onDirectDownload: () => void;
  onNativeShare: () => void;
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  onOpenInstallPrompt?: () => void;
}

export const MobileLiteView: React.FC<MobileLiteViewProps> = ({
  images,
  onImagesChange,
  onImagesAdded,
  config,
  onConfigChange,
  onSwitchToFullMode,
  onOpenPreview,
  onDirectDownload,
  onNativeShare,
  isGenerating,
  generationProgress,
  generationStatus,
  onOpenInstallPrompt,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingCount, setProcessingCount] = useState<number>(0);
  const isShareSupported = canWebShareFiles();

  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);
    setProcessingCount(files.length);

    try {
      const tasks = files.map(async (file, idx) => {
        // Validate image by MIME type or file extension (essential on mobile where MIME can be empty/octet-stream)
        const isImg =
          file.type?.startsWith('image/') ||
          /\.(jpe?g|png|webp|gif|svg|bmp|avif|heic|heif)$/i.test(file.name);

        if (!isImg && file.type) return null;

        try {
          const dataUrl = await readFileAsDataUrl(file);
          const dimensions = await getImageDimensions(dataUrl);

          const imgObj: UploadedImage = {
            id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name || `Foto_${images.length + idx + 1}.jpg`,
            type: file.type || 'image/jpeg',
            size: file.size,
            originalUrl: dataUrl,
            previewUrl: dataUrl,
            width: dimensions.width,
            height: dimensions.height,
            rotation: 0,
            flipH: false,
            flipV: false,
            fit: 'contain',
            filter: 'none',
            brightness: 0,
            contrast: 0,
            saturation: 100,
            title: file.name
              ? file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
              : `Foto ${images.length + idx + 1}`,
            caption: '',
          };
          return imgObj;
        } catch (err) {
          console.error('Error procesando imagen individual:', file.name, err);
          return null;
        }
      });

      const results = await Promise.all(tasks);
      const validImages = results.filter((img): img is UploadedImage => img !== null);

      if (validImages.length > 0) {
        onImagesAdded(validImages);
      }
    } finally {
      setIsProcessingFiles(false);
      setProcessingCount(0);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.files && target.files.length > 0) {
      const filesArray = Array.from(target.files);
      target.value = '';
      processFiles(filesArray);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.files && target.files.length > 0) {
      // Create detached array of File items before resetting input value
      const filesArray = Array.from(target.files);
      target.value = '';
      processFiles(filesArray);
    }
  };

  const handleRotate = (index: number) => {
    const updated = [...images];
    const curr = updated[index];
    const nextRot = ((curr.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updated[index] = { ...curr, rotation: nextRot };
    onImagesChange(updated);
  };

  const handleToggleDocFilter = (index: number) => {
    const updated = [...images];
    const curr = updated[index];
    // Toggle between standard and document scan filter
    const newFilter = curr.filter === 'scan' ? 'none' : 'scan';
    updated[index] = { ...curr, filter: newFilter };
    onImagesChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onImagesChange(updated);
  };

  const handleDelete = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleLoadSamples = () => {
    const samples = createSampleImages();
    onImagesAdded(samples);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-32">
      {/* Hidden file inputs for Camera and Multi-Image Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,image/bmp,image/*"
        multiple
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">FolioPDF Lite</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Móvil
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Versión rápida para smartphones</p>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenInstallPrompt && (
              <button
                type="button"
                onClick={onOpenInstallPrompt}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 active:scale-95 cursor-pointer"
                title="Instalar app en tu pantalla de inicio"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instalar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSwitchToFullMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 active:scale-95 cursor-pointer"
              title="Cambiar a la versión completa con edición avanzada"
            >
              <Monitor className="w-3.5 h-3.5 text-slate-600" />
              <span>Versión Pro</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Notification when generating */}
      {isGenerating && (
        <div className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-[57px] z-20 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">{generationStatus || 'Creando tu PDF...'}</span>
          </div>
          <span className="font-mono tabular-nums">{generationProgress}%</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Primary Action Buttons: Camera & Multi-Image Gallery */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessingFiles || isGenerating}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm transition-all cursor-pointer min-h-[90px]"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm font-semibold">Hacer Foto</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessingFiles || isGenerating}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl shadow-sm transition-all cursor-pointer min-h-[90px]"
          >
            <ImageIcon className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold">De la Galería</span>
            <span className="text-[10px] text-slate-400 font-normal">Múltiples fotos</span>
          </button>
        </div>

        {isProcessingFiles && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-2 shadow-xs">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>
              {processingCount > 1
                ? `Cargando ${processingCount} fotos seleccionadas...`
                : 'Cargando foto seleccionada...'}
            </span>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && !isProcessingFiles && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Aún no hay fotos añadidas</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Toma fotos de recibos, apuntes, documentos o selecciona varias imágenes de tu galería para unirlas en un PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cargar fotos de ejemplo</span>
            </button>
          </div>
        )}

        {/* Images List (When photos are loaded) */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Páginas del documento ({images.length})
              </span>
              <button
                type="button"
                onClick={() => onImagesChange([])}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Borrar todas
              </button>
            </div>

            <div className="space-y-2">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-3"
                >
                  {/* Position number */}
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
                    <img
                      src={image.previewUrl}
                      alt={image.title}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${image.rotation}deg)`,
                      }}
                    />
                    {image.filter === 'scan' && (
                      <span className="absolute bottom-0.5 left-0.5 bg-blue-600 text-white text-[9px] px-1 rounded font-bold">
                        B/N
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{image.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(image.size)} · {image.rotation !== 0 ? `${image.rotation}°` : 'Normal'}
                    </p>
                  </div>

                  {/* Actions for this image */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Rotate button */}
                    <button
                      type="button"
                      onClick={() => handleRotate(index)}
                      className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      title="Girar 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Document filter toggle (scan) */}
                    <button
                      type="button"
                      onClick={() => handleToggleDocFilter(index)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                        image.filter === 'scan'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={image.filter === 'scan' ? 'Quitar filtro escáner' : 'Aplicar filtro escáner B/N'}
                    >
                      B/N
                    </button>

                    {/* Move up / down */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="w-7 h-4.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === images.length - 1}
                        className="w-7 h-4.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simplified Options Card */}
        {images.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ajustes Rápidos del PDF
              </h4>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre del archivo
              </label>
              <input
                type="text"
                value={config.documentTitle}
                onChange={(e) => onConfigChange({ ...config, documentTitle: e.target.value })}
                placeholder="Mi_Documento"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Layout (1 or 2 per page) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Fotos por página
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, layout: '1_per_page' })}
                  className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    config.layout === '1_per_page'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1 por página</span>
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, layout: '2_per_page' })}
                  className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    config.layout === '2_per_page'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>2 por página</span>
                </button>
              </div>
            </div>

            {/* Page Orientation */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Orientación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, orientation: 'portrait' })}
                  className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                    config.orientation === 'portrait'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Vertical
                </button>
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, orientation: 'landscape' })}
                  className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                    config.orientation === 'landscape'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Horizontal
                </button>
              </div>
            </div>

            {/* Quick toggles (All disabled/unchecked by default as requested) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1.5 select-none hover:bg-slate-50 px-1 rounded-md transition-colors">
                <div>
                  <span className="font-medium text-slate-800">Numerar las páginas</span>
                  <p className="text-[11px] text-slate-400">Añade indicador de página en el pie</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showPageNumbers}
                  onChange={(e) => onConfigChange({ ...config, showPageNumbers: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1.5 select-none hover:bg-slate-50 px-1 rounded-md transition-colors">
                <div>
                  <span className="font-medium text-slate-800">Modo optimizado (Archivo ligero para WhatsApp)</span>
                  <p className="text-[11px] text-slate-400">Reduce el peso del archivo para enviar al instante</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.imageQuality <= 0.75}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      imageQuality: e.target.checked ? 0.72 : 0.9,
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1.5 select-none hover:bg-slate-50 px-1 rounded-md transition-colors">
                <div>
                  <span className="font-medium text-slate-800">Añadir portada de inicio</span>
                  <p className="text-[11px] text-slate-400">Inserta primera página con título del documento</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeCover}
                  onChange={(e) => onConfigChange({ ...config, includeCover: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Link to Full Pro Mode */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchToFullMode}
            className="text-xs text-slate-500 hover:text-blue-600 underline cursor-pointer"
          >
            ¿Necesitas filtros avanzados o márgenes exactos? Abre la versión Pro completa
          </button>
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile Actions */}
      {images.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-40 shadow-lg">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            {/* Preview Button */}
            <button
              type="button"
              onClick={onOpenPreview}
              disabled={isGenerating}
              className="p-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Previsualizar PDF"
            >
              <Eye className="w-5 h-5" />
            </button>

            {/* Share Button (Native mobile share e.g. WhatsApp, Mail, Telegram) */}
            <button
              type="button"
              onClick={onNativeShare}
              disabled={isGenerating}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={onDirectDownload}
              disabled={isGenerating}
              className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = url;
  });
}
