import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Sliders,
  Maximize2,
  Minimize2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { UploadedImage, FilterPreset, ImageFit } from '../types';
import { processImageCanvas } from '../utils/imageProcessor';

interface ImageEditorModalProps {
  image: UploadedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UploadedImage) => void;
  onApplyToAll?: (settings: Partial<UploadedImage>) => void;
  totalImagesCount: number;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  image,
  isOpen,
  onClose,
  onSave,
  onApplyToAll,
  totalImagesCount,
}) => {
  if (!isOpen || !image) return null;

  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(image.rotation);
  const [flipH, setFlipH] = useState<boolean>(image.flipH);
  const [flipV, setFlipV] = useState<boolean>(image.flipV);
  const [fit, setFit] = useState<ImageFit>(image.fit);
  const [filter, setFilter] = useState<FilterPreset>(image.filter);
  const [brightness, setBrightness] = useState<number>(image.brightness);
  const [contrast, setContrast] = useState<number>(image.contrast);
  const [saturation, setSaturation] = useState<number>(image.saturation);
  const [title, setTitle] = useState<string>(image.title);
  const [caption, setCaption] = useState<string>(image.caption);

  const [previewSrc, setPreviewSrc] = useState<string>(image.originalUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Debounced live canvas render on adjustment change
  useEffect(() => {
    let active = true;
    const tempImg: UploadedImage = {
      ...image,
      rotation,
      flipH,
      flipV,
      fit,
      filter,
      brightness,
      contrast,
      saturation,
      title,
      caption,
    };

    setIsProcessing(true);
    const timeout = setTimeout(async () => {
      try {
        const processed = await processImageCanvas(tempImg, 0.9);
        if (active) {
          setPreviewSrc(processed);
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Error rendering preview canvas:', err);
        if (active) setIsProcessing(false);
      }
    }, 60);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [image, rotation, flipH, flipV, fit, filter, brightness, contrast, saturation]);

  const handleRotateRight = () => {
    setRotation(((rotation + 90) % 360) as 0 | 90 | 180 | 270);
  };

  const handleRotateLeft = () => {
    setRotation(((rotation + 270) % 360) as 0 | 90 | 180 | 270);
  };

  const handleResetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(100);
    setFilter('none');
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
  };

  const handleSave = () => {
    onSave({
      ...image,
      rotation,
      flipH,
      flipV,
      fit,
      filter,
      brightness,
      contrast,
      saturation,
      title,
      caption,
      previewUrl: previewSrc,
    });
    onClose();
  };

  const handleApplyAll = () => {
    if (onApplyToAll) {
      onApplyToAll({
        rotation,
        flipH,
        flipV,
        fit,
        filter,
        brightness,
        contrast,
        saturation,
      });
    }
    handleSave();
  };

  const filterPresets: { id: FilterPreset; label: string; desc: string }[] = [
    { id: 'none', label: 'Original', desc: 'Sin alteraciones de color' },
    { id: 'grayscale', label: 'B/N Clásico', desc: 'Blanco y negro profesional' },
    { id: 'scan', label: 'Escáner Doc', desc: 'Aclara fondo y resalta texto/tinta' },
    { id: 'contrast', label: 'Contraste Alto', desc: 'Mayor viveza y definición' },
    { id: 'warm', label: 'Cálido / Sepia', desc: 'Tonos dorados y nostálgicos' },
    { id: 'cool', label: 'Frío / Nieve', desc: 'Tonos azulados y limpios' },
    { id: 'invert', label: 'Invertido', desc: 'Negativo para diagramas técnicos' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Edición de Imagen · <span className="font-normal text-slate-500">{image.name}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dimensiones originales: {image.width} × {image.height} px
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Split Preview & Controls) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Canvas Preview */}
          <div className="md:col-span-7 bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-[260px] md:min-h-[420px]">
            {isProcessing && (
              <div className="absolute top-4 right-4 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow">
                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Aplicando...</span>
              </div>
            )}
            <div className="w-full h-full max-h-[400px] flex items-center justify-center overflow-hidden">
              <img
                src={previewSrc}
                alt="Vista previa editada"
                className="max-h-full max-w-full object-contain rounded shadow-lg transition-all duration-150"
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Rotación: {rotation}° · {flipH ? 'Volteo H' : ''} {flipV ? 'Volteo V' : ''}
              </span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-5 bg-white divide-y divide-slate-100">
            {/* Quick Transforms */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Rotación y Orientación
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  title="Rotar 90° a la izquierda"
                  className="p-2 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-slate-700 flex flex-col items-center gap-1 text-xs cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateRight}
                  title="Rotar 90° a la derecha"
                  className="p-2 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-slate-700 flex flex-col items-center gap-1 text-xs cursor-pointer transition-colors"
                >
                  <RotateCw className="w-4 h-4 text-slate-600" />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  title="Voltear horizontalmente"
                  className={`p-2 border rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer transition-colors ${
                    flipH ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Voltear H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  title="Voltear verticalmente"
                  className={`p-2 border rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer transition-colors ${
                    flipV ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Voltear V</span>
                </button>
              </div>
            </div>

            {/* Fit mode */}
            <div className="pt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Ajuste al marco del PDF
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFit('contain')}
                  className={`px-3 py-2 border rounded-lg text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                    fit === 'contain'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Encajar completo</span>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setFit('cover')}
                  className={`px-3 py-2 border rounded-lg text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                    fit === 'cover'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Rellenar / Cortar</span>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Preset Filters */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Filtros y Estilo
                </label>
                {filter !== 'none' && (
                  <button
                    onClick={() => setFilter('none')}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filterPresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFilter(p.id)}
                    className={`px-2.5 py-1.5 text-left rounded-md border text-xs cursor-pointer transition-all ${
                      filter === p.id
                        ? 'border-blue-600 bg-blue-600 text-white font-medium shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Adjustments (Sliders) */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Ajustes Finos
                </label>
                {(brightness !== 0 || contrast !== 0 || saturation !== 100) && (
                  <button
                    onClick={() => {
                      setBrightness(0);
                      setContrast(0);
                      setSaturation(100);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Valores por defecto
                  </button>
                )}
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Brillo</span>
                  <span className="font-mono tabular-nums">{brightness > 0 ? `+${brightness}` : brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Contraste</span>
                  <span className="font-mono tabular-nums">{contrast > 0 ? `+${contrast}` : contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Saturación</span>
                  <span className="font-mono tabular-nums">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Image Annotations (Title & Caption for PDF) */}
            <div className="pt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Texto en el Documento PDF
              </label>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Título de la imagen</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Fachada Principal"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Nota o Pie de foto (opcional)</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej: Registro fotográfico para inspección..."
                  className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetAdjustments}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Restablecer todo a original
          </button>

          <div className="flex items-center gap-2">
            {totalImagesCount > 1 && onApplyToAll && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Aplicar estilo a todas ({totalImagesCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Guardar cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
