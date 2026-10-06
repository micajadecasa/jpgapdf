import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';
import { UploadedImage } from '../types';
import { createSampleImages } from '../utils/sampleImages';

interface UploadZoneProps {
  onImagesAdded: (images: UploadedImage[]) => void;
  compact?: boolean;
  onSwitchToPdfToJpg?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImagesAdded,
  compact = false,
  onSwitchToPdfToJpg,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Support paste from clipboard (e.g. screenshot or copied image)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsProcessing(true);

    const tasks = fileArray.map(async (file, idx) => {
      const isImg = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|avif|heic|heif)$/i.test(file.name);
      if (!isImg && file.type) return null;

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const dimensions = await getImageDimensions(dataUrl);

        const imgObj: UploadedImage = {
          id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
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
          title: cleanImageTitle(file.name),
          caption: '',
        };
        return imgObj;
      } catch (err) {
        console.error('Error procesando archivo:', file.name, err);
        return null;
      }
    });

    const results = await Promise.all(tasks);
    const validImages = results.filter((img): img is UploadedImage => img !== null);

    if (validImages.length > 0) {
      onImagesAdded(validImages);
    }
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.files && target.files.length > 0) {
      const filesArray = Array.from(target.files);
      target.value = '';
      processFiles(filesArray);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadSamples = () => {
    const samples = createSampleImages();
    onImagesAdded(samples);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp,image/avif"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-500" />
          <span>Añadir más fotos</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
        isDragging
          ? 'border-blue-600 bg-blue-50/50 scale-[1.005]'
          : 'border-slate-300 hover:border-slate-400 bg-white'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp,image/avif"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-4 shadow-sm">
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7 text-blue-600" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {isProcessing ? 'Cargando y optimizando imágenes...' : 'Arrastra y suelta tus imágenes aquí'}
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Soporta PNG, JPG, WEBP, GIF, SVG, BMP o pega una captura con Ctrl+V
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Seleccionar imágenes</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSamples}
            disabled={isProcessing}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Probar con ejemplos</span>
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Sin límite de imágenes</span>
            <span>·</span>
            <span>Procesamiento 100% privado en tu navegador</span>
          </div>

          {onSwitchToPdfToJpg && (
            <button
              type="button"
              onClick={onSwitchToPdfToJpg}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer flex items-center gap-1"
            >
              <span>¿Necesitas la inversa? Subir un PDF y convertir cada hoja a JPG</span>
            </button>
          )}
        </div>
      </div>
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

function cleanImageTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
