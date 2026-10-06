import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Download,
  Archive,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Sliders,
  X,
  FileCheck,
  Check,
  RotateCw,
  Palette,
  Contrast,
} from 'lucide-react';
import {
  convertPdfToJpg,
  createZipFromPages,
  downloadBlob,
  getPdfPageCount,
  applyGrayscaleToPage,
  ConvertedPage,
} from '../utils/pdfToJpg';
import { formatBytes } from '../utils/imageProcessor';
import { UploadedImage } from '../types';
import jsPDF from 'jspdf';

interface PdfToJpgConverterProps {
  onImportImagesToEditor?: (images: UploadedImage[]) => void;
  onSwitchToImagesToPdf?: () => void;
}

export const PdfToJpgConverter: React.FC<PdfToJpgConverterProps> = ({
  onImportImagesToEditor,
  onSwitchToImagesToPdf,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);
  const [resolutionScale, setResolutionScale] = useState<number>(2.0); // 2.0 = 300 DPI approx
  const [jpgQuality, setJpgQuality] = useState<number>(0.92);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'bw_contrast'>('color');

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [convertedPages, setConvertedPages] = useState<ConvertedPage[]>([]);
  const [isCreatingZip, setIsCreatingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // Lightbox / Zoom view
  const [zoomPage, setZoomPage] = useState<ConvertedPage | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecciona un archivo en formato PDF (.pdf).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setConvertedPages([]);
    setDetectedPages(null);

    // Quick read to detect page count
    getPdfPageCount(file)
      .then((num) => {
        setDetectedPages(num);
      })
      .catch(() => {
        // Ignore if metadata read fails
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setErrorMessage(null);
    setProgressPercent(0);
    setProgressStatus('Iniciando extracción de páginas...');

    try {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
      const pages = await convertPdfToJpg(selectedFile, baseName, {
        scale: resolutionScale,
        quality: jpgQuality,
        colorMode,
        onProgress: (current, total, status) => {
          setProgressPercent(current);
          setProgressStatus(status);
        },
      });

      setConvertedPages(pages);
    } catch (err: any) {
      console.error('Error al convertir PDF a JPG:', err);
      setErrorMessage(
        err.message ||
          'Ocurrió un error al procesar el archivo PDF. Verifica que el documento no esté protegido con contraseña.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleToggleGrayscaleSingle = async (pageNumber: number, mode: 'grayscale' | 'bw_contrast' = 'grayscale') => {
    const pageIndex = convertedPages.findIndex((p) => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    try {
      const targetPage = convertedPages[pageIndex];
      const updatedPage = await applyGrayscaleToPage(targetPage, mode);

      const updatedPages = [...convertedPages];
      updatedPages[pageIndex] = updatedPage;
      setConvertedPages(updatedPages);
      if (zoomPage && zoomPage.pageNumber === pageNumber) {
        setZoomPage(updatedPage);
      }
    } catch (err) {
      console.error('Error aplicando blanco y negro a la página:', err);
    }
  };

  const handleConvertAllToGrayscale = async (mode: 'grayscale' | 'bw_contrast' = 'grayscale') => {
    if (convertedPages.length === 0 || isConverting) return;
    setIsConverting(true);
    setProgressPercent(10);
    setProgressStatus('Aplicando filtro Blanco y Negro a todas las páginas...');

    try {
      const updated: ConvertedPage[] = [];
      for (let i = 0; i < convertedPages.length; i++) {
        const page = convertedPages[i];
        const newPage = await applyGrayscaleToPage(page, mode);
        updated.push(newPage);
        setProgressPercent(Math.round(((i + 1) / convertedPages.length) * 100));
      }
      setConvertedPages(updated);
      if (zoomPage) {
        const updatedZoom = updated.find((p) => p.pageNumber === zoomPage.pageNumber);
        if (updatedZoom) setZoomPage(updatedZoom);
      }
    } catch (err) {
      console.error('Error convirtiendo todas las hojas a B&N:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadSingleJpg = (page: ConvertedPage) => {
    downloadBlob(page.blob, page.filename);
  };

  const handleRotatePage = async (pageNumber: number) => {
    const pageIndex = convertedPages.findIndex((p) => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    const targetPage = convertedPages[pageIndex];
    const img = new Image();
    img.src = targetPage.dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetPage.height;
    canvas.height = targetPage.width;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -targetPage.width / 2, -targetPage.height / 2);

    const newBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || targetPage.blob), 'image/jpeg', 0.92)
    );

    const newUrl = URL.createObjectURL(newBlob);

    // Revoke previous object URL if blob
    if (targetPage.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(targetPage.dataUrl);
    }

    const updatedPages = [...convertedPages];
    const updatedPageObj: ConvertedPage = {
      ...targetPage,
      dataUrl: newUrl,
      blob: newBlob,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: newBlob.size,
    };
    updatedPages[pageIndex] = updatedPageObj;

    setConvertedPages(updatedPages);
    if (zoomPage && zoomPage.pageNumber === pageNumber) {
      setZoomPage(updatedPageObj);
    }

    canvas.width = 0;
    canvas.height = 0;
  };

  const handleDownloadAllZip = async () => {
    if (convertedPages.length === 0) return;

    setIsCreatingZip(true);
    setZipProgress(0);

    try {
      const baseName = selectedFile
        ? selectedFile.name.replace(/\.[^/.]+$/, '')
        : 'Documento';
      const zipFilename = `${baseName}_hojas_JPG.zip`;

      const zipBlob = await createZipFromPages(convertedPages, zipFilename, (percent) => {
        setZipProgress(percent);
      });

      downloadBlob(zipBlob, zipFilename);
    } catch (err: any) {
      console.error('Error creando archivo ZIP:', err);
      setErrorMessage('No se pudo generar el archivo ZIP comprimido.');
    } finally {
      setIsCreatingZip(false);
    }
  };

  const handleShareMobile = async () => {
    if (convertedPages.length === 0) return;

    // Check if navigator.share supports files
    if (navigator.share && navigator.canShare) {
      try {
        // Share first page or create zip
        const baseName = selectedFile
          ? selectedFile.name.replace(/\.[^/.]+$/, '')
          : 'Documento';
        const zipBlob = await createZipFromPages(convertedPages, `${baseName}_JPG.zip`);
        const file = new File([zipBlob], `${baseName}_JPG.zip`, { type: 'application/zip' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Hojas de ${baseName}`,
            text: `Aquí tienes las hojas extraídas en JPG de ${baseName}`,
          });
          return;
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fallback to downloading zip
          handleDownloadAllZip();
        }
        return;
      }
    }

    // Fallback: download zip directly
    handleDownloadAllZip();
  };

  const handleImportToEditor = () => {
    if (!onImportImagesToEditor || convertedPages.length === 0) return;

    const importedImages: UploadedImage[] = convertedPages.map((page, idx) => ({
      id: `imported_page_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: page.filename,
      type: 'image/jpeg',
      size: page.sizeBytes,
      originalUrl: page.dataUrl,
      previewUrl: page.dataUrl,
      width: page.width,
      height: page.height,
      rotation: 0,
      flipH: false,
      flipV: false,
      fit: 'contain',
      filter: 'none',
      brightness: 0,
      contrast: 0,
      saturation: 100,
      title: `Página ${page.pageNumber}`,
      caption: '',
    }));

    onImportImagesToEditor(importedImages);
  };

  // Quick sample generator for 1-click testing
  const handleLoadSamplePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Page 1
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FolioPDF Demo - Hoja 1', 20, 25);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(14);
    doc.text('Documento de prueba para extracción de páginas a JPG.', 20, 60);
    doc.setFontSize(11);
    doc.text(
      'Esta es una página generada para probar la conversión instantánea de PDF a imagen.',
      20,
      75
    );

    // Decorative graphic
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(20, 95, 170, 80, 5, 5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(12);
    doc.text('Ilustración / Gráfico de ejemplo de la Hoja 1', 30, 140);

    // Page 2
    doc.addPage();
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FolioPDF Demo - Hoja 2', 20, 25);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(14);
    doc.text('Segunda página de contenido gráfico y textual.', 20, 60);

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 80, 170, 90, 5, 5, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.text('Resumen y notas finales del documento.', 30, 130);

    // Page 3
    doc.addPage();
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FolioPDF Demo - Hoja 3', 20, 25);
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(13);
    doc.text('Tercera página del archivo para comprobar la conversión de múltiples hojas.', 20, 65);

    const pdfBlob = doc.output('blob');
    const sampleFile = new File([pdfBlob], 'documento_ejemplo_3_hojas.pdf', {
      type: 'application/pdf',
    });

    handleFileSelect(sampleFile);
  };

  const totalConvertedBytes = convertedPages.reduce((acc, p) => acc + p.sizeBytes, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ImageIcon className="w-64 h-64 text-white" />
        </div>

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Herramienta Inversa: PDF a JPG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Convierte cada hoja de un PDF en imagen JPG
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Sube cualquier documento PDF y extrae todas sus páginas en imágenes de alta resolución.
            Descarga las hojas individuales o todas juntas en un archivo ZIP. Procesamiento 100%
            privado y seguro en tu dispositivo.
          </p>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload & Configuration Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        {/* Drag and drop box */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Arrastra y suelta tu archivo PDF aquí
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              O haz clic para buscarlo en tu teléfono o carpeta de archivos.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Seleccionar PDF
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSamplePdf();
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Probar con PDF de ejemplo (3 hojas)</span>
              </button>
            </div>
          </div>
        ) : (
          /* File Loaded Status Card */
          <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedFile.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatBytes(selectedFile.size)}
                  {detectedPages ? ` · ${detectedPages} páginas detectadas` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isConverting}
                className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer text-center"
              >
                Cambiar archivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setConvertedPages([]);
                }}
                disabled={isConverting}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quality Settings */}
        {selectedFile && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Ajustes de calidad y nitidez de las imágenes JPG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setResolutionScale(1.5)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionScale === 1.5
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Estándar (150 DPI)</span>
                  {resolutionScale === 1.5 && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Ligero y rápido. Perfecto para enviar por WhatsApp o correo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setResolutionScale(2.0)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionScale === 2.0
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Alta Calidad (300 DPI)</span>
                  {resolutionScale === 2.0 && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Recomendado. Gran nitidez de lectura para textos e impresión.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setResolutionScale(3.0)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionScale === 3.0
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Ultra Nitidez (450 DPI)</span>
                  {resolutionScale === 3.0 && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Máxima resolución. Para planos, gráficos técnicos y catálogos.
                </p>
              </button>
            </div>

            {/* Color Mode / Blanco y Negro Selector */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Modo de Color / Blanco y Negro</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setColorMode('color')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    colorMode === 'color'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Color Original</span>
                    {colorMode === 'color' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Conserva todos los colores y tonos originales del documento.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setColorMode('grayscale')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    colorMode === 'grayscale'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Blanco y Negro (B&N)</span>
                    {colorMode === 'grayscale' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Escala de grises suave y limpia, ideal para fotos y documentos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setColorMode('bw_contrast')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    colorMode === 'bw_contrast'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">B&N Documento / DNI</span>
                    {colorMode === 'bw_contrast' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Alto contraste: fondo blanco puro y texto oscuro definido para escaneos.
                  </p>
                </button>
              </div>
            </div>

            {/* Main Action Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                {detectedPages
                  ? `Se generarán ${detectedPages} archivos JPG independientes.`
                  : 'Listo para procesar todas las hojas del documento.'}
              </span>

              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Convirtiendo páginas...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Convertir a imágenes JPG</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar during conversion */}
        {isConverting && (
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>{progressStatus || 'Convirtiendo documento...'}</span>
              </span>
              <span className="font-mono tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Section (When pages are successfully converted) */}
      {convertedPages.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          {/* Header of results */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  ¡{convertedPages.length} {convertedPages.length === 1 ? 'página convertida' : 'páginas convertidas'} a JPG!
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tamaño total: {formatBytes(totalConvertedBytes)} · Puedes descargar todas en un solo ZIP o cada una por separado.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Download all as ZIP */}
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isCreatingZip}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreatingZip ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Empaquetando ZIP ({zipProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Descargar todo en ZIP</span>
                  </>
                )}
              </button>

              {/* Mobile Share */}
              <button
                type="button"
                onClick={handleShareMobile}
                className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Compartir por WhatsApp, Telegram, Correo o Drive"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>

              {/* Convert all to B&W button */}
              <button
                type="button"
                onClick={() => handleConvertAllToGrayscale('grayscale')}
                disabled={isConverting}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Convertir todas las hojas a Blanco y Negro"
              >
                <Contrast className="w-4 h-4 text-slate-700" />
                <span>Todo a Blanco y Negro</span>
              </button>

              {/* Import to Editor */}
              {onImportImagesToEditor && (
                <button
                  type="button"
                  onClick={handleImportToEditor}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Añade estas páginas al creador de PDF para editarlas o reordenarlas"
                >
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  <span>Pasar al editor de PDF</span>
                </button>
              )}
            </div>
          </div>

            {/* Grid of converted pages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {convertedPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col group"
                >
                  {/* Header tag */}
                  <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">Hoja {page.pageNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        ({page.width > page.height ? 'Horizontal' : 'Vertical'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleGrayscaleSingle(page.pageNumber, 'grayscale');
                        }}
                        className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                        title="Poner esta hoja en Blanco y Negro"
                      >
                        B&N
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(page.pageNumber);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Girar 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatBytes(page.sizeBytes)}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Image (Adaptive Aspect Ratio) */}
                  <div
                    onClick={() => setZoomPage(page)}
                    className="min-h-[220px] max-h-[300px] bg-slate-100/60 p-2 relative flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    <img
                      src={page.dataUrl}
                      alt={`Página ${page.pageNumber}`}
                      className="max-w-full max-h-[260px] object-contain rounded shadow-2xs group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/90 text-slate-800 shadow-sm">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Footer details & download button */}
                  <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {page.width} × {page.height} px
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingleJpg(page)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar JPG</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          {/* Bottom Callout: Switch back to Images to PDF */}
          {onSwitchToImagesToPdf && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 text-center sm:text-left">
                ¿Quieres volver a maquetar o crear un PDF con tus fotografías?
              </span>
              <button
                type="button"
                onClick={onSwitchToImagesToPdf}
                className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline"
              >
                Ir a Crear PDF desde Imágenes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Vista Previa · Hoja {zoomPage.pageNumber} ({zoomPage.width} × {zoomPage.height} px)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRotatePage(zoomPage.pageNumber)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  title="Girar 90°"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Girar 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleGrayscaleSingle(zoomPage.pageNumber, 'grayscale')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  title="Convertir esta hoja a Blanco y Negro"
                >
                  <Contrast className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Blanco y Negro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSingleJpg(zoomPage)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar este JPG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoomPage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Cerrar ampliación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 bg-slate-900 p-4 flex items-center justify-center overflow-auto">
              <img
                src={zoomPage.dataUrl}
                alt={`Página ${zoomPage.pageNumber}`}
                className="max-w-full max-h-full object-contain rounded shadow-2xl bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
