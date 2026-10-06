import React from 'react';
import {
  RotateCw,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileCheck,
  Check,
  Contrast,
} from 'lucide-react';
import { UploadedImage } from '../types';
import { formatBytes } from '../utils/imageProcessor';
import { UploadZone } from './UploadZone';

interface ImageGridProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onEditImage: (image: UploadedImage) => void;
  onAddMoreImages: (newImages: UploadedImage[]) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onImagesChange,
  onEditImage,
  onAddMoreImages,
}) => {
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onImagesChange(updated);
  };

  const handleQuickRotate = (index: number) => {
    const updated = [...images];
    const current = updated[index];
    const newRot = ((current.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updated[index] = { ...current, rotation: newRot };
    onImagesChange(updated);
  };

  const handleDelete = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const handleUpdateTitle = (index: number, title: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], title };
    onImagesChange(updated);
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption };
    onImagesChange(updated);
  };

  // Bulk actions
  const handleRotateAll = () => {
    const updated = images.map((img) => ({
      ...img,
      rotation: (((img.rotation + 90) % 360) as 0 | 90 | 180 | 270),
    }));
    onImagesChange(updated);
  };

  const handleScanFilterAll = () => {
    const updated = images.map((img) => ({
      ...img,
      filter: 'scan' as const,
    }));
    onImagesChange(updated);
  };

  const handleGrayscaleAll = () => {
    const isAllGrayscale = images.every((img) => img.filter === 'grayscale');
    const updated = images.map((img) => ({
      ...img,
      filter: (isAllGrayscale ? 'none' : 'grayscale') as const,
    }));
    onImagesChange(updated);
  };

  const handleSortByName = () => {
    const updated = [...images].sort((a, b) => a.name.localeCompare(b.name));
    onImagesChange(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('¿Deseas quitar todas las imágenes cargadas?')) {
      onImagesChange([]);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Top Bar with count & bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {images.length} {images.length === 1 ? 'imagen cargada' : 'imágenes cargadas'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">
            Total:{' '}
            {formatBytes(
              images.reduce((acc, curr) => acc + curr.size, 0)
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UploadZone onImagesAdded={onAddMoreImages} compact />

          <button
            type="button"
            onClick={handleRotateAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Girar todas 90 grados a la derecha"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotar todas</span>
          </button>

          <button
            type="button"
            onClick={handleScanFilterAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Aplica filtro de alto contraste tipo escáner a todas"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Mejorar escáner</span>
          </button>

          <button
            type="button"
            onClick={handleGrayscaleAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Pasa todas las fotos a Blanco y Negro / Escala de grises"
          >
            <Contrast className="w-3.5 h-3.5" />
            <span>Blanco y Negro</span>
          </button>

          <button
            type="button"
            onClick={handleSortByName}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Ordenar alfabéticamente por nombre de archivo"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar A-Z</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Grid of Image Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, index) => {
          const isFirst = index === 0;
          const isLast = index === images.length - 1;

          return (
            <div
              key={img.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-4/3 bg-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src={img.previewUrl || img.originalUrl}
                  alt={img.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                  style={{
                    transform: `rotate(${img.rotation}deg) scaleX(${img.flipH ? -1 : 1}) scaleY(${img.flipV ? -1 : 1})`,
                    filter:
                      img.filter === 'grayscale'
                        ? 'grayscale(100%)'
                        : img.filter === 'scan'
                        ? 'contrast(160%) brightness(110%)'
                        : img.filter === 'warm'
                        ? 'sepia(40%)'
                        : img.filter === 'invert'
                        ? 'invert(100%)'
                        : undefined,
                  }}
                />

                {/* Index badge */}
                <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-mono font-medium px-2 py-0.5 rounded-md">
                  #{index + 1}
                </div>

                {/* Quick overlay actions */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleQuickRotate(index)}
                    title="Rotar 90°"
                    className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditImage(img)}
                    title="Editar filtros, recortes y notas"
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    title="Eliminar de la lista"
                    className="p-1.5 bg-rose-600/80 hover:bg-rose-700 text-white rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Move order controls in preview */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-900/80 rounded-md p-0.5 backdrop-blur-xs">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMove(index, 'up')}
                    title="Mover antes en el PDF"
                    className={`p-1 rounded text-white transition-colors cursor-pointer ${
                      isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
                    }`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMove(index, 'down')}
                    title="Mover después en el PDF"
                    className={`p-1 rounded text-white transition-colors cursor-pointer ${
                      isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Meta & Inline Editing */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="truncate max-w-[170px]" title={img.name}>
                      {img.name}
                    </span>
                    <span className="font-mono tabular-nums">{formatBytes(img.size)}</span>
                  </div>

                  <input
                    type="text"
                    value={img.title}
                    onChange={(e) => handleUpdateTitle(index, e.target.value)}
                    placeholder="Título en el documento..."
                    className="w-full text-xs font-medium text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded px-2 py-1 transition-colors"
                  />

                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => handleUpdateCaption(index, e.target.value)}
                    placeholder="Nota o pie de foto..."
                    className="w-full text-xs text-slate-500 border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded px-2 py-1 mt-1 transition-colors"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">
                    {img.width}×{img.height}px
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditImage(img)}
                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Editar detalles</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
